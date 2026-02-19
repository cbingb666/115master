/** 泛型 LRU 缓存 */
export function useDriveCache<T>(max = 50) {
  const store = new Map<string, T>()

  function evict() {
    if (store.size <= max)
      return
    const oldest = store.keys().next().value!
    store.delete(oldest)
  }

  function get(key: string): T | undefined {
    const entry = store.get(key)
    if (!entry)
      return undefined
    /** LRU: 移到末尾 */
    store.delete(key)
    store.set(key, entry)
    return entry
  }

  function set(key: string, value: T) {
    store.delete(key)
    store.set(key, value)
    evict()
  }

  function invalidate(key: string) {
    store.delete(key)
  }

  function clear() {
    store.clear()
  }

  return { get, set, invalidate, clear }
}

export type UseDriveCacheReturn<T> = ReturnType<typeof useDriveCache<T>>
