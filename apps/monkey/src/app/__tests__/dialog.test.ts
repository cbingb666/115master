import type { DialogHandle, DialogOutcome, DialogService } from '@115master/ui'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createAppDialogService } from '../dialogAdapter'
import { instrumentDialogRouter, dialogMarker as marker } from '../testing/dialogRouter'

interface FakeDialogHandle extends DialogHandle {
  closeCalls: number
}

function fakeService() {
  const handles: FakeDialogHandle[] = []
  const service = {
    create: () => {
      let settled = false
      let resolve!: (outcome: DialogOutcome) => void
      const closed = new Promise<DialogOutcome>((onResolve) => {
        resolve = onResolve
      })
      const settle = (reason: DialogOutcome['reason']) => {
        if (settled)
          return
        settled = true
        resolve({ reason })
      }
      const handle: FakeDialogHandle = {
        closed,
        closeCalls: 0,
        close: () => {
          handle.closeCalls += 1
          settle('programmatic')
        },
        destroy: () => settle('destroy'),
      }

      handles.push(handle)
      return handle
    },
  } as unknown as DialogService

  return { handles, service }
}

function memoryRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/tags', component: { render: () => null } },
    ],
  })
}

async function waitForMarker(router: ReturnType<typeof memoryRouter>, expected: string | null) {
  await vi.waitFor(() => {
    expect(marker(router) ?? null).toBe(expected)
  })
}

describe('app Dialog history adapter', () => {
  it('serializes history entries for Dialogs created in the same tick', async () => {
    const source = memoryRouter()
    await source.push('/')
    const observed = instrumentDialogRouter(source)
    const fake = fakeService()
    const dialog = createAppDialogService(fake.service, observed.router, vi.fn())

    dialog.create({ title: 'Parent', history: true })
    dialog.create({ title: 'Child', history: true })

    await vi.waitFor(() => expect(marker(source)).toMatch(/-2$/))
    await vi.waitFor(() => expect(fake.handles).toHaveLength(2))
    expect(fake.handles.map(handle => handle.closeCalls)).toEqual([0, 0])

    source.back()
    await vi.waitFor(() => expect(fake.handles[1]?.closeCalls).toBe(1))
    expect(marker(source)).toMatch(/-1$/)
    expect(fake.handles[0]?.closeCalls).toBe(0)

    source.back()
    await vi.waitFor(() => expect(fake.handles[0]?.closeCalls).toBe(1))
    expect(observed.count()).toBe(0)
  })

  it('lets same-tick business navigation supersede the initial history push', async () => {
    const source = memoryRouter()
    await source.push('/')
    const observed = instrumentDialogRouter(source)
    const fake = fakeService()
    const dialog = createAppDialogService(fake.service, observed.router, vi.fn())

    dialog.create({ title: 'Immediate history', history: true })
    await source.push('/tags')

    expect(source.currentRoute.value.path).toBe('/tags')
    expect(marker(source)).toBeUndefined()
    await vi.waitFor(() => expect(fake.handles[0]?.closeCalls).toBe(1))
    expect(observed.count()).toBe(0)
  })

  it('discards the queued Dialog Stack when same-tick business navigation wins', async () => {
    const source = memoryRouter()
    await source.push('/')
    const observed = instrumentDialogRouter(source)
    const fake = fakeService()
    const dialog = createAppDialogService(fake.service, observed.router, vi.fn())

    dialog.create({ title: 'Parent', history: true })
    dialog.create({ title: 'Child', history: true })
    await source.push('/tags')

    expect(source.currentRoute.value.path).toBe('/tags')
    expect(marker(source)).toBeUndefined()
    await vi.waitFor(() => {
      expect(fake.handles.map(handle => handle.closeCalls)).toEqual([1, 1])
    })
    expect(observed.count()).toBe(0)
  })

  it('keeps ancestors open while nested Dialogs push and closes them in back order', async () => {
    const source = memoryRouter()
    await source.push('/')
    const observed = instrumentDialogRouter(source)
    const fake = fakeService()
    const dialog = createAppDialogService(fake.service, observed.router, vi.fn())

    dialog.create({ title: 'Parent', history: true })
    await vi.waitFor(() => expect(marker(source)).toEqual(expect.any(String)))
    const parentMarker = marker(source)!

    expect(observed.count()).toBe(1)
    expect(fake.handles[0]?.closeCalls).toBe(0)

    dialog.create({ title: 'Child', history: true })
    await vi.waitFor(() => expect(marker(source)).not.toBe(parentMarker))

    expect(fake.handles[0]?.closeCalls).toBe(0)
    expect(fake.handles[1]?.closeCalls).toBe(0)
    expect(observed.count()).toBe(1)

    source.back()
    await waitForMarker(source, parentMarker)
    await vi.waitFor(() => expect(fake.handles[1]?.closeCalls).toBe(1))

    expect(fake.handles[0]?.closeCalls).toBe(0)
    await expect(fake.handles[1]?.closed).resolves.toEqual({ reason: 'programmatic' })

    source.back()
    await waitForMarker(source, null)
    await vi.waitFor(() => expect(fake.handles[0]?.closeCalls).toBe(1))

    await expect(fake.handles[0]?.closed).resolves.toEqual({ reason: 'programmatic' })
    expect(observed.count()).toBe(0)
  })

  it('discards a forward route Stack and ignores its stale marker after Back', async () => {
    const source = memoryRouter()
    await source.push('/')
    const observed = instrumentDialogRouter(source)
    const first = fakeService()
    const dialog = createAppDialogService(first.service, observed.router, vi.fn())

    dialog.create({ title: 'Forward route', history: true })
    await vi.waitFor(() => expect(marker(source)).toEqual(expect.any(String)))
    const staleMarker = marker(source)!

    await source.push('/tags')
    await vi.waitFor(() => expect(first.handles[0]?.closeCalls).toBe(1))

    expect(observed.count()).toBe(0)
    expect(source.currentRoute.value.path).toBe('/tags')

    source.back()
    await waitForMarker(source, staleMarker)

    expect(source.currentRoute.value.path).toBe('/')
    expect(first.handles[0]?.closeCalls).toBe(1)
    expect(observed.count()).toBe(0)

    const reloaded = fakeService()
    const reloadedDialog = createAppDialogService(
      reloaded.service,
      observed.router,
      vi.fn(),
    )

    reloadedDialog.create({ title: 'Reloaded adapter', history: true })
    await vi.waitFor(() => expect(marker(source)).not.toBe(staleMarker))
    const freshMarker = marker(source)!

    expect(freshMarker).toMatch(/^dialog-/)
    expect(reloaded.handles[0]?.closeCalls).toBe(0)
    expect(observed.count()).toBe(1)

    source.back()
    await waitForMarker(source, staleMarker)
    await vi.waitFor(() => expect(reloaded.handles[0]?.closeCalls).toBe(1))

    expect(source.currentRoute.value.path).toBe('/')
    expect(observed.count()).toBe(0)
  })

  it('releases its route listener when a settled Dialog cannot unwind history', async () => {
    const source = memoryRouter()
    await source.push('/')
    const observed = instrumentDialogRouter(source)
    const fake = fakeService()
    const onError = vi.fn()
    const dialog = createAppDialogService(fake.service, observed.router, onError)
    const handle = dialog.create({ title: 'Guarded history', history: true })

    await vi.waitFor(() => expect(marker(source)).toEqual(expect.any(String)))
    source.beforeEach((to, from) => {
      if (from.query._dlg && !to.query._dlg)
        return false
    })

    handle.close()

    await expect(handle.closed).resolves.toEqual({ reason: 'programmatic' })
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(observed.count()).toBe(0)
  })
})
