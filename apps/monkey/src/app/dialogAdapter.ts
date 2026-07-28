import type {
  DialogCreateOptions,
  DialogHandle,
  DialogService,
} from '@115master/ui'
import type { LocationQuery, Router } from 'vue-router'

const QUERY_KEY = '_dlg'

export interface AppDialogCreateOptions extends DialogCreateOptions {
  history?: boolean
}

export interface AppDialogService extends Omit<DialogService, 'create'> {
  create: (options: AppDialogCreateOptions) => DialogHandle
}

interface HistoryRecord {
  id: string
  parent: string | null
  handle: DialogHandle
  pushed: boolean
  settled: boolean
  discarded: boolean
  unwinding: boolean
}

function marker(query: LocationQuery) {
  const value = query[QUERY_KEY]

  return Array.isArray(value) ? value[0] : value
}

/**
 * Adds Monkey's browser-history behavior to one UI Dialog service instance.
 * The adapter mutates only that application-owned instance, so DialogHost and
 * useDialog continue to share the same isolated service.
 */
export function createAppDialogService(
  service: DialogService,
  router: Router,
  onError: (error: unknown) => void,
): AppDialogService {
  const create = service.create
  const records = new Map<string, HistoryRecord>()
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  const pushQueue: HistoryRecord[] = []
  let next = 0
  let remove: (() => void) | undefined
  let pushing = false

  function clear(record: HistoryRecord) {
    records.delete(record.id)

    if (records.size !== 0)
      return
    remove?.()
    remove = undefined
  }

  function discard(record: HistoryRecord) {
    if (record.discarded)
      return

    record.discarded = true
    clear(record)
    if (!record.settled)
      record.handle.close()
  }

  function ancestors(id: string | null | undefined) {
    const retained = new Set<string>()
    let current = id

    while (current) {
      const record = records.get(current)

      if (!record || retained.has(current))
        break
      retained.add(current)
      current = record.parent
    }
    return retained
  }

  function unwind(record: HistoryRecord) {
    if (!record.pushed || record.discarded || record.unwinding)
      return

    const current = marker(router.currentRoute.value.query)

    if (current === record.id) {
      record.unwinding = true
      router.back()
      return
    }
    if (current === record.parent)
      clear(record)
    else if (!ancestors(current).has(record.id))
      clear(record)
  }

  function watch() {
    if (remove)
      return

    remove = router.afterEach((to, _from, failure) => {
      if (failure) {
        const abandoned = [...records.values()]
          .filter(record => record.unwinding)

        abandoned.forEach(discard)
        if (abandoned.length > 0)
          onError(failure)
        return
      }

      const retained = ancestors(marker(to.query))
      const leaving = [...records.values()]
        .filter(record => record.pushed && !retained.has(record.id))
        .reverse()

      leaving.forEach(discard)

      ;[...records.values()]
        .filter(record => record.settled)
        .forEach(unwind)
    })
  }

  async function push(record: HistoryRecord) {
    if (record.discarded)
      return true
    if (record.settled) {
      discard(record)
      return true
    }

    const current = marker(router.currentRoute.value.query)

    record.parent = current && records.has(current) ? current : null

    try {
      const failure = await router.push({
        query: {
          ...router.currentRoute.value.query,
          [QUERY_KEY]: record.id,
        },
      })

      if (failure) {
        discard(record)
        return false
      }
      record.pushed = true
      if (record.settled)
        unwind(record)
      return true
    }
    catch (cause) {
      discard(record)
      onError(cause)
      return false
    }
  }

  async function drainPushQueue() {
    if (pushing)
      return

    pushing = true
    try {
      let record = pushQueue.shift()

      while (record) {
        const canContinue = await push(record)

        if (!canContinue) {
          pushQueue.splice(0).reverse().forEach(discard)
          break
        }
        record = pushQueue.shift()
      }
    }
    finally {
      pushing = false
    }
  }

  function enqueuePush(record: HistoryRecord) {
    pushQueue.push(record)
    void drainPushQueue()
  }

  function history(handle: DialogHandle) {
    const id = `dialog-${nonce}-${++next}`
    const record: HistoryRecord = {
      id,
      parent: null,
      handle,
      pushed: false,
      settled: false,
      discarded: false,
      unwinding: false,
    }

    records.set(id, record)
    watch()
    enqueuePush(record)

    void handle.closed.then(
      () => {
        record.settled = true
        unwind(record)
      },
      () => {
        record.settled = true
        unwind(record)
      },
    )
  }

  const dialog = service as AppDialogService
  dialog.create = (options) => {
    const ui = { ...options }
    delete ui.history
    const handle = create(ui)

    if (options.history)
      history(handle)
    return handle
  }

  return dialog
}
