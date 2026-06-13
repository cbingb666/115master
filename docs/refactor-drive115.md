---
1. 范围与现状

drive115 目前是一个“大而全”的 API 客户端：

- core.ts：一个 Drive115Core 类封装了约 30 个 115 接口；
- wrap.ts：Drive115Wrap 通过 继承 Drive115Core 提供少量高层方法；
- crypto.ts / rsa.ts：自研 115 私有协议加解密；
- api/*：按 webApi / normalApi / myApi / proApi 四个 namespace 拆分类型。

上层 apps/monkey 通过全局单例 drive115Instance.ts 直接调用，引用点约 31 处。

---
2. 严重缺陷（Critical）

2.1 API 层直接调用 alert()，破坏封装与可测试性

packages/drive115/src/core.ts:100-101
if (res.errNo === 990001) {
  alert('登录已过期，请重新登录')
}

packages/drive115/src/core.ts:505
alert('你已经高频操作了!\n先去通过一下人机验证再回来刷新页面哦~')

问题：
- API 包应该保持“纯客户端”，不应该知道浏览器 alert 这种 UI 副作用。
- 调用方无法拦截、无法自定义提示方式（如 Toast / Dialog），也无法做自动化测试。
- webApiFilesDownload 在 alert 之后仍然继续执行校验，逻辑上更像“应该抛出可识别的错误”。

建议：定义 Drive115Error 子类或错误码枚举，统一抛出；应用层决定如何展示。

---
2.2 jumpVerify() 的 verifying 标志只置 true，永不复位

packages/drive115/src/core.ts:500-510
private jumpVerify(pickcode: string) {
  if (this.verifying) {
    return
  }
  this.verifying = true        // ← 只写一次
  alert('...')
  const url = new URL(`?pickcode=${pickcode}`, this.VOD_URL_115).href
  if (this.deps.onOpenVerifyTab) {
    this.deps.onOpenVerifyTab(url)
  }
}

问题：
- 一旦触发 911 验证，该实例后续所有验证请求都会被静默忽略，除非刷新页面重建实例。
- 这是一个典型的状态泄漏 bug。

建议：验证完成后由应用层回调复位；或把验证状态提升到调用方管理。

---
2.3 Drive115Wrap 继承 Drive115Core，封装被破坏

packages/drive115/src/wrap.ts:13
export class Drive115Wrap extends Drive115Core { ... }

问题：
- “Wrap” 本应通过组合持有 Drive115Core，却用继承把所有底层方法全部暴露出去。
- 上层可以直接调用 drive115.webApiGetFiles（底层）也可以调用 drive115.getFiles（高层），接口边界模糊。
- 继承还让 Drive115Wrap 与 Drive115Core 紧耦合，未来拆分核心类时影响面大。

建议：改为组合：
class Drive115Wrap {
  private core: Drive115Core
  async getFiles(...) { ... }
}

---
3. 高优先级缺陷（High）

3.1 Drive115Core 是典型 God Class

packages/drive115/src/core.ts 511 行，包含约 30 个方法，覆盖：

- 文件列表 / 文件操作 / 排序 / 搜索
- 视频 / m3u8 / 字幕 / 下载
- 离线任务 / 用户信息 / 图片

问题：
- 单一类职责过多，任何接口改动都要修改同一个文件。
- 不同业务域（文件、视频、离线）共用同一组 URL 常量与加密实例，难以独立演进。

建议：按业务域拆分为多个 Client：

FileApiClient
VideoApiClient
OfflineApiClient
UserApiClient
ImageApiClient

然后由 Drive115 facade 组合对外暴露。

---
3.2 响应基类型不统一，错误处理无法泛化

packages/drive115/src/api/webApi/res.ts:4-8
type Base<T> = {
  state: boolean
  errNo: number
  error: string
} & T

packages/drive115/src/api/normalApi/res.ts:1-7
type ResBase<T> = {
  state: boolean
  code: number
  errNo: number
  error: string
  error_msg: string
} & T

问题：
- code / errNo、error / error_msg 混用，上层无法写一个统一的 handleError(res)。
- 字段命名不一致也暴露了后端接口历史包袱没有在本层收敛。

建议：统一为一个 Drive115Response<T>，并在序列化层做字段映射（如把后端不同的错误字段收敛到 code / message）。

---
3.3 类型断言与 Object.values(...)[0] 等 unsafe 操作

packages/drive115/src/core.ts:140
const downloadInfo = Object.values(result)[0] as DownloadResult

问题：
- 假设返回对象第一个值一定是下载信息，无运行时校验。
- 后端数据结构一旦变化（空对象、数组、字段名变更）会直接导致运行时异常。

建议：至少做运行时 shape 检查，或引入 zod / valibot 做 schema 校验。

---
3.4 catch 块丢弃原始错误

packages/drive115/src/wrap.ts:31-37
catch {
  const response = await this.ApsGetNatsortFiles(params)
  if (response.state) {
    return response
  }
  throw new Error(`获取播放列表失败: ${JSON.stringify(response)}`)
}

问题：
- 第一个接口为什么失败、是网络错误还是业务错误，全部丢失。
- 调试困难，错误信息只包含第二次失败的 response。

建议：捕获错误对象并作为 cause 抛出，或日志记录完整链路。

---
3.5 过度拆分的 api/* namespace

packages/drive115/src/api/proApi/res.ts 仅 10 行；myApi/req.ts 仅 2 行。
4 个 namespace 各自由 req.ts / res.ts / index.ts 组成，共 12 个文件。

问题：
- 文件碎片化，维护成本高于收益。
- 大量 index.ts 只是 re-export，增加导航负担。

建议：按业务聚合为一个 api.types.ts 或 api/web.ts / api/legacy.ts，只在需要时再拆分。

---
4. 中优先级缺陷（Medium）

4.1 无统一错误码与错误类

packages/drive115/src/core.ts:53-60
export class Drive115Error {
  static NotFoundM3u8File = class extends Error { ... }
}

core.ts:62-63 只是把已知错误码写成 TODO：
// TODO: 超时登录错误 errNo 990001
// TODO: 验证账号弹窗被拦截 911

问题：
- 错误处理散落在各个方法里，无法统一重试、统一提示、统一埋点。
- 调用方只能通过判断 Error.message 做处理，极不稳定。

建议：定义完整枚举：
enum Drive115ErrorCode {
  SessionExpired = 990001,
  CaptchaRequired = 911,
  ...
}

---
4.2 重试 / 防抖 / 请求去重缺失

所有 API 方法直接透传 fetchRequest，没有：

- 幂等重试
- 高频操作防抖
- 相同请求去重

而 115 对高频操作会返回 911，说明这个风险是真实存在的。

建议：在 IRequest 层或 Drive115Core 上层增加可配置的 interceptor。

---
4.3 加解密密钥硬编码且集中

packages/drive115/src/crypto.ts:15-165 包含 162 字节密钥数组；rsa.ts 也包含硬编码模数与指数。

问题：
- 客户端不可避免会暴露密钥，但当前完全平铺在源码中，极易被批量提取。
- 没有集中配置入口，也未做最低限度的混淆或分片。

建议：至少把密钥抽成单独配置模块，并在构建流程中加入字符串混淆。

---
4.4 上层 fallback 逻辑与 wrap 层重复

packages/drive115/src/wrap.ts:23-38 已有 webApiGetFiles → ApsGetNatsortFiles fallback。
但 apps/monkey/src/hooks/useDriveList/index.ts:21-28 又做了一遍同样的 fallback：

let res = await drive115.webApiGetFiles(params)
if (!res.state) {
  params.o = res.order
  params.asc = res.is_asc
  res = await drive115.ApsGetNatsortFiles(params)
  ...
}

问题：
- 同一策略在两个层级同时存在，行为可能不一致。
- useDriveList 直接调用底层 webApiGetFiles / ApsGetNatsortFiles，绕过了 Drive115Wrap.getFiles 的封装。

建议：统一收敛到 drive115.getFiles，并在该层决定 fallback 策略。

---
4.5 魔法数字与无注释的业务常量

packages/drive115/src/utils/url.ts:4-9
export function getXUrl(url: string) {
  if (!url.includes('cpats01')) {
    return url
  }
  return url.replace(/&s=\d+/, `&s=${1024 ** 2 * 50}`)
}

1024 ** 2 * 50 是 50MB，但代码中没有解释为什么是 50MB，以及 cpats01 的含义。

建议：抽成命名常量并补充注释。

---
5. 低优先级 / 工程化缺陷（Low）

┌────────────────────────────────────────────────────────────────┬────────────────────────────┬──────────────────────────────────────────┐
│                              缺陷                              │            位置            │                   说明                   │
├────────────────────────────────────────────────────────────────┼────────────────────────────┼──────────────────────────────────────────┤
│ Drive115Core 重复存储 URL 常量                                 │ core.ts:74-84              │ 导入的常量又赋值给 private 字段，无必要  │
├────────────────────────────────────────────────────────────────┼────────────────────────────┼──────────────────────────────────────────┤
│ 文件名与类名不一致                                             │ core.ts / wrap.ts          │ 应改为 Drive115Core.ts / Drive115Wrap.ts │
├────────────────────────────────────────────────────────────────┼────────────────────────────┼──────────────────────────────────────────┤
│ qualityCodeMap 类型不安全                                      │ constants/quality.ts:10-17 │ 缺少 as const 或 Record 约束             │
├────────────────────────────────────────────────────────────────┼────────────────────────────┼──────────────────────────────────────────┤
│ 无单元测试                                                     │ packages/drive115/         │ 加密与 API 逻辑均无测试                  │
├────────────────────────────────────────────────────────────────┼────────────────────────────┼──────────────────────────────────────────┤
│ Drive115CoreDeps.onOpenVerifyTab 只覆盖 tab 打开，未覆盖 alert │ core.ts:19-26              │ 如果 alert 也应可注入，则当前抽象不完整  │
└────────────────────────────────────────────────────────────────┴────────────────────────────┴──────────────────────────────────────────┘

---
6. 总结与重构路线

当前 drive115 最大的风险在于 “API 层混入了 UI 行为” 与 “核心类过度膨胀”。建议按以下顺序重构：

1. 止血：把 core.ts 中的 alert() 全部移除，改为抛出带错误码的 Drive115Error；修复 verifying 标志永不复位的问题。
2. 拆分 God Class：将 Drive115Core 拆成 FileApiClient / VideoApiClient / OfflineApiClient / UserApiClient。
3. 改继承为组合：Drive115Wrap 或新的 Drive115 facade 持有各 Client 实例，对外只暴露高层方法。
4. 统一响应类型：收敛 Base / ResBase，建立统一的错误处理与重试机制。
5. 类型安全：引入 schema 校验（zod / valibot）替代 as 强转；统一错误码枚举。
6. 工程化：为 drive115 增加单元测试，抽离并混淆密钥配置，减少 api/* 的文件碎片。

这样改造后，drive115 才能从“能跑的脚本集合”演进为“可维护、可测试、可扩展的 API SDK”。
