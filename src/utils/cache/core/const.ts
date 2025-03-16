export const STORE_NAME = `115master_cache${import.meta.env.DEV ? "-dev" : ""}`;

// 空间限额管理相关常量
export const STORAGE_QUOTA_THRESHOLD = 0.8; // 存储空间使用率阈值，超过此值开始清理
export const CLEANUP_BATCH_SIZE = 10; // 每批清理的数量
export const META_STORE_NAME = "meta"; // 元数据存储名称
