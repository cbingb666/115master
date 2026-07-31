/**
 * 下载地址 fixture：proapi.115.com/app/chrome/downurl + webapi.115.com/files/download
 * 字段对齐 @115master/drive115 的 VideoApi.Res.FilesAppChromeDownurl / FilesDownload
 */

/**
 * Pro 下载：固定失败
 * 成功响应的 data 需用页面端会话密钥加密（RSA 私钥在 115 服务端），mock 无法构造；
 * getFileDownloadUrl 捕获失败后回退到 webapi/files/download
 */
export const proDownurlUnavailable = {
  state: false,
  error: 'pro api unavailable',
}

/**
 * 普通下载：默认受限失败（115 普通下载接口对大文件常返回失败）
 * 需要 Ultra 源 / 成功下载地址的 spec 用 override 覆盖本接口
 */
export const filesDownloadLimited = {
  state: false,
  error: '文件超出普通下载大小限制',
}
