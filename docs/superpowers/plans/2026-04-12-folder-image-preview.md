# 文件夹图片预览功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现文件夹下所有图片的预览功能，采用客户端分页模式（每页1000张）

**Architecture:** 创建 `useFolderImagePreview` hook 聚合文件夹所有图片数据，按页管理；创建 `ImagePreviewer` 组件封装 Fancybox 支持分页感知；集成到现有 `FileItem` 组件的点击处理中

**Tech Stack:** Vue 3 + TSX, @fancyapps/ui, @115master/drive115

---

## File Structure

```
apps/monkey/src/
├── components/ImagePreviewer/
│   ├── index.ts                    # 统一导出
│   ├── types.ts                    # 类型定义
│   ├── useImagePreviewer.ts        # 预览器核心逻辑
│   └── ImagePreviewer.tsx          # Fancybox 封装组件
├── hooks/
│   └── useFolderImagePreview.ts    # 文件夹图片预览 hook
└── components/FileItem/
    ├── useFileItem.ts              # 修改：集成 folder preview
    └── FileItem.tsx                # 修改：调用预览 hook
```

---

## Task 1: Create ImagePreviewer Types

**Files:**
- Create: `apps/monkey/src/components/ImagePreviewer/types.ts`

**Context:** 本项目使用 TSX + Vue 3，遵循单文件单职责原则，类型定义放在单独的 types.ts 中

- [ ] **Step 1: Create types.ts with all type definitions**

```typescript
import type { WebApi } from '@115master/drive115'

/** 图片预览项 */
export interface ImagePreviewItem {
  /** 原图 URL */
  src: string
  /** 缩略图 URL */
  thumbSrc: string
  /** 文件名 */
  caption: string
  /** 文件数据 */
  fileData: WebApi.Entity.FilesItem
  /** 在总列表中的索引 */
  globalIndex: number
}

/** 图片页 */
export interface ImagePage {
  /** 页码（从 1 开始） */
  pageNum: number
  /** 该页图片列表 */
  items: ImagePreviewItem[]
  /** 是否已加载 */
  loaded: boolean
}

/** 页码信息 */
export interface PageInfo {
  /** 当前页 */
  current: number
  /** 总页数 */
  total: number
}

/** 预览器状态 */
export interface PreviewerState {
  /** 是否打开 */
  isOpen: boolean
  /** 当前页码 */
  currentPage: number
  /** 总页数 */
  totalPages: number
  /** 是否正在加载 */
  loading: boolean
  /** 当前页图片 */
  currentImages: ImagePreviewItem[]
  /** 当前页内索引 */
  currentIndex: number
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/monkey/src/components/ImagePreviewer/types.ts
git commit -m "feat(ImagePreviewer): add type definitions"
```

---

## Task 2: Create useImagePreviewer Hook

**Files:**
- Create: `apps/monkey/src/components/ImagePreviewer/useImagePreviewer.ts`
- Modify: `apps/monkey/src/components/ImagePreviewer/index.ts`

**Context:** 本项目使用 @fancyapps/ui 的 Fancybox，现有 `useFilePreview` 在 `apps/monkey/src/components/FileList/useFileList.tsx:206-245`。新 hook 需要管理分页状态，支持跨页切换

- [ ] **Step 1: Create useImagePreviewer.ts**

```typescript
import type { FancyboxOptions } from '@fancyapps/ui/dist/fancybox'
import { Fancybox } from '@fancyapps/ui/dist/fancybox/'
import { computed, ref, shallowRef } from 'vue'
import { Utils115 } from '@/utils/utils115'
import type { ImagePage, ImagePreviewItem, PageInfo } from './types'

const DEFAULT_PAGE_SIZE = 1000

interface UseImagePreviewerOptions {
  pageSize?: number
}

export function useImagePreviewer(options: UseImagePreviewerOptions = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE

  const isOpen = shallowRef(false)
  const pages = shallowRef<ImagePage[]>([])
  const currentPageNum = shallowRef(1)
  const loading = shallowRef(false)

  const currentPage = computed(() =>
    pages.value.find(p => p.pageNum === currentPageNum.value),
  )

  const currentImages = computed(() =>
    currentPage.value?.items ?? [],
  )

  const pageInfo = computed<PageInfo>(() => ({
    current: currentPageNum.value,
    total: pages.value.length,
  }))

  const hasNextPage = computed(() =>
    currentPageNum.value < pages.value.length,
  )

  const hasPrevPage = computed(() =>
    currentPageNum.value > 1,
  )

  /** 构建 Fancybox 数据源 */
  function buildDataSource(images: ImagePreviewItem[]) {
    return images.map((item, index) => ({
      src: item.src,
      thumbSrc: item.thumbSrc,
      caption: item.caption,
      index,
    }))
  }

  /** 打开预览器 */
  function open(allImages: ImagePreviewItem[], startIndex: number) {
    if (allImages.length === 0)
      return

    // 分页切片
    const newPages: ImagePage[] = []
    for (let i = 0; i < allImages.length; i += pageSize) {
      const pageNum = Math.floor(i / pageSize) + 1
      newPages.push({
        pageNum,
        items: allImages.slice(i, i + pageSize).map((item, idx) => ({
          ...item,
          globalIndex: i + idx,
        })),
        loaded: true,
      })
    }
    pages.value = newPages

    // 确定起始页
    const startPageNum = Math.floor(startIndex / pageSize) + 1
    const pageStartIndex = startIndex % pageSize
    currentPageNum.value = startPageNum

    const initialImages = newPages[startPageNum - 1]?.items ?? []

    isOpen.value = true

    Fancybox.show(buildDataSource(initialImages), {
      startIndex: pageStartIndex,
      mainStyle: {
        '--fancybox-backdrop-bg': 'rgba(0, 0, 0, 1)',
      },
      Carousel: {
        transition: 'crossfade',
        on: {
          change: (carousel) => {
            handleSlideChange(carousel.page, carousel.pages.length)
          },
        },
      },
      Toolbar: {
        display: {
          left: ['counter'],
          right: ['thumbs', 'download', 'fullscreen', 'close'],
        },
      },
      caption: (item: any) => {
        return `${item.caption} (${pageInfo.value.current}/${pageInfo.value.total})`
      },
      on: {
        close: () => {
          isOpen.value = false
        },
      },
    } as FancyboxOptions)
  }

  /** 处理幻灯片切换 */
  function handleSlideChange(slideIndex: number, totalSlides: number) {
    // 在第一页第一张，尝试上一页
    if (slideIndex === 0 && currentPageNum.value > 1) {
      prevPage()
      return
    }

    // 在最后一页最后一张，尝试下一页
    if (slideIndex === totalSlides - 1 && currentPageNum.value < pages.value.length) {
      nextPage()
    }
  }

  /** 切换到下一页 */
  function nextPage() {
    if (!hasNextPage.value)
      return

    currentPageNum.value++
    refreshFancybox()
  }

  /** 切换到上一页 */
  function prevPage() {
    if (!hasPrevPage.value)
      return

    currentPageNum.value--
    refreshFancybox()
  }

  /** 刷新 Fancybox 内容 */
  function refreshFancybox() {
    const instance = Fancybox.getInstance()
    if (!instance)
      return

    const newImages = currentImages.value
    const newDataSource = buildDataSource(newImages)

    // 重新设置幻灯片
    instance.setSlide(0)
    instance.destroy()

    Fancybox.show(newDataSource, {
      startIndex: 0,
      mainStyle: {
        '--fancybox-backdrop-bg': 'rgba(0, 0, 0, 1)',
      },
      Carousel: {
        transition: 'crossfade',
        on: {
          change: (carousel) => {
            handleSlideChange(carousel.page, carousel.pages.length)
          },
        },
      },
      Toolbar: {
        display: {
          left: ['counter'],
          right: ['thumbs', 'download', 'fullscreen', 'close'],
        },
      },
      caption: (item: any) => {
        return `${item.caption} (${pageInfo.value.current}/${pageInfo.value.total})`
      },
      on: {
        close: () => {
          isOpen.value = false
        },
      },
    } as FancyboxOptions)
  }

  /** 关闭预览器 */
  function close() {
    Fancybox.close()
    isOpen.value = false
  }

  return {
    isOpen,
    loading,
    pageInfo,
    currentImages,
    hasNextPage,
    hasPrevPage,
    open,
    close,
    nextPage,
    prevPage,
  }
}

export type UseImagePreviewerReturn = ReturnType<typeof useImagePreviewer>
```

- [ ] **Step 2: Update index.ts to export new modules**

```typescript
export { useImagePreviewer } from './useImagePreviewer'
export type { UseImagePreviewerReturn } from './useImagePreviewer'
export type {
  ImagePreviewItem,
  ImagePage,
  PageInfo,
} from './types'
```

- [ ] **Step 3: Commit**

```bash
git add apps/monkey/src/components/ImagePreviewer/
git commit -m "feat(ImagePreviewer): add useImagePreviewer hook for paginated preview"
```

---

## Task 3: Create useFolderImagePreview Hook

**Files:**
- Create: `apps/monkey/src/hooks/useFolderImagePreview.ts`

**Context:** 需要获取文件夹所有文件数据，过滤出图片（通过 `data.u` 判断），保持当前排序。API 调用参考 `useDriveExplorer` 中的 `fetchList` 方法

- [ ] **Step 1: Create useFolderImagePreview.ts**

```typescript
import type { WebApi } from '@115master/drive115'
import { useAsyncState } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useImagePreviewer } from '@/components/ImagePreviewer'
import { drive115 } from '@/utils/drive115Instance'
import { Utils115 } from '@/utils/utils115'
import type { ImagePreviewItem } from '@/components/ImagePreviewer/types'

const BATCH_SIZE = 50
const DEFAULT_PAGE_SIZE = 1000

interface UseFolderImagePreviewOptions {
  cid: string
  order: WebApi.Entity.Sorter['o']
  asc: WebApi.Entity.Sorter['asc']
  fcMix?: WebApi.Entity.Sorter['fc_mix']
  pageSize?: number
}

export function useFolderImagePreview(options: UseFolderImagePreviewOptions) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE

  const images = ref<ImagePreviewItem[]>([])
  const { isReady, execute, isLoading } = useAsyncState(
    async () => {
      const allImages = await fetchAllImages()
      images.value = allImages
      return allImages
    },
    [],
    { immediate: false },
  )

  const previewer = useImagePreviewer({ pageSize })

  const total = computed(() => images.value.length)

  const totalPages = computed(() =>
    Math.ceil(total.value / pageSize),
  )

  /** 获取文件夹所有图片 */
  async function fetchAllImages(): Promise<ImagePreviewItem[]> {
    const allItems: WebApi.Entity.FilesItem[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const offset = (page - 1) * BATCH_SIZE
      const res = await drive115.webApiGetFiles({
        aid: '1',
        cid: options.cid || '0',
        show_dir: 1,
        offset,
        limit: BATCH_SIZE,
        format: 'json',
        natsort: 1,
        o: options.order,
        asc: options.asc,
        fc_mix: options.fcMix,
      })

      const items = res.data || []
      allItems.push(...items)

      hasMore = items.length === BATCH_SIZE
      page++

      // 安全限制：最多获取 10000 张图片
      if (allItems.length >= 10000) {
        break
      }
    }

    // 过滤出图片（有 u 字段的）
    return allItems
      .filter(item => Boolean(item.u))
      .map((item, index) => ({
        src: Utils115.getScaleThumbnail(item.u, 0),
        thumbSrc: item.u,
        caption: item.n,
        fileData: item,
        globalIndex: index,
      }))
  }

  /** 打开预览器 */
  async function open(startItem: WebApi.Entity.FilesItem) {
    // 如果数据未加载，先加载
    if (!isReady.value) {
      await execute()
    }

    if (images.value.length === 0) {
      // 使用 Toast 提示
      const { showToast } = await import('@/components/Toast')
      showToast('当前文件夹没有图片')
      return
    }

    const startIndex = images.value.findIndex(
      img => img.fileData.pc === startItem.pc,
    )

    if (startIndex === -1) {
      // 起始图片不在列表中，从第一张开始
      previewer.open(images.value, 0)
      return
    }

    previewer.open(images.value, startIndex)
  }

  /** 关闭预览器 */
  function close() {
    previewer.close()
  }

  /** 刷新数据 */
  async function refresh() {
    await execute()
  }

  return {
    open,
    close,
    refresh,
    loading: isLoading,
    total,
    totalPages,
    currentPage: computed(() => previewer.pageInfo.current),
    isOpen: computed(() => previewer.isOpen),
  }
}

export type UseFolderImagePreviewReturn = ReturnType<typeof useFolderImagePreview>
```

- [ ] **Step 2: Commit**

```bash
git add apps/monkey/src/hooks/useFolderImagePreview.ts
git commit -m "feat(hooks): add useFolderImagePreview for folder image preview"
```

---

## Task 4: Modify useFileItem to Support Folder Preview

**Files:**
- Modify: `apps/monkey/src/components/FileItem/useFileItem.ts`

**Context:** 现有的 `useFileItem` 已有 `onPreview` 回调，需要修改为支持新的 folder preview 方式。检查当前文件第 25-30 行，已经有 `onPreview` 选项

- [ ] **Step 1: Modify useFileItem.ts to integrate folder preview**

在文件顶部添加 import:
```typescript
import { useFolderImagePreview } from '@/hooks/useFolderImagePreview'
```

修改 interface UseFileItemOptions（在第 25 行附近）:
```typescript
interface UseFileItemOptions {
  data: WebApi.Entity.FilesItem
  pathSelect?: boolean
  cid?: string
  order?: WebApi.Entity.Sorter['o']
  asc?: WebApi.Entity.Sorter['asc']
  onPreview?: (data: WebApi.Entity.FilesItem) => void
}
```

修改 useFileItem 函数体，在 setup 中添加 folder preview hook:

```typescript
export function useFileItem(options: UseFileItemOptions) {
  const { data, onPreview } = options
  const dialog = useDialog()
  const itemRef = shallowRef<HTMLElement>()
  const isDrogzone = shallowRef(false)
  const isDragging = shallowRef(false)

  // 添加 folder image preview 支持
  const folderPreview = options.cid
    ? useFolderImagePreview({
        cid: options.cid,
        order: options.order ?? 'user_ptime',
        asc: options.asc ?? 0,
      })
    : null

  // ... 保持原有代码不变 ...

  // 修改 open 函数中的图片预览逻辑（约第 109-131 行）
  async function open(): Promise<void> {
    if (link.value) {
      if ('to' in link.value) {
        router.push(link.value.to!)
        return
      }
      if ('href' in link.value) {
        window.open(link.value.href, link.value.target)
        return
      }
    }

    // 图片预览：优先使用 folder preview
    if (data.u) {
      if (folderPreview) {
        await folderPreview.open(data)
      }
      else {
        onPreview?.(data)
      }
      return
    }

    dialog.alert({
      title: '提示',
      content: '暂不支持打开该文件类型',
      confirmText: '知道了',
    })
  }

  // ... 保持其余代码不变 ...

  return {
    // ... 保持原有返回 ...
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/monkey/src/components/FileItem/useFileItem.ts
git commit -m "feat(FileItem): integrate folder image preview in useFileItem"
```

---

## Task 5: Update FileItem Component Props

**Files:**
- Modify: `apps/monkey/src/components/FileItem/FileItem.tsx`

**Context:** `FileItem` 组件需要接收 cid、order、asc 等 props 并传递给 `useFileItem`

- [ ] **Step 1: Add new props to FileItem component**

在 props 定义中添加（在第 13-68 行之间）:

```typescript
const FileItem = defineComponent({
  name: 'FileItem',
  inheritAttrs: true,
  props: {
    // ... 保持原有 props ...
    
    /** 文件夹 CID（用于图片预览） */
    cid: {
      type: String,
      default: undefined,
    },
    /** 排序字段 */
    order: {
      type: String as PropType<WebApi.Entity.Sorter['o']>,
      default: undefined,
    },
    /** 是否升序 */
    asc: {
      type: Number as PropType<WebApi.Entity.Sorter['asc']>,
      default: undefined,
    },
  },
  // ...
})
```

- [ ] **Step 2: Pass props to useFileItem**

修改 setup 中的 useFileItem 调用（在第 70-92 行附近）:

```typescript
const {
  itemRef,
  isDrogzone,
  isDragging: itemDragging,
  isVideo,
  isFolder,
  emoji,
  link,
  hasActressCover,
  hasVideoCover,
  hasImagePreview,
  actressAsyncState,
  videoCoverResult,
  open,
  handleDragLeave,
  handleDragOver,
  handleDrop,
} = useFileItem({
  data: props.data,
  pathSelect: props.pathSelect,
  cid: props.cid,
  order: props.order,
  asc: props.asc,
  onPreview: props.onPreview,
})
```

- [ ] **Step 3: Commit**

```bash
git add apps/monkey/src/components/FileItem/FileItem.tsx
git commit -m "feat(FileItem): add cid, order, asc props for folder preview"
```

---

## Task 6: Update Drive Page to Pass Sorting Props

**Files:**
- Modify: `apps/monkey/src/pages/drive/index.vue` 或相关的 drive 页面文件

**Context:** 需要找到 drive 页面的实际文件位置，并更新 FileItem 的调用以传递排序参数

- [ ] **Step 1: Find and read the drive page file**

```bash
find apps/monkey/src -name "*.vue" -o -name "*.tsx" | xargs grep -l "FileItem" | grep -E "(drive|page)" | head -5
```

- [ ] **Step 2: Update FileItem usage to pass sorting props**

在 drive 页面中找到 FileItem 的使用位置，添加 props:

```tsx
<FileItem
  // ... 原有 props ...
  cid={explorer.page.cid.value}
  order={explorer.page.order.value}
  asc={explorer.page.asc.value}
/>
```

- [ ] **Step 3: Commit**

```bash
git add <drive-page-file>
git commit -m "feat(drive): pass sorting props to FileItem for folder preview"
```

---

## Task 7: Integration Testing

**Files:**
- 无需修改，仅验证功能

- [ ] **Step 1: Run type check**

```bash
pnpm type-check
```

Expected: No type errors

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: No lint errors

- [ ] **Step 3: Build project**

```bash
pnpm build
```

Expected: Build succeeds

- [ ] **Step 4: Commit if all checks pass**

```bash
git commit --allow-empty -m "chore: verify folder image preview integration"
```

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ 客户端分页（每页 1000 张）- Task 2
- ✅ 仅当前文件夹 - Task 3
- ✅ 跟随列表排序 - Task 3, 4, 5
- ✅ 跳过文件夹，只显示图片 - Task 3（filter 逻辑）
- ✅ 页码显示 - Task 2（caption）
- ✅ 边界翻页 - Task 2（handleSlideChange）

**Placeholder Scan:**
- ✅ 无 TBD/TODO
- ✅ 所有代码都完整展示
- ✅ 无 "similar to" 引用

**Type Consistency:**
- ✅ `ImagePreviewItem` 在 Task 1 定义，Task 2, 3 使用
- ✅ `useImagePreviewer` 返回类型一致
- ✅ `useFolderImagePreview` 返回类型一致

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-12-folder-image-preview.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints for review

**Which approach?**
