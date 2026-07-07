# 115 文件上传 API 文档

## 概述

115网盘的文件上传通过"初始化→上传到OSS→服务端回调"三步完成。文件不直接上传到115服务器，而是通过阿里云OSS中转。该API原本仅限115Browser使用（通过原生插件 `application/x-115uploadplugin`），但初始化接口本身无浏览器限制，可在Chrome等浏览器中实现上传。

## 上传架构

```
客户端                          115 UPLB                    阿里云 OSS                 115 服务端
  │                                │                            │                          │
  │  POST sampleinitupload.php     │                            │                          │
  │  (userid, filename,            │                            │                          │
  │   filesize, target)            │                            │                          │
  ├───────────────────────────────►│                            │                          │
  │                                │                            │                          │
  │  返回 OSS 临时凭证              │                            │                          │
  │  (host, accessid, policy,      │                            │                          │
  │   signature, callback, ...)    │                            │                          │
  │◄───────────────────────────────┤                            │                          │
  │                                │                            │                          │
  │  POST multipart/form-data      │                            │                          │
  │  (key, policy, OSSAccessKeyId, │                            │                          │
  │   signature, callback, file)   │                            │                          │
  ├────────────────────────────────────────────────────────────►│                          │
  │                                │                            │                          │
  │  200 OK                        │                            │                          │
  │◄────────────────────────────────────────────────────────────┤                          │
  │                                │                            │                          │
  │                                │                            │  POST samplecomplete     │
  │                                │                            │  upload.php              │
  │                                │                            │  (sha1, filename,        │
  │                                │                            │   filesize, ...)         │
  │                                │                            ├─────────────────────────►│
  │                                │                            │                          │
  │                                │                            │  200 OK                  │
  │                                │                            │◄─────────────────────────┤
```

---

## API 接口

### 1. 初始化上传 `sampleinitupload`

获取OSS临时凭证，后续用该凭证将文件上传至阿里云OSS。

```
POST https://uplb.115.com/3.0/sampleinitupload.php
Content-Type: application/x-www-form-urlencoded
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userid` | string | 是 | 115用户ID（如 `100000001`） |
| `filename` | string | 是 | 文件名（原始文件名，非编码） |
| `filesize` | number | 是 | 文件大小（字节） |
| `target` | string | 是 | 上传目标标识，格式见下方 Target 说明 |

**请求示例**:

```http
POST https://uplb.115.com/3.0/sampleinitupload.php
Content-Type: application/x-www-form-urlencoded

userid=100000001&filename=test.txt&filesize=1024&target=U_1_0
```

**响应**:

```json
{
  "object": "fake_obj_1234567890abcdef1234567890ab",
  "accessid": "LTAI5tFakeAccessKeyId",
  "host": "https://example-bucket.oss-cn-shenzhen.aliyuncs.com",
  "policy": "eyJleHBpcmF0aW9uIjoiMjA5OS0xMi0zMVQyMzo1OTo1OVoiLCJjb25kaXRpb25zIjpbWyJjb250ZW50LWxlbmd0aC1yYW5nZSIsMCw1MzY4NzA5MTIwXV19",
  "signature": "FakeSignature1234567890abc=",
  "expire": 4102444799,
  "callback": "eyJjYWxsYmFja1VybCI6Imh0dHA6XC9cL3VwbGIuMTE1LmNvbVwvMy4wXC9zYW1wbGVjb21wbGV0ZXVwbG9hZC5waHAiLCJjYWxsYmFja0JvZHkiOiJzaGExPSR7c2hhMX0mZmlsZW5hbWU9JHtvYmplY3R9JmZpbGVzaXplPSR7c2l6ZX0mbWltZVR5cGU9JHttaW1lVHlwZX0maGVpZ2h0PSR7aW1hZ2VJbmZvLmhlaWdodH0md2lkdGg9JHtpbWFnZUluZm8ud2lkdGh9JnVzZXJpZD0xMDAwMDAwMDEmdGFyZ2V0PVVfMV8wJnVzZXJmbj1kR1Z6ZEM1MGVIUT0mYnVja2V0PWV4YW1wbGUmdXNlcmlwPTEuMi4zLjQmdXNlcnBvcnQ9MTIzNDUmc291cmNlPTQmY2JfdG9rZW49ZmFrZV90b2tlbl9wbGFjZWhvbGRlcl8zMmNoIiwiY2FsbGJhY2tCb2R5VHlwZSI6ImFwcGxpY2F0aW9uXC94LXd3dy1mb3JtLXVybGVuY29kZWQifQ=="
}
```

**响应字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| `object` | string | OSS对象键，上传时作为 `key` 参数 |
| `accessid` | string | 临时 AccessKey ID |
| `host` | string | OSS上传地址（阿里云深圳节点） |
| `policy` | string | OSS Policy文档（Base64），解码后包含过期时间和文件大小限制 |
| `signature` | string | OSS请求签名 |
| `expire` | number | 凭证过期时间（Unix timestamp） |
| `callback` | string | OSS回调配置（Base64），包含回调URL和参数模板 |

**Policy 解码示例**:

```json
{
  "expiration": "2099-12-31T23:59:59Z",
  "conditions": [
    ["content-length-range", 0, 5368709120]
  ]
}
```

- 最大文件大小: 5 GB（5,368,709,120 字节）
- 凭证有效期: 约数分钟

---

### 2. 上传完成回调 `samplecompleteupload`

此接口由阿里云OSS在上传完成后自动调用，客户端无需直接请求。

```
POST http://uplb.115.com/3.0/samplecompleteupload.php
Content-Type: application/x-www-form-urlencoded
```

**回调参数**（由OSS自动填充，`${...}` 为OSS变量）:

| 参数 | 来源 | 说明 |
|------|------|------|
| `sha1` | `${sha1}` | 文件SHA1（OSS计算） |
| `filename` | `${object}` | OSS对象键 |
| `filesize` | `${size}` | 文件大小 |
| `mimeType` | `${mimeType}` | MIME类型 |
| `height` | `${imageInfo.height}` | 图片高度（非图片时为空） |
| `width` | `${imageInfo.width}` | 图片宽度（非图片时为空） |
| `userid` | 初始化参数 | 用户ID |
| `target` | 初始化参数 | 上传目标 |
| `userfn` | 初始化参数 | 文件名（Base64编码） |
| `bucket` | 固定 | OSS Bucket名（如 `example-bucket`） |
| `userip` | 服务器获取 | 客户端IP |
| `userport` | 服务器获取 | 客户端端口 |
| `source` | 固定 | 来源标识（`4`） |
| `cb_token` | 服务端生成 | 回调令牌 |

---

## Target 格式

`target` 决定文件归属的空间和目录。

| 场景 | 格式 | 示例 |
|------|------|------|
| 普通文件上传 | `U_{aid}_{cid}` | `U_1_0`（空间1根目录） |
| 指定文件夹 | `U_{aid}_{cid}` | `U_1_1000000000000000001` |
| 图片上传 | `U_2_{cid}` | `U_2_0` |
| 视频上传 | `U_4_{cid}` | `U_4_0` |
| 特殊上载 | `Q_{aid}_{cid}` | `Q_{999}_0`（头像等） |
| 共享文件夹 | `{cid}` | 直接使用文件夹cid |

**aid（空间ID）枚举**:

| aid | 说明 |
|-----|------|
| `1` | 文件（默认网盘空间） |
| `2` | 图片 |
| `3` | 音乐 |
| `4` | 视频 |
| `5` | 压缩包 |
| `9` | 应用 |
| `999` | 特殊（如头像上传），需配合 `window.UPLOAD_CONFIG` |

---

## OSS 上传

拿到初始化凭证后，用 `multipart/form-data` 上传文件到 OSS：

```
POST {host}
Content-Type: multipart/form-data
```

**表单字段**:

| 字段 | 值来源 | 说明 |
|------|--------|------|
| `key` | `object` | OSS对象键 |
| `policy` | `policy` | OSS Policy（Base64原文） |
| `OSSAccessKeyId` | `accessid` | 临时AK |
| `success_action_status` | 固定 `"200"` | 成功后返回200 |
| `callback` | `callback` | 回调配置（Base64原文） |
| `signature` | `signature` | 请求签名 |
| `file` | 文件数据 | 文件Binary |

**示例**:

```ts
const form = new FormData()
form.append('key', info.object)
form.append('policy', info.policy)
form.append('OSSAccessKeyId', info.accessid)
form.append('success_action_status', '200')
form.append('callback', info.callback)
form.append('signature', info.signature)
form.append('file', fileBlob)

const resp = await fetch(info.host, { method: 'POST', body: form })
// resp.status === 200 即上传成功，OSS 会自动回调 115 完成登记
```

**注意事项**:
- OSS上传地址是阿里云深圳节点（`oss-cn-shenzhen`）
- 表单字段顺序不影响上传，但字段名必须精确匹配
- `file` 字段必须在最后
- 上传大文件（>5GB）需分段上传，标准初始化接口的Policy限制为5GB

---

## 上传流程

```
选择文件
    │
    ▼
initUpload({ userid, filename, filesize, target })
    │
    ▼
获得 OSS 凭证 (host, accessid, policy, signature, callback)
    │
    ▼
构建 multipart/form-data
  key = object
  policy = policy
  OSSAccessKeyId = accessid
  success_action_status = "200"
  callback = callback
  signature = signature
  file = <文件Binary>
    │
    ▼
POST {host} (上传到OSS)
    │
    ├──→ 200 → OSS 回调 samplecompleteupload → 文件登记完成
    │
    └──→ 非200 → 上传失败，需重新获取凭证后重试
```

## 凭证过期处理

`expire` 字段表示凭证的Unix时间戳过期时间。若上传开始前凭证已过期，需重新调用 `initUpload` 获取新凭证。建议在拿到凭证后立即开始上传。

## 权限要求

- 必须有115账号的有效登录态（Cookie）
- 不需要VIP权限即可上传
- 文件大小超过 Policy 限制（5GB）需使用分段上传方案

## 浏览器兼容性

| 浏览器 | 支持 | 说明 |
|--------|------|------|
| 115Browser | ✅ 原生支持 | 内置 `libcurl` + `libec115` + 原生上传插件 |
| Chrome | ✅ 通过API | `initUpload` + Fetch API 上传到OSS |
| Firefox | ✅ 通过API | 同上 |
| Safari | ✅ 通过API | 同上 |
| Edge | ✅ 通过API | 同上 |

关键点：`initUpload` API 本身不校验 User-Agent，限制只在于原生插件 `window.uploadInterface` 仅存在于115Browser。使用本文档的标准HTTP上传流程无需原生插件。

## 原生插件说明

115Browser内置了 `application/x-115uploadplugin` 原生插件，通过 `window.uploadInterface` 暴露。该插件使用 `libcurl.4.dylib` 直接在原生层处理文件上传，绕过了浏览器网络栈，因此在DevTools中无法捕获上传请求。

涉及的原生库：
- `libcurl.4.dylib` — HTTP请求（CURL）
- `libec115.dylib` — 加密/编码，与项目中 `Crypto115` 是**同一算法族、部分密钥不同**的原生实现：

  | 对比项 | `libec115.dylib` | `Crypto115` (TS) | 结论 |
  |--------|------------------|-------------------|------|
  | 算法流程 | RSA(PKCS#1 v1.5) → XOR → MD5 | 同 | ✅ 一致 |
  | `keyS` (4 bytes) | `[0x29, 0x23, 0x21, 0x5E]` | 同 | ✅ 一致 |
  | `keyL` (12 bytes) | `[95, 40, 7, 41, 33, 38, 94, 35, 88, 7, 33, 126]` | `[120, 6, 173, 76, 51, 134, 93, 24, 76, 1, 63, 70]` | ❌ 不同 |
  | `kts` (162 bytes) | 静态数据与TS**完全相同**；运行时 `m115_xorinit` 从第8字节起覆写 | 硬编码固定值 | 静态同，运行时异 |
  | RSA modulus N | `8686980c0f5a24c4...b71683` (1024-bit) | 同 | ✅ 一致 |
  | RSA exponent E | `65537` (0x10001) | 同 | ✅ 一致 |

  **关键结论**：
  - **RSA 密钥对完全相同**（N 和 E 均一致），之前"不同"的结论有误
  - `keyS` 一致，`keyL` 不同——`m115_getkey` 根据请求长度选择对应的内置密钥
  - 原生库的静态 `_g_kts` 与 TS kts 逐字节一致（162 bytes），`m115_xorinit` 在初始化时覆写为另一版本
  - 服务端兼容多套参数，两套实现均可正常工作

若要在非115Browser中实现上传，忽略原生插件，直接使用本文档的API流程即可。

---

## 上传任务列表

### 115Browser 传输管理器

115Browser 右上角的"传输管理"窗口（`chrome://transfer-frame/`）展示了上传/下载/云下载任务列表。该页面通过与原生插件 `uploadInterface` 交互来管理上传任务，不依赖 Web API。

### uploadInterface 方法

| 方法 | 说明 |
|------|------|
| `loadTask()` | 从原生存储加载已有上传任务 |
| `start(type, taskId)` | 开始/继续上传 |
| `stop(type, taskId)` | 暂停上传 |
| `startAll()` | 全部开始 |
| `stopAll()` | 全部暂停 |
| `delete(tasksJson)` | 删除任务 |
| `clearCompleted()` | 清空已完成 |
| `getErrorExtraInfo(type, taskId)` | 获取失败任务的详细错误信息 |
| `getUploadIcon(path)` | 根据文件路径获取图标类型 |
| `openUploadFolderItem(path, cid)` | 打开已上传的文件夹 |
| `setISPType(type)` | 设置网络类型（影响速度估算） |
| `uploadByPaths(paths)` | 通过文件路径发起上传 |
| `uploadBySelecting()` | 触发文件选择对话框发起上传 |

### 上传任务数据结构

`uploadInterface` 在上传开始、进度更新、完成、出错时通过回调将任务数据推送到传输管理器页面，存储在 `window.uploadsData` 中：

```typescript
// window.uploadsData: Record<string, UploadTaskContainer>
interface UploadTaskContainer {
  dom: {
    uploadItemData: UploadTask
  }
}

interface UploadTask {
  /** 任务类型，1 = 上传 */
  task_type: number
  /** 任务ID */
  task_id: string
  /** 上传ID */
  up_id: string
  /** 组合ID，格式为 "{task_type}_{task_id}" */
  id: string
  /** 文件名 */
  name: string
  /** 本地文件路径 */
  path: string
  /** 上传进度百分比字符串，如 "100.00%" */
  progress: string
  /** 文件大小（字节） */
  size: number
  /** 已完成字节数 */
  complete: number
  /** 有效上传字节数（可读格式） */
  valid_up_bytes: string
  /** 文件大小（可读格式） */
  size_str: string
  /** 上传速度 */
  speed: string
  /** 上传速度（可读格式） */
  speed_str: string
  /** 是否正在上传 */
  is_uploading: 0 | 1
  /** 状态码 */
  status: number
  /** 错误信息 */
  error: string
  /** 错误发生时间 */
  error_time: string
  /** 目标目录 cid */
  cid: string
  /** 空间ID */
  aid: number
  /** 群组ID（共享上传） */
  group_id: string
  /** 上传开始时间 */
  start_time: string
  /** 上传结束时间（timestamp） */
  end_time: number
  /** 预计剩余时间 */
  left_time: string
  /** 文件图标类型 */
  ico: string
  /** 是否为文件夹 */
  is_dir: 0 | 1
  /** 操作码 */
  action: number
  /** 文件夹内的文件总数（上传文件夹时） */
  total_file_num: number
  /** 是否为新任务 */
  is_new: boolean
  /** 是否共享文件 */
  IsShared: boolean
  /** 共享目录ID */
  sharedFid: string
  /** 共享ID */
  sharedId: string
}
```

### Web 端替代方案

由于 `uploadInterface` 仅存在于 115Browser，在 Chrome 等浏览器中上传时需要自行维护上传队列。建议使用 `Map<string, UploadTask>` 结构，在 OSS 上传的各个阶段（`initUpload` 成功、`XMLHttpRequest.upload.onprogress`、上传完成/失败）更新对应字段即可。

文件上传进度监听示例：

```ts
const xhr = new XMLHttpRequest()
xhr.upload.onprogress = (e) => {
  if (e.lengthComputable) {
    const pct = ((e.loaded / e.total) * 100).toFixed(2)
    // 更新对应 task 的 progress 和 complete 字段
  }
}
```
