/** 缓存名称 */
export const STORE_NAME = `115master_cache${import.meta.env.DEV ? '-dev' : ''}`

export /** 存储空间使用率阈值，超过此值开始清理 */
const STORAGE_QUOTA_THRESHOLD = 0.8
export /** 每批清理的数量 */
const CLEANUP_BATCH_SIZE = 10
export /** 元数据存储名称 */
const META_STORE_NAME = 'meta'
