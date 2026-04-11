# 文件夹图片预览功能设计文档

**日期**: 2026-04-12  
**功能**: 支持预览文件夹下所有图片，采用客户端分页模式  
**作者**: Claude

---

## 需求概述

在 115 网盘文件列表中，点击图片时能够预览当前文件夹下的所有图片（跨分页），而非仅当前页的图片。

---

## 设计决策

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 加载范围 | 仅当前文件夹 | 不包含子文件夹，减少复杂度 |
| 加载策略 | 客户端分页 | 一次性获取所有图片数据，按页显示 |
| 分页大小 | 1000 张/页 | 平衡加载速度与内存占用 |
| 排序方式 | 跟随列表排序 | 与文件列表当前排序保持一致 |
| 文件夹处理 | 跳过 | 预览器中只显示图片文件 |

---

## 架构设计

```
src/components/ImagePreviewer/
├── index.ts                    # 统一导出
├── ImagePreviewer.tsx          # Fancybox 封装组件
├── useImagePreviewer.ts        # 预览器状态管理
└── types.ts                    # 类型定义

src/hooks/
└── useFolderImagePreview.ts    # 文件夹图片预览核心逻辑
```

---

## 核心模块

### 1. useFolderImagePreview Hook

负责管理文件夹图片数据的聚合、分页和预览状态。

```typescript
interface UseFolderImagePreviewOptions {
  cid: string
  order: WebApi.Entity.Sorter['o']
  asc: WebApi.Entity.Sorter['asc']
  pageSize?: number  // 默认 1000
}

interface UseFolderImagePreviewReturn {
  open: (startItem: WebApi.Entity.FilesItem) => void
  close: () => void
  loading: boolean
  total: number
  currentPage: number
  totalPages: number
}
```

**职责**:
- 递归获取当前文件夹全部文件数据
- 过滤出图片文件（通过 `data.u` 判断）
- 按指定大小分页切片
- 管理 Fancybox 生命周期
- 处理翻页时的页面切换

---

### 2. ImagePreviewer 组件

Fancybox 的封装组件，支持分页感知。

```typescript
interface ImagePreviewerProps {
  images: ImagePreviewItem[]
  startIndex: number
  pageInfo: {
    current: number
    total: number
  }
  loading?: boolean
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (direction: 'next' | 'prev') => void
  onClose: () => void
}
```

**交互**:
- 工具栏显示页码: "第 3 页 / 共 5 页"
- 边界翻页：最后一页最后一张按右箭头加载下一页
- 键盘支持：左右箭头翻页，ESC 关闭
- 加载状态：切换页面时显示 loading

---

### 3. 数据结构

```typescript
interface ImagePreviewItem {
  src: string        // 原图 URL
  thumbSrc: string   // 缩略图 URL
  caption: string    // 文件名
  fileData: WebApi.Entity.FilesItem
  globalIndex: number
}

interface ImagePage {
  pageNum: number
  items: ImagePreviewItem[]
  loaded: boolean
}
```

---

## 数据流

1. 用户点击某张图片 → 触发 `folderPreview.open(startItem)`
2. Hook 获取当前文件夹全部数据
3. 过滤图片并按分页大小切片
4. 确定 startItem 所在页码
5. 打开 Fancybox，传入该页数据
6. 用户翻页到边界 → 触发页面切换 → 加载新页数据

---

## 集成点

### FileItem 组件修改

```typescript
// useFileItem.ts
function handlePreview() {
  folderPreview.open(data)
}

// 点击处理
onClick={() => {
  if (hasImagePreview.value) {
    folderPreview.open(props.data)
  } else {
    handleClick(item)
  }
}}
```

---

## 错误处理

| 场景 | 处理 |
|------|------|
| 加载失败 | Fancybox 显示错误占位图，支持重试 |
| 空文件夹（无图片） | Toast 提示"当前文件夹没有图片" |
| 翻页到边界 | 禁用对应方向翻页按钮 |
| 网络中断 | 保留已加载页面，失败页面显示重试 |

---

## 性能优化

1. **分页懒加载**: 仅加载当前页和相邻页原图
2. **缩略图优先**: 先显示缩略图，再加载高清原图
3. **内存管理**: 关闭预览器时清理分页数据
4. **并发控制**: 获取文件夹数据时分批请求，避免并发过大

---

## API 复用

复用现有的 `useDriveExplorer` 数据获取逻辑，无需新增后端接口。

```typescript
async function fetchAllImages(cid: string, order, asc) {
  const allItems = []
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const res = await drive115.WebApiGetFiles({
      cid,
      offset: (page - 1) * 50,
      limit: 50,
      order,
      asc,
    })
    allItems.push(...res.data)
    hasMore = res.data.length === 50
    page++
  }
  
  return allItems.filter(item => Boolean(item.u))
}
```

---

## 边界情况

1. **大文件夹（10000+ 图片）**: 分页大小 1000，最多 10 页，可控
2. **用户快速翻页**: 使用防抖/节流，避免频繁加载
3. **排序切换**: 关闭预览器后重新打开，采用新排序
4. **文件被删除**: 预览器打开期间文件被删，显示错误占位图

---

## 后续扩展

- 支持预览视频文件
- 支持幻灯片播放模式
- 支持图片下载/分享快捷操作
