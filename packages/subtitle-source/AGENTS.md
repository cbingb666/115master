# @115master/subtitle-source

## 架构

对接外部字幕网站，提供统一字幕搜索与下载接口。每个来源封装为一个独立 Client 类，通过 `SubtitleDeps` 注入 `IRequest` 依赖。

```
subtitle-source
├── Thunder      # 迅雷字幕（api-shoulei-ssl.xunlei.com）
└── SubtitleCat  # subtitlecat.com
```

## 目录结构

```
src/
├── index.ts
├── types.ts      # SubtitleDeps 依赖接口
├── cache.ts      # ProcessedSubtitle 统一字幕类型
└── source/
    ├── index.ts
    ├── thunder.ts     # Thunder 客户端
    └── subtitlecat.ts # SubtitleCat 客户端
```

## 核心概念

### SubtitleDeps

依赖注入接口，Client 通过构造函数接收：

```ts
interface SubtitleDeps {
  request: IRequest  // 来自 @115master/shared
}
```

### ProcessedSubtitle

SubtitleCat 返回的统一字幕结构：

```ts
interface ProcessedSubtitle {
  id: string           // md5 唯一标识
  raw: Blob            // 字幕文件 Blob
  format: string       // 'srt' | 'ass' | 'vtt' 等
  title: string        // 字幕标题
  downloads: number    // 下载次数
  comment: 1 | -1 | 0  // 赞/踩/无
  originLanguage: string
  targetLanguage: string
}
```

### Thunder

迅雷字幕 API 客户端。搜索返回 `ProcessedThunder[]`（不含下载次数和赞踩，多了 `score` 和 `extraName`）。

- API: `https://api-shoulei-ssl.xunlei.com/oracle/subtitle?name=...`
- 按 `score` 降序排列
- 单个字幕下载失败时返回 `null` 并被过滤，不影响整体

### SubtitleCat

subtitlecat.com 字幕客户端。搜索流程：

1. GET 搜索页 → DOM 解析表格行（`.sub-table tbody tr`，最多 5 条）
2. 标题匹配过滤 → 获取详情页下载链接（`#download_{language}`）
3. 下载字幕 Blob
4. 排序：先按 comment（赞优先），再按 downloads 降序

## 使用示例

```ts
import { subtitleSource } from '@115master/subtitle-source'

const thunder = new subtitleSource.Thunder({ request })
const subtitles = await thunder.fetchSubtitle('video_name')

const subtitlecat = new subtitleSource.SubtitleCat({ request })
const results = await subtitlecat.fetchSubtitle('keyword', 'zh')
```
