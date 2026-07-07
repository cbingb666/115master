# 115云解压 API 文档

## 概述

115网盘的云解压功能通过一系列 REST API 实现，支持 ZIP、RAR、7Z、TAR、GZ、PART 等压缩格式的在线解压。

解压流程：查询状态 → 发起解压 → 轮询进度 → 浏览文件 → 保存/下载。

## 文件分类标识

文件列表（`/files`）响应中的 `class` 字段：
- `"RAR"` — 未解压的压缩包
- `"RAR_EXTRACT"` — 已解压或解压中的压缩包

`ico` 字段对应后缀：`zip`、`rar`、`7z` 等。

---

## API 接口

### 1. 查询/发起解压 `push_extract`

```
GET/POST https://webapi.115.com/files/push_extract
```

**GET** — 查询解压状态：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pick_code` | string | 是 | 文件提取码 |

**POST** — 发起解压 / 提交密码：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pick_code` | string | 是 | 文件提取码 |
| `secret` | string | 否 | 压缩包密码（加密文件时必须） |

**响应**:

```json
{
  "state": true,
  "code": 0,
  "message": "",
  "data": {
    "extract_status": {
      "unzip_status": 1,
      "progress": 5
    }
  }
}
```

**`unzip_status` 状态码**:

| 值 | 含义 | 后续操作 |
|----|------|----------|
| `0` | 未开始 | POST 发起解压 |
| `1` | 解压中 | 轮询 GET，`progress` 为 0-100 |
| `2` | 压缩包异常 | 解压失败，不可恢复 |
| `3` | 解压失败 | 可重试 |
| `4` | 已解压完成 | 调用 `extract_info` 浏览文件 |
| `6` | 需要密码 | POST 附带 `secret` |
| `7` | 不支持的格式 | - |

**错误码**:

| code | 含义 |
|------|------|
| `51001` | 非会员，无解压权限 |

---

### 2. 浏览解压文件列表 `extract_info`

```
GET https://webapi.115.com/files/extract_info
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `pick_code` | string | 文件提取码 |
| `file_name` | string | 文件/目录名（根目录为空） |
| `paths` | string | 路径（根目录为 `"文件"`） |
| `next_marker` | string | 分页游标 |
| `page_count` | number | 每页数量（最大 999） |

**响应**:

```json
{
  "state": true,
  "data": {
    "list": [
      {
        "file_category": 0,
        "file_name": "subfolder",
        "size": 0,
        "time": "2026-07-07 21:34"
      },
      {
        "file_category": 1,
        "file_name": "readme.txt",
        "size": 1024,
        "time": "2026-07-07 21:34"
      }
    ],
    "has_file": "false",
    "next_marker": ""
  }
}
```

- `file_category`: `0` = 目录，`1` = 文件
- 若 `has_file` 为 `"true"`，需用 `next_marker` 递归加载下一页

---

### 3. 保存文件到网盘 `add_extract_file`

将解压后的文件/目录保存到指定网盘目录。

```
POST https://webapi.115.com/files/add_extract_file
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `pick_code` | string | 原始压缩包的提取码 |
| `extract_file` | string[] | 选中的文件列表 |
| `extract_dir` | string[] | 选中的目录列表 |
| `to_pid` | string | 目标网盘目录 cid |
| `paths` | string | 当前浏览路径 |

**响应**:

```json
{
  "state": true,
  "data": {
    "extract_id": "..."
  }
}
```

获取 `extract_id` 后，轮询 GET `add_extract_file?extract_id=xxx` 获取保存进度：

```
GET https://webapi.115.com/files/add_extract_file?extract_id=xxx
```

**轮询响应**:

```json
{
  "state": true,
  "data": {
    "percent": 75
  }
}
```

`percent` 达到 100 即完成。

---

### 4. 获取文件夹文件列表 `extract_folders`

下载解压后文件夹时，展开获取文件夹内所有文件。

```
GET https://webapi.115.com/files/extract_folders
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `pick_code` | string | 原始压缩包提取码 |
| `full_dir_name` | string | 文件夹完整路径 |

**响应**:

```json
{
  "state": true,
  "data": [
    { "pt": "文件夹", "fn": "文件名" }
  ]
}
```

POST 方法用于验证文件数量：

```
POST https://webapi.115.com/files/extract_folders
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `pick_code` | string | 原始压缩包提取码 |
| `full_dir_name` | string | 逗号分隔的目录列表 |
| `full_file_name` | string | 逗号分隔的文件列表 |

**响应**: `{state: true, data: {limit_state: true}}` — 超过 1 万文件则 `code=51008`

---

### 5. 获取下载链接 `extract_down_file`

```
GET https://webapi.115.com/files/extract_down_file
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `dl` | number | 固定为 `1` |
| `pick_code` | string | 原始压缩包提取码 |
| `full_name` | string | 文件在压缩包内的完整路径 |

**响应**:

```json
{
  "state": true,
  "data": {
    "url": "https://..."
  }
}
```

若响应含 `file_url_302`，需对 `file_url_302` 发起二次请求获取最终下载 URL。

---

## 解压流程

```
FilesItem.class == "RAR"   // 可解压
    │
    ▼
GET push_extract           // 查询状态
    │
    ├─ unzip_status=0  → POST push_extract         // 发起解压
    ├─ unzip_status=1  → 轮询 GET push_extract      // 等待完成
    ├─ unzip_status=4  → GET extract_info           // 浏览文件
    ├─ unzip_status=6  → POST push_extract(secret)  // 提交密码
    └─ else            → 解压完成
                            │
                            ▼
                       GET extract_info             // 浏览文件列表
                            │
                    ┌───────┴────────┐
                    ▼                ▼
           POST add_extract_file  GET extract_down_file
           (保存到网盘)           (直接下载)
```

## Worker 协议

解压进度轮询和文件保存进度轮询通过 Web Worker (`bg_unzip.js`) 实现：

```javascript
// 轮询解压进度
worker.postMessage({ type: "start", data: { pick_code } })
worker.onmessage → { type: "update", data: { unzip_status, progress } }
                → { type: "error", data: { message } }

// 轮询文件保存进度
worker.postMessage({ type: "unZip", data: { extract_id } })
worker.onmessage → { type: "update", data: { percent } }
                → { type: "error" }
```

## 支持的格式

- 完整支持：`rar`、`zip`、`7z`
- 文件类型判断支持：`rar`、`tar`、`gz`、`7z`、`zip`、`part`
