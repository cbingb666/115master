import type { Router } from 'vue-router'

export function dialogMarker(router: Router) {
  const value = router.currentRoute.value.query._dlg

  return Array.isArray(value) ? value[0] : value
}

export function instrumentDialogRouter(
  source: Router,
  onChange: (listeners: number) => void = () => undefined,
) {
  let listeners = 0
  const addAfterEach = source.afterEach.bind(source)
  const afterEach: Router['afterEach'] = (guard) => {
    listeners += 1
    onChange(listeners)
    const remove = addAfterEach(guard)
    let active = true

    return () => {
      if (!active)
        return
      active = false
      listeners -= 1
      onChange(listeners)
      remove()
    }
  }
  const router = new Proxy(source, {
    get(target, property, receiver) {
      if (property === 'afterEach')
        return afterEach
      const value = Reflect.get(target, property, receiver)

      return typeof value === 'function' ? value.bind(target) : value
    },
  }) as Router

  return {
    count: () => listeners,
    router,
  }
}
