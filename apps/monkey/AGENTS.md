# @115master/monkey

115 网盘用户脚本（Tampermonkey），基于 Vue 3 + Vite + `vite-plugin-monkey`。同一份脚本注入到 115 的多个页面，按 URL 分发到不同运行模式。

## 架构

**核心：一份脚本，两种运行形态。** `src/main.ts` 用 `ROUTE_MATCH` glob 匹配当前 URL，分发到 4 个页面入口：

```
main.ts (run-at: document-start)
├── HOME        115.com/?ct*              → HomePage        # Mod 系统：向官方页面注入增强
├── MASTER      /web/lixian/master*       → createMasterApp # 独立 SPA：重置文档，挂载 Vue 应用
├── VIDEO_TOKEN dl.115cdn.net/video/token → videoTokenPage  # 隐藏 iframe cookie 桥
└── MAGNET      /master/magnet/*          → magnetPage      # 磁力协议处理
```

- **HOME 模式（页面增强）**：不接管页面，用 `MutationObserver` 监听官方 DOM，对文件列表 `<li>` 注入增强（封面、演员信息、快捷播放、下载…）。读官方全局如 `unsafeWindow.Main.CONFIG`。
- **MASTER 模式（独立 SPA）**：`createMasterApp()` 清空 `<body>` 挂载 `#my-app`，hash 路由，自渲染完整网盘 UI。

> 改动增强功能走 HOME/Mod 系统；改动网盘 UI 走 MASTER SPA。两者共享 `utils/`、`store/`、`drive115` 单例。

## 目录结构

```
src/
├── main.ts               # 入口：document.domain 设置 + URL 路由分发
├── app/                  # MASTER SPA 骨架
│   ├── app.tsx           # App 根（OverlayHost + Dialog/Toast + RouterView/KeepAlive）
│   ├── router.ts         # createWebHashHistory + 旧播放页重定向
│   └── routes.ts         # drive / video / test 路由
├── pages/
│   ├── home/             # HOME 模式：Mod 系统
│   │   ├── BaseMod/      # BaseMod 抽象基类 + ModManager
│   │   ├── FileListMod/  # 文件列表增强 + FileItemMod/* 插件数组
│   │   └── *Mod/         # NavMod / TopFilePathMod / TopHeaderMod
│   ├── drive/drive.tsx   # MASTER 网盘主页（文件浏览）
│   ├── video/            # MASTER 视频播放页
│   │   ├── index.vue     # 播放器外壳，组合 useData* 数据 hook
│   │   └── data/         # useDataFileInfo/History/Mark/MovieInfo/Playlist/Subtitles/...
│   ├── magnet/           # 磁力链接处理
│   └── video/index.ts    # VIDEO_TOKEN cookie 桥（GM_cookie postMessage）
├── components/           # UI 组件（SFC 为主），XPlayer 为自包含播放器
│   └── XPlayer/          # hooks/ events(mitt)/ types/ styles/ components/
├── hooks/                # 组合式逻辑（useDrive* 系列）
├── store/                # Pinia store（driveList 聚合多个 hook）
├── icons/                # 集中式图标：Icon 组件 + I.* registry（见根 Icons 规范）
├── utils/
│   ├── drive115Instance.ts  # drive115 单例
│   ├── request/gmRequest.ts # GM_xmlhttpRequest 封装（Pro API 请求）
│   ├── userSettings.ts      # GM_getValue/setValue 设置 + watch
│   ├── theme.ts             # data-theme 主题驱动
│   ├── cache/               # 各类 CacheCore 缓存（封面/字幕/图片/jav…）
│   ├── clipper/             # m3u8 视频剪辑
│   └── jav/                 # jav 信息源（javbus/javdb/missav）
├── constants/            # 路由匹配、GM key、UA、CDN 等
└── types/                # 全局类型声明（GM、Hls、player…）
```

## 核心概念

### Mod 系统（HOME 模式）

向官方页面注入增强的插件体系：

- `BaseMod` — 抽象基类，唯一契约 `destroy()`；`ModManager` 统一注册与销毁。
- 顶层 Mod：`NavMod` / `FileListMod` / `TopFilePathMod` / `TopHeaderMod`，由 `HomePage` 装配。
- `FileListMod` 监听 `DataListBox` 子节点变化，对每个新增 `<li>` 创建 `FileItemModLoader`，跑一组 `FileItemMod` 插件；节点移除时销毁对应 loader。
- `FileItemModBase`（`FileListMod/FileItemMod/base.ts`）— 单 item 增强基类：
  - `ENABLE_KEY_IN_USER_SETTING` — 绑定到 `userSettings` 某字段，开关变化时自动 `onLoad`/`onDestroy`。
  - `IS_PLUS` — Plus 版才启用的增强。
  - 生命周期：`load()` → `onLoad()`，`destroy()` → `onDestroy()`。

新增文件列表增强 = 写一个 `FileItemMod/*` 类实现 `FileItemModBase`，加进 `FileListMod` 的 `itemMods` 数组。

### MASTER SPA

- `createMasterApp()`（`app/index.ts`）— 重置文档（favicon、meta viewport、`#my-app`、滚动条样式）、注入主题、挂载 Vue + Pinia + router。
- 路由（hash）：`/drive/:area?/:cid?`（网盘，`keepAlive`）、`/video/:pickCode`（播放）、`/test`。
- App 根（`app.tsx`，TSX）— `onErrorCaptured` 全局兜底，`<KeepAlive>` 包裹 `meta.keepAlive` 路由。
- 网盘页 `drive.tsx` 用 `actionAtom`/`actionConfig` 声明式描述右键菜单 action，由 `FileContextMenu` 渲染。

### 状态管理：Pinia store + hooks 组合

`store/driveList`（`useDriveStore`）是网盘中枢，组合多个 hook 而非手写 state：

```
useDriveStore
├── query      useRouteQuery (keyword/suffix/type/page) + useStorage (pageSize)
├── nav        usePathNav(router)                 # 路由参数 ↔ cid/area
├── list       useDriveList                       # 请求、分页/无限加载与排序
└── selection  useDriveSelection
```

- `useDriveList` 是文件列表的数据接口，内部统一管理请求、分页/无限加载、排序与并发取消；Drive 页与 FileBrowser 都只提供导航和筛选状态。
- 文件列表结果不缓存；目录、搜索、分页、排序或筛选条件变化时清空当前数据并重新请求。无限模式仅保留当前视图已经加载的页。
- 文件列表不记录滚动位置；查询条件变化或重新进入 Drive 路由时从顶部开始。
- `useDriveAction` 聚合文件操作（newFolder/top/star/move/delete/cloudDownload…），每个 action 拆到子 hook；store 的 `afterAction()` 统一清选并重新请求当前列表，不做本地增量更新或目标目录失效。
- URL 状态走 `@vueuse/router`，UI 偏好走 `@vueuse/core` `useStorage`，跨会话持久。

### drive115 集成

`utils/drive115Instance.ts` 导出全局单例 `drive115`：

```ts
new Drive115({
  fetchRequest: new FetchRequest(),      // 普通 HTTP（@115master/shared）
  proApiRequest: new GMRequest(),        // Pro API：GM_xmlhttpRequest 跨域
  crypto115: new Crypto115(),
  logger: appLogger,
  onError(result) { /* result.action: 'relogin' | 'verify' → UI */ },
})
```

- `GMRequest`（`utils/request/gmRequest.ts`）实现 `IRequest`，封装 `GM_xmlhttpRequest`，支持 `GMRequestCache`、Chrome 下 `redirect: manual`（避免并发请求互被 cancel）。
- 类型从 `@115master/drive115` 的 `Api` / `Share` 命名空间取。
- ⚠️ 改 `packages/drive115` 源码后须 rebuild 其 `dist`，否则本包 `type-check` 报旧符号（monkey 消费的是 dist 类型）。

### XPlayer（视频播放器）

`components/XPlayer/` 自包含播放器，内部架构与 SPA 同构：

- `hooks/` — `useSources` / `useSubtitles` / `useControls` / `useFullscreen` / `usePlaybackRate` / `useThumbnail` / `useHud`…，`usePlayerProvide` 注入上下文。
- `events/` — mitt 事件总线；`components/` — Controls/HUD/Menu/Settings/Shortcuts/Subtitle/Thumbnail 等子 UI。
- 播放内核：`@libmedia/avplayer` + `hls.js` + `m3u8-parser`；`utils/clipper/` 提供 m3u8 剪辑。
- 视频页（`pages/video/index.vue`）通过 `data/useData*` 组合数据：文件信息、播放历史、书签、影片信息（jav 源）、播放列表、字幕（`@115master/subtitle-source`）、缩略图、视频源、用户偏好。

### 用户脚本机制

- `vite-plugin-monkey`，入口 `src/main.ts`；`@include`/`@exclude`/`@connect` 域名在 `vite.config.ts` 的 `userscript` 块。
- `run-at: document-start` —— `main.ts` 须先设 `document.domain` 再等 `DOMContentLoaded`。
- GM API 来自 `vite-plugin-monkey`（代码里从 `'$'` 别名或 `vite-plugin-monkey/dist/client` 导入）：`GM_getValue/setValue`、`GM_addStyle`、`GM_cookie`、`GM_xmlhttpRequest`、`unsafeWindow`。
- 重型依赖走 CDN `externalGlobals`（Vue、localforage、lodash、dayjs、hls.js、m3u8-parser、photoswipe…），不打进包体。
- 产物：`dist/115master.user.js` + `dist/115master.meta.js`。

### 用户设置与主题

- `userSettings`（`utils/userSettings.ts`）— `Proxy` 包裹 `GM_getValue/setValue`（命名空间 `USER_SETTINGS`），`.value` 读写、`.watch(key, cb)` 响应变化。现有字段：`enableFilelistPreview`、`theme`。
- `utils/theme.ts` — `data-theme` 写到 `#my-app`，支持 `system/light/dark`；`userSettings.theme` 驱动，系统主题变化时 `resolvedTheme` 回填。

## 开发

- `pnpm dev` — **按 git 分支派生 dev server**：用分支名 FNV-1a 哈希映射端口（base 5180），脚本名加分支后缀，多分支可并行不冲突；打开 `https://115.com/?bn=<branch>`。可用 `BRANCH_PORT` 手动覆盖端口（见 `plugins/dev.ts`）。
- HTTPS dev 由 `vite-plugin-mkcert` 提供（115 要求 https）。
- `dev:plus` / `build:plus` — 设 `VITE_PLUS_VERSION=true`，实验功能用 `import.meta.env.VITE_PLUS_VERSION` 判断（也等价于 `constants` 里的 `PLUS_VERSION`）。
- type-check：`vue-tsc`，依赖 `@libmedia/*` 的 ESM 子路径 alias（见 `tsconfig.app.json`）。
- 测试：`pnpm test`（inertness 检查 + vitest projects：unit / storybook-dark / storybook-light）；单测过滤 `pnpm vitest run <pattern>`。业务 E2E：`pnpm test:e2e`（含构建）/ `pnpm test:e2e:run`（跳过构建，离线 harness，可 `--shard=i/n` 分片）——命令与并行规约详见 `docs/agents/verification.md`。

## 约定

- **Dialog 尺寸（size）**：统一走 `@115master/ui` Dialog 的 `size` 档位，按弹窗类型选择，不自定义宽度：
  - `md`（32rem，默认）— 确认框、提示（alert/confirm/prompt）、≤2 个字段的小表单；默认即此档，无需显式传。
  - `lg`（48rem）— 搜索+列表（如全局搜索、打标签）、设置面板、多字段表单（如离线下载）。
  - `xl`（72rem）— 文件浏览器等宽幅列表/树（`useFileBrowserDialog` 默认）。
  - `full` — 仅沉浸式场景，目前无业务使用。
  - 注意：size 仅在 ≥640px 断点生效，移动端各档渲染一致（底部抽屉）。
- **Modal Surface**：MASTER 与独立 Vue 挂载各自只放一个 `ModalHost`；`DialogHost`、声明式 `Dialog` 和 `Drawer` 都必须位于其下。模态边缘面板使用 UI `Drawer`（原生 top layer），`ui-z-sheet` 只用于不阻断页面的 page drawer。
- **NavigationStack 组合**：NavigationStack 只负责受控内容导航，不拥有 open 状态或模态外壳；桌面偏好设置组合 `Dialog size="lg"`，移动端组合 bottom `Drawer size="lg"`。调用方拥有页面标识、层级和关闭状态。
- **Drawer 尺寸**：优先使用 `sm / md / lg / full` 语义档；确有连续响应宽度时只覆盖公共 `--ui-drawer-size`，不依赖 UI 内部 panel 类或自定义 z-index。
- **TSX + SFC 混用**：App 骨架、drive 页用 `.tsx`（`defineComponent` + JSX）；UI 组件多用 `.vue` SFC。
- **路径别名**：`@/` → `src/`。
- **错误处理**：业务异常经 `drive115` 的 `onError` 回调收敛为 `action`，UI 据 `action` 决定行为，不识别具体错误码。
