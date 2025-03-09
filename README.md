# 115Master

115Master 是一个 115 网盘的 Tampermonkey 脚本，旨在提升 `115网盘` 的浏览体验（屌炸天的功能）。

Tips: 小作坊出品下料很猛，请谨慎食用，如果觉得好用，请给个 Star 支持一下，谢谢。

![preview](./docs/images/preview.png)

## 功能

### 文件列表

- 👀 预览番号信息
- 📷 预览视频缩略图
- 📄 文件列表点击鼠标中键打开文件夹新标签页
- ⌚ Tab 标题上显示当前目录路径

### 播放器

- 🎨 `Ultra原画` 增强
- 👁 视频缩略图（秒级显示）
- 🚀 超快的加载速度，丝滑的快进、拖拽播放体验 (快好几倍)
- 🤖 在线外挂字幕（根据番号自动匹配）
- 🔍 番号信息展示
- ⌚ 播放列表展示
- 🎉 支持一键唤起 [IINA](https://iina.io/) 播放 (实验性功能)

## 安装

以下安装说明，请认真仔细阅读!

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)。

2. 开启 [浏览器扩展开发者模式](https://www.tampermonkey.net/faq.php#Q209)。

3. 一键安装 [115master.user.js](https://github.com/cbingb666/115master/releases/latest/download/115master.user.js) 安装 【115Master】脚本。

4. 油猴面板勾选启动 【115Master】脚本，刷新页面开始使用。

5. 安装完成后如果没有看到文件列表中有【master播放】的按钮，请检查有没有其他脚本导致冲突或重启浏览器。
   
<img width="329" alt="image" src="https://github.com/user-attachments/assets/189ac578-0592-43bd-ab75-b62cbe6f5170" />


👆上面一通操作后，还是无法使用的话请进入 [TG群](https://t.me/+EzfL2xXhlOA4ZjBh) 反馈或提交 [Issues](https://github.com/cbingb666/115master/issues)，请说明你的详情操作！

## 常见问题

### Q: 为什么会弹出提示删除 User-Agent Switcher and Manager 插件？

    A: 因为现在不需要修改 User-Agent 了，所以请删除这个插件并重启浏览器。

### Q: 为什么我没有安装过 User-Agent Switcher and Manager 插件，也会提示删除？

    A: 因为你是 【115Browser浏览器v27.x.x】 版本，请升级浏览器的版本。

### Q: 为什么 【Ultra原画】 部分视频无法播放、黑屏、没有声音？

    A: 因为部分视频格式浏览器不支持播放。如：常见的 `.mkv` 可能没有声音，部分 `.mp4` 由于视频内部编码不兼容也会有些意外的情况。

      1. 请降低画质播放
      2. 使用 IINA 本地播放（仅支持 MacOS 系统）
      3. Windows 系统用户，请关注项目更新，后续会支持

### Q: 为什么有些视频没有字幕？

    A: 因为现在只支持了绝大部分番号的识别。

### Q: 啊啊啊我想要这个功能那个功能，能不能支持呀？

    A：你有想法很好！请提交到 [Issues](https://github.com/cbingb666/115master/issues)，作者脑容量有限，挂在 Issues 的会优先考虑解决。

### Q: 我已经有 Emby、Jellyfin 为啥还要这个插件呀？

    A: 因为这是个下载、播放、字幕、预览一条龙的插件（你会体会不一样的快乐的）。常见的影库从下载、试看、播放，整个过程还是比较割裂不方便，影库更适合做为影片收藏归档方便以后反复品味~
