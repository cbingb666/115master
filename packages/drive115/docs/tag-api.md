# 115 文件标签 API 文档

## 概述

115 网盘的"文件标签"（也称"文件标签"）允许用户为文件打上自定义颜色标签，并按标签筛选文件。

入口：左侧导航 → 文件标签

标签的存储与显示均位于 `webapi.115.com/label/*` 下；为文件设置标签通过 `webapi.115.com/files/edit` 完成；按标签筛选文件复用 `webapi.115.com/files/search` 的 `file_label` 参数。

---

## API 接口

### 1. 获取标签列表 `GET /label/list`

```
GET https://webapi.115.com/label/list?user_id=340263991&offset=0&limit=11500
```

> 注：实际请求可省略 `user_id`，后端从 cookie 推断。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `offset` | int | 是 | 偏移量 |
| `limit` | int | 是 | 限制数量，最大 11500 |
| `sort` | string | 否 | 排序字段：`create_time` / `update_time` / `sort` |
| `order` | string | 否 | 排序方向：`asc` / `desc` |
| `keyword` | string | 否 | 搜索关键字（搜索模式下使用） |

**响应**:

```json
{
  "state": true,
  "code": 0,
  "message": "",
  "total": 27,
  "sort": "update_time",
  "order": "desc",
  "list": [
    {
      "id": "3326910728406523033",
      "name": "解码超时",
      "sort": "0",
      "color": "#000000",
      "update_time": 1766614664,
      "create_time": 1766614664
    }
  ]
}
```

---

### 2. 创建标签 `POST /label/add_multi`

```
POST https://webapi.115.com/label/add_multi
Content-Type: application/x-www-form-urlencoded
```

支持批量创建。`name[i]` 的值格式为 `name + \x07 + color`，即 ASCII 0x07 字节作为分隔符。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name[0]` | string | 是 | 第一个标签，格式 `标签名\x07颜色` |
| `name[1]` | string | 否 | 第二个标签 |

**颜色常量**（来自 115 官方 UI）：

| 名称 | 色值 |
| --- | --- |
| Blank | `#000000` |
| Red | `#FF4B30` |
| Orange | `#F78C26` |
| Yellow | `#FFC032` |
| Green | `#43BA80` |
| Blue | `#2670FC` |
| Purple | `#8B69FE` |
| Gray | `#CCCCCC` |

**请求示例**:

```
name%5B0%5D=新标签%07%23FF4B30
```

解码后：`name[0]=新标签\x07#FF4B30`

**响应**:

```json
{
  "state": true,
  "data": [
    { "id": "3470746961475274374", "name": "新标签", "sort": 0, "color": "#FF4B30", "update_time": 1783761279, "create_time": 1783761279 }
  ]
}
```

---

### 3. 编辑标签 `POST /label/edit`

```
POST https://webapi.115.com/label/edit
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 标签 id |
| `name` | string | 是 | 新名称 |
| `color` | string | 否 | 新颜色，16 进制（如 `#FF4B30`） |

**请求示例**:

```
id=42&name=已编辑&color=%23FF4B30
```

---

### 4. 删除标签 `POST /label/delete`

```
POST https://webapi.115.com/label/delete
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 标签 id |

**请求示例**:

```
id=42
```

---

### 5. 给文件设置标签 `POST /files/edit`

```
POST https://webapi.115.com/files/edit
```

复用了文件编辑接口，通过 `file_label` 字段设置/清空标签。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `fid` | string | 是 | 文件 id |
| `file_label` | string | 是 | 标签 id 列表，逗号分隔；空串表示清空 |

**设置多个标签**:

```
fid=3467977411625223721&file_label=10,20,30
```

**清空标签**:

```
fid=3467977411625223721&file_label=
```

---

### 6. 标签排序 `POST /files/order`

```
POST https://webapi.115.com/files/order
```

复用了文件排序接口，通过 `module=label_search` 进入标签排序模式。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `module` | string | 是 | 固定 `label_search` |
| `file_id` | string | 是 | 标签 id |
| `fc_mix` | string | 是 | 固定 `0` |
| `user_order` | string | 是 | 排序方式，如 `file_name` / `user_utime` |
| `user_asc` | int | 是 | 是否升序（0/1） |

---

### 7. 按标签筛选文件 `GET /files/search`

```
GET https://webapi.115.com/files/search?file_label=10&offset=0&limit=115
```

复用搜索接口，通过 `file_label` 参数筛选。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file_label` | string | 是 | 标签 id |
| `offset` | int | 是 | 偏移量 |
| `limit` | int | 是 | 限制数量 |
| `cid` | string | 否 | 目录 id，默认 `0` |
| `aid` | int | 否 | 空间 id，默认 `1` |
| `o` | string | 否 | 排序方式 |
| `asc` | int | 否 | 是否升序 |
| `show_dir` | int | 否 | 是否显示目录 |
| `count_folders` | int | 否 | 是否统计目录数 |
| `suffix` | string | 否 | 文件后缀过滤 |
| `type` | int | 否 | 文件类型过滤 |
| `source` | string | 否 | 来源 |
| `format` | string | 否 | 返回格式，`json` |

---

## 业务流程

### 创建并应用标签到文件

```
┌────────────────┐                  ┌─────────────────────┐
│  1. addLabels  │  POST /label/add_multi  │  返回标签 id      │
└───────┬────────┘                  └──────────┬──────────┘
        │                                       │
        ▼                                       ▼
┌────────────────────────────────────────────────────────┐
│  2. setFileLabels(fileId, [labelId])                  │
│     POST /files/edit  fid=&file_label=id1,id2,...     │
└────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────┐
│  3. getFilesByLabel    │  GET /files/search?file_label=
│     列出该标签下的文件  │
└────────────────────────┘
```

### 删除标签

```
删除标签 → 自动从所有已应用该标签的文件上移除
POST /label/delete?id=xxx
```

> 注：删除标签后，原引用该标签的文件 `fl` 字段会自动去除该 id（无需手动更新文件）。

---

## 错误码

标签相关接口遵循 115 网盘通用响应包装：

```json
{ "state": false, "code": 0, "errNo": 0, "error": "服务器开小差了，稍后再试吧" }
```

常见 `errNo`：
- `0` — 业务错误（state=false 但 HTTP 200）
- `990001` — 登录已过期（SessionExpired）
- `911` — 操作过于频繁（CaptchaRequired）

---

## 协议备注

1. **`name[]` 中的 `\x07` 分隔符**：115 历史协议使用 ASCII 0x07（BEL）作为单字段内 name 与 color 的分隔符，URL 编码后不可见但仍是单字节。客户端实现时使用 `String.fromCharCode(7)` 拼接。
2. **`file_label` 为空字符串**：清空所有标签，不能用 `null` 或省略。
3. **`setFileLabels` 与 `setFilesOrder` 的复用**：115 把这两个看似无关的能力复用到 `/files/edit` 与 `/files/order`，通过参数区分场景；这是历史原因，不建议模仿。