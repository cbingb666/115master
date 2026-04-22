---
"@115master/monkey": minor
---

新增 Aria2 RPC 导出功能：

- 文件列表每行在 115 原生下载按钮旁增加「推送 Aria2」按钮
- 支持配置多个 RPC 预设，按数量自适应（0=引导/1=单按钮/≥2=下拉）
- **支持文件夹递归下载**：自动遍历子目录，在 aria2 落盘时保留目录结构
- 独立设置面板：RPC 列表、下载路径、递归间隔、SHA1 校验、UA/Referer/自定义 Headers
- 新增通用 MasterToast 组件，支持 info / success / error / loading（带进度更新）
- 自动注入 115 的 Cookie / UA / Referer 到 aria2，绕过下载鉴权
