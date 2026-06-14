import type { ILogger } from '../logger/types.ts'
import localforage from 'localforage'
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CLEANUP_BATCH_SIZE, DEFAULT_STORE_NAME, META_STORE_NAME, STORAGE_QUOTA_THRESHOLD } from './const.ts'
import { CacheCore, MetaStore, QuotaManager } from './index.ts'

const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  iterate: vi.fn(),
}

vi.mock('localforage', () => ({
  default: {
    createInstance: vi.fn(() => mockStorage),
    INDEXEDDB: 'IndexedDB',
  },
}))

const silentLogger: ILogger = {
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  sub: vi.fn(() => silentLogger),
}

function createCache<T>(options: ConstructorParameters<typeof CacheCore<T>>[0] = {}) {
  return new CacheCore<T>({ ...options, logger: silentLogger })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('cacheCore', () => {
  it('creates storage with default options', () => {
    createCache()
    expect(localforage.createInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        name: DEFAULT_STORE_NAME,
        storeName: 'cache',
        version: 1,
        driver: 'IndexedDB',
      }),
    )
  })

  it('allows custom name and storeName', () => {
    createCache({ name: 'my_cache', storeName: 'my_store' })
    expect(localforage.createInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my_cache',
        storeName: 'my_store',
      }),
    )
  })

  it('returns cached value from get', async () => {
    const cache = createCache<string>()
    const value = { value: 'hello', createdAt: 1, updatedAt: 2 }
    mockStorage.getItem.mockResolvedValue(value)

    const result = await cache.get('key')
    expect(result).toEqual(value)
    expect(mockStorage.getItem).toHaveBeenCalledWith('key')
  })

  it('returns null when cache misses', async () => {
    const cache = createCache<string>()
    mockStorage.getItem.mockResolvedValue(null)

    const result = await cache.get('key')
    expect(result).toBeNull()
  })

  it('removes stale versioned entries', async () => {
    const cache = createCache<string>({ version: 2 })
    mockStorage.getItem.mockResolvedValue({ value: 'old', version: 1, createdAt: 1, updatedAt: 1 })

    const result = await cache.get('key')
    expect(result).toBeNull()
    expect(mockStorage.removeItem).toHaveBeenCalledWith('key')
  })

  it('sets value with metadata', async () => {
    const cache = createCache<string>()
    mockStorage.getItem.mockResolvedValue(null)

    await cache.set('key', 'value')

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'key',
      expect.objectContaining({
        value: 'value',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      }),
    )
  })

  it('removes value and metadata', async () => {
    const cache = createCache<string>()
    await cache.remove('key')
    expect(mockStorage.removeItem).toHaveBeenCalledWith('key')
  })

  it('clears storage and metadata', async () => {
    const cache = createCache<string>()
    await cache.clear()
    expect(mockStorage.clear).toHaveBeenCalled()
  })

  it('does not touch metadata when quota management is disabled', async () => {
    const cache = createCache<string>({ enableQuotaManagement: false })
    const recordRemoval = vi.spyOn(QuotaManager.prototype, 'recordRemoval')

    await cache.clear()
    expect(mockStorage.clear).toHaveBeenCalled()
    expect(recordRemoval).not.toHaveBeenCalled()
  })

  it('returns cache age', async () => {
    const cache = createCache<string>()
    const createdAt = Date.now() - 1000
    mockStorage.getItem.mockResolvedValue({ value: 'hello', createdAt, updatedAt: createdAt, version: 1 })

    const age = await cache.getAge('key')
    expect(age).toBeGreaterThanOrEqual(1000)
  })

  it('returns quota manager instance', () => {
    const cache = createCache<string>()
    expect(cache.getQuotaManager()).toBeInstanceOf(QuotaManager)
  })

  it('returns undefined age for missing key', async () => {
    const cache = createCache<string>()
    mockStorage.getItem.mockResolvedValue(null)

    const age = await cache.getAge('key')
    expect(age).toBeUndefined()
  })

  it('returns cache freshness', async () => {
    const cache = createCache<string>()
    const updatedAt = Date.now() - 2000
    mockStorage.getItem.mockResolvedValue({ value: 'hello', createdAt: updatedAt, updatedAt, version: 1 })

    const freshness = await cache.getFreshness('key')
    expect(freshness).toBeGreaterThanOrEqual(2000)
  })

  it('returns undefined freshness for missing key', async () => {
    const cache = createCache<string>()
    mockStorage.getItem.mockResolvedValue(null)

    const freshness = await cache.getFreshness('key')
    expect(freshness).toBeUndefined()
  })

  it('does not record access when quota management is disabled', async () => {
    const cache = createCache<string>({ enableQuotaManagement: false })
    const recordAccess = vi.spyOn(QuotaManager.prototype, 'recordAccess')
    mockStorage.getItem.mockResolvedValue({ value: 'hello', version: 1, createdAt: 1, updatedAt: 2 })

    await cache.get('key')
    expect(recordAccess).not.toHaveBeenCalled()
  })

  it('does not estimate size or auto cleanup when quota management is disabled', async () => {
    const cache = createCache<string>({ enableQuotaManagement: false })
    const recordAccess = vi.spyOn(QuotaManager.prototype, 'recordAccess')
    const autoCleanup = vi.spyOn(QuotaManager.prototype, 'autoCleanup')
    mockStorage.getItem.mockResolvedValue(null)

    await cache.set('key', 'value')
    const stored = mockStorage.setItem.mock.calls[0][1]
    expect(stored.size).toBeUndefined()
    expect(recordAccess).not.toHaveBeenCalled()
    expect(autoCleanup).not.toHaveBeenCalled()
  })

  it('retries set after quota error when cleanup succeeds', async () => {
    const cache = createCache<string>()
    mockStorage.getItem.mockResolvedValue(null)
    mockStorage.setItem
      .mockRejectedValueOnce(Object.assign(new DOMException('Quota exceeded', 'QuotaExceededError'), { name: 'QuotaExceededError' }))
      .mockResolvedValueOnce(undefined)

    const cleanup = vi.spyOn(QuotaManager.prototype, 'cleanup').mockResolvedValueOnce(['old-key'])

    await cache.set('key', 'value')
    expect(cleanup).toHaveBeenCalled()
    expect(mockStorage.setItem).toHaveBeenCalledTimes(3)
  })

  it('does not retry set after quota error when cleanup is empty', async () => {
    const cache = createCache<string>()
    mockStorage.getItem.mockResolvedValue(null)
    mockStorage.setItem.mockRejectedValueOnce(Object.assign(new DOMException('Quota exceeded', 'QuotaExceededError'), { name: 'QuotaExceededError' }))

    const cleanup = vi.spyOn(QuotaManager.prototype, 'cleanup').mockResolvedValueOnce([])

    await cache.set('key', 'value')
    expect(cleanup).toHaveBeenCalled()
    expect(mockStorage.setItem).toHaveBeenCalledTimes(1)
  })

  it('logs non-quota errors on set', async () => {
    const errorLogger = vi.fn()
    const logger: ILogger = { ...silentLogger, error: errorLogger }
    const cache = new CacheCore<string>({ logger })
    mockStorage.getItem.mockResolvedValue(null)
    mockStorage.setItem.mockRejectedValueOnce(new Error('storage failure'))

    await cache.set('key', 'value')
    expect(errorLogger).toHaveBeenCalled()
  })

  describe('estimateSize', () => {
    it('estimates Blob size', async () => {
      const cache = createCache<Blob>()
      const blob = new Blob(['hello'], { type: 'text/plain' })
      mockStorage.getItem.mockResolvedValue(null)

      await cache.set('key', blob)
      const stored = mockStorage.setItem.mock.calls[0][1]
      expect(stored.size).toBe(blob.size)
    })

    it('estimates Blob array size', async () => {
      const cache = createCache<Blob[]>()
      const blobs = [
        new Blob(['a'], { type: 'text/plain' }),
        new Blob(['bc'], { type: 'text/plain' }),
      ]
      mockStorage.getItem.mockResolvedValue(null)

      await cache.set('key', blobs)
      const stored = mockStorage.setItem.mock.calls[0][1]
      expect(stored.size).toBe(3)
    })

    it('ignores non-Blob items in Blob array', async () => {
      const cache = createCache<Array<Blob | string>>()
      const blobs = [new Blob(['a'], { type: 'text/plain' }), 'not-a-blob']
      mockStorage.getItem.mockResolvedValue(null)

      await cache.set('key', blobs)
      const stored = mockStorage.setItem.mock.calls[0][1]
      expect(stored.size).toBe(1)
    })

    it('estimates plain object size', async () => {
      const cache = createCache<{ a: number }>()
      mockStorage.getItem.mockResolvedValue(null)

      await cache.set('key', { a: 1 })
      const stored = mockStorage.setItem.mock.calls[0][1]
      expect(stored.size).toBeGreaterThan(0)
    })

    it('skips size when value is not serializable', async () => {
      const cache = createCache<unknown>()
      mockStorage.getItem.mockResolvedValue(null)
      const value = {
        toJSON: () => {
          throw new Error('fail')
        },
      }

      await cache.set('key', value)
      const stored = mockStorage.setItem.mock.calls[0][1]
      expect(stored.size).toBeUndefined()
    })
  })
})

describe('metaStore', () => {
  it('creates meta storage with defaults', () => {
    const metaStore = new MetaStore(undefined, undefined, silentLogger)
    expect(localforage.createInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        name: DEFAULT_STORE_NAME,
        storeName: META_STORE_NAME,
      }),
    )
    expect(metaStore).toBeDefined()
  })

  it('generates full key with storeName prefix', async () => {
    const metaStore = new MetaStore('name', 'store', silentLogger)
    mockStorage.getItem.mockResolvedValue(null)

    await metaStore.getMeta('key')
    expect(mockStorage.getItem).toHaveBeenCalledWith('store:key')
  })

  it('filters meta by storeName', async () => {
    const metaStore = new MetaStore('name', 'store', silentLogger)
    mockStorage.iterate.mockImplementation((callback: (value: unknown) => void) => {
      callback({ storeName: 'other', key: 'a' })
      callback({ storeName: 'store', key: 'b' })
    })

    const result = await metaStore.getAllMeta()
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('b')
  })

  it('sorts meta by lastAccessed descending', async () => {
    const metaStore = new MetaStore('name', 'store', silentLogger)
    mockStorage.iterate.mockImplementation((callback: (value: unknown) => void) => {
      callback({ storeName: 'store', key: 'a', lastAccessed: 10 })
      callback({ storeName: 'store', key: 'b', lastAccessed: 30 })
    })

    const result = await metaStore.getSortedByLastAccessed(false)
    expect(result.map(item => item.key)).toEqual(['b', 'a'])
  })

  it('preserves existing size in updateMeta when size is omitted', async () => {
    const metaStore = new MetaStore('name', 'store', silentLogger)
    mockStorage.getItem.mockResolvedValue({
      key: 'key',
      fullKey: 'store:key',
      storeName: 'store',
      lastAccessed: 1,
      createdAt: 1,
      updatedAt: 1,
      size: 42,
    })

    await metaStore.updateMeta('key')
    const stored = mockStorage.setItem.mock.calls[0][1]
    expect(stored.size).toBe(42)
  })

  it('logs error when updateMeta fails', async () => {
    const errorLogger = vi.fn()
    const logger: ILogger = { ...silentLogger, error: errorLogger, sub: () => ({ ...silentLogger, error: errorLogger }) }
    const metaStore = new MetaStore('name', 'store', logger)
    mockStorage.getItem.mockRejectedValue(new Error('read error'))

    await metaStore.updateMeta('key')
    expect(errorLogger).toHaveBeenCalled()
  })

  it('returns createdAt and updatedAt for a key', async () => {
    const metaStore = new MetaStore('name', 'store', silentLogger)
    mockStorage.getItem.mockResolvedValue({
      key: 'key',
      fullKey: 'store:key',
      storeName: 'store',
      lastAccessed: 3,
      createdAt: 1,
      updatedAt: 2,
    })

    expect(await metaStore.getCreatedAt('key')).toBe(1)
    expect(await metaStore.getUpdatedAt('key')).toBe(2)
  })

  it('returns undefined createdAt and updatedAt for missing key', async () => {
    const metaStore = new MetaStore('name', 'store', silentLogger)
    mockStorage.getItem.mockResolvedValue(null)

    expect(await metaStore.getCreatedAt('key')).toBeUndefined()
    expect(await metaStore.getUpdatedAt('key')).toBeUndefined()
  })

  it('sorts meta by createdAt', async () => {
    const metaStore = new MetaStore('name', 'store', silentLogger)
    mockStorage.iterate.mockImplementation((callback: (value: unknown) => void) => {
      callback({ storeName: 'store', key: 'b', createdAt: 20 })
      callback({ storeName: 'store', key: 'a', createdAt: 10 })
    })

    const result = await metaStore.getSortedByCreatedAt()
    expect(result.map(item => item.key)).toEqual(['a', 'b'])
  })

  it('sorts meta by updatedAt descending', async () => {
    const metaStore = new MetaStore('name', 'store', silentLogger)
    mockStorage.iterate.mockImplementation((callback: (value: unknown) => void) => {
      callback({ storeName: 'store', key: 'b', updatedAt: 20 })
      callback({ storeName: 'store', key: 'a', updatedAt: 30 })
    })

    const result = await metaStore.getSortedByUpdatedAt(false)
    expect(result.map(item => item.key)).toEqual(['a', 'b'])
  })
})

describe('quotaManager', () => {
  function createQuotaManager(removeItem = vi.fn()) {
    return new QuotaManager(removeItem, 'name', 'store', silentLogger)
  }

  it('returns true when usage exceeds threshold', async () => {
    const quota = createQuotaManager()
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue({ usage: 900, quota: 1000 }),
        },
      },
      writable: true,
      configurable: true,
    })

    expect(await quota.shouldCleanup()).toBe(true)
  })

  it('returns false when usage is below threshold', async () => {
    const quota = createQuotaManager()
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue({ usage: 100, quota: 1000 }),
        },
      },
      writable: true,
      configurable: true,
    })

    expect(await quota.shouldCleanup()).toBe(false)
  })

  it('returns default usage when storage estimate values are undefined', async () => {
    const quota = createQuotaManager()
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue({ usage: undefined, quota: undefined }),
        },
      },
      writable: true,
      configurable: true,
    })

    const result = await quota.getStorageUsage()
    expect(result).toEqual({ usage: 0, quota: 0, usageRatio: 0 })
  })

  it('returns empty array when no oldest items to cleanup', async () => {
    const quota = createQuotaManager()
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue({ usage: 900, quota: 1000 }),
        },
      },
      writable: true,
      configurable: true,
    })

    mockStorage.iterate.mockImplementation(() => {})

    const cleaned = await quota.cleanup()
    expect(cleaned).toEqual([])
  })

  it('cleans oldest items when over threshold', async () => {
    const removeItem = vi.fn()
    const quota = createQuotaManager(removeItem)
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue({ usage: 900, quota: 1000 }),
        },
      },
      writable: true,
      configurable: true,
    })

    mockStorage.iterate.mockImplementation((callback: (value: unknown) => void) => {
      for (let i = 0; i < CLEANUP_BATCH_SIZE + 5; i++) {
        callback({
          storeName: 'store',
          key: `key${i}`,
          lastAccessed: i,
        })
      }
    })

    const cleaned = await quota.cleanup()
    expect(cleaned).toHaveLength(CLEANUP_BATCH_SIZE)
    expect(removeItem).toHaveBeenCalledTimes(CLEANUP_BATCH_SIZE)
  })

  it('skips items that fail during cleanup', async () => {
    const removeItem = vi.fn().mockRejectedValueOnce(new Error('remove failed'))
    const quota = createQuotaManager(removeItem)
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue({ usage: 900, quota: 1000 }),
        },
      },
      writable: true,
      configurable: true,
    })

    mockStorage.iterate.mockImplementation((callback: (value: unknown) => void) => {
      callback({ storeName: 'store', key: 'fail', lastAccessed: 1 })
      callback({ storeName: 'store', key: 'ok', lastAccessed: 2 })
    })

    const cleaned = await quota.cleanup(2)
    expect(cleaned).toEqual(['ok'])
  })

  it('returns empty array when cleanup is not needed', async () => {
    const quota = createQuotaManager()
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue({ usage: 100, quota: 1000 }),
        },
      },
      writable: true,
      configurable: true,
    })

    const cleaned = await quota.cleanup()
    expect(cleaned).toEqual([])
  })

  it('returns true from autoCleanup when cleanup runs', async () => {
    const removeItem = vi.fn()
    const quota = createQuotaManager(removeItem)
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue({ usage: 900, quota: 1000 }),
        },
      },
      writable: true,
      configurable: true,
    })

    mockStorage.iterate.mockImplementation((callback: (value: unknown) => void) => {
      callback({ storeName: 'store', key: 'old', lastAccessed: 1 })
    })

    const result = await quota.autoCleanup()
    expect(result).toBe(true)
  })

  it('returns false from autoCleanup when no cleanup is needed', async () => {
    const quota = createQuotaManager()
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue({ usage: 100, quota: 1000 }),
        },
      },
      writable: true,
      configurable: true,
    })

    const result = await quota.autoCleanup()
    expect(result).toBe(false)
  })
})

describe('constants', () => {
  it('has expected default values', () => {
    expect(DEFAULT_STORE_NAME).toBe('app_cache')
    expect(STORAGE_QUOTA_THRESHOLD).toBe(0.8)
    expect(CLEANUP_BATCH_SIZE).toBe(10)
    expect(META_STORE_NAME).toBe('meta')
  })
})
