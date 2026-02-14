import type { PropType } from 'vue'
import type { WebApi } from '@/utils/drive115/api'
import { Icon } from '@iconify/vue'
import { useAsyncState } from '@vueuse/core'
import { computed, defineComponent, shallowRef, withModifiers } from 'vue'
import { router } from '@/app/router'
import { useDialog } from '@/components/Dialog'
import { Link } from '@/components/Link'
import { useContextmenu } from '@/hooks/useContextmenu'
import { useSmartVideoCover } from '@/hooks/useVideoCover'
import { ICON_TOP_SOLID } from '@/icons'
import { actressFaceDB } from '@/utils/actressFaceDB'
import { clsx } from '@/utils/clsx'
import { formatFileSize, formatYMDHM } from '@/utils/format'
import { isPortraitImage } from '@/utils/image'
import { extractEmojis } from '@/utils/string'
import { Utils115 } from '@/utils/utils115'
import { useFileListInject } from '../FileList/provide'

/** 统一样式 */
const styles = clsx({
  root: [
    'group',
    'relative',
    'flex',
    'rounded-lg',
    'min-w-0',
    'hover:bg-neutral-500/10',
    // checked
    'data-[checked=true]:ring-secondary/80',
    'data-[checked=true]:bg-secondary/80!',
    'data-[checked=true]:hover:ring-secondary/90!',
    'data-[checked=true]:hover:bg-secondary/90!',
    // dropzone
    'data-[dropzone=true]:bg-secondary/80',
    // dragging
    'data-[dragging=true]:opacity-30',
    // 列表模式
    'data-[view-type=list]:items-stretch',
    'data-[view-type=list]:hover:bg-neutral-500/10',
    // 卡片模式
    'data-[view-type=card]:flex-col',
    'data-[view-type=card]:h-full', // 充满网格单元格
    'data-[view-type=card]:rounded-2xl',
    'data-[view-type=card]:hover:bg-neutral-600/10',
    'data-[view-type=card]:active:bg-neutral-600/20',
    'data-[view-type=card]:data-[checked=true]:ring-8',
  ],
  label: [
    'cursor-pointer',
    // 列表模式
    'group-data-[view-type=list]:flex group-data-[view-type=list]:items-center group-data-[view-type=list]:px-4 group-data-[view-type=list]:cursor-pointer',
    // 卡片模式
    'group-data-[view-type=card]:absolute group-data-[view-type=card]:top-3 group-data-[view-type=card]:left-3 group-data-[view-type=card]:z-10',
    'group-data-[view-type=card]:flex group-data-[view-type=card]:items-center',
  ],
  checkbox: [
    'checkbox checkbox-sm checkbox-primary',
    'bg-primary/10 border-primary/50',
    'drop-shadow-sm drop-shadow-neutral-950',
    'transition-all',
    'opacity-0 group-hover:opacity-100',
    'checked:opacity-100',
    // 焦点样式
    'focus:opacity-100',
    'focus:ring-2',
    'focus:ring-primary/50',
    'focus:ring-offset-1',
    'focus:ring-offset-base-100',
  ],
  wrapper: [
    'cursor-default',
    // 列表模式
    'group-data-[view-type=list]:flex-1 group-data-[view-type=list]:flex',
    'group-data-[view-type=list]:items-center',
    'group-data-[view-type=list]:min-w-0',
    'group-data-[view-type=list]:gap-4',
    'group-data-[view-type=list]:py-3',
    // 卡片模式
    'group-data-[view-type=card]:flex-1 group-data-[view-type=card]:flex group-data-[view-type=card]:flex-col',
    'group-data-[view-type=card]:min-w-0',
  ],
  coverBox: [
    'flex',
    'items-center',
    'justify-center',
    // 列表模式
    'group-data-[view-type=list]:relative',
    'group-data-[view-type=list]:size-14',
    // 卡片模式
    'group-data-[view-type=card]:relative',
    'group-data-[view-type=card]:w-full',
    'group-data-[view-type=card]:rounded-2xl',
    'group-data-[view-type=card]:aspect-video',
    'group-data-[view-type=card]:bg-base-content/3',
  ],
  coverFolder: [
    'cursor-grab',
    'relative',
    // 列表模式
    'group-data-[view-type=list]:size-14',
    // 卡片模式
    'group-data-[view-type=card]:h-[61%]',
  ],
  coverFolderIcon: [
    'w-full',
    'h-full',
    'text-blue-300/90',
    'drop-shadow-md',
    'drop-shadow-blue-950',
  ],
  coverFolderSymbol: [
    'absolute',
    'inset-0',
    'm-auto',
    'flex',
    'items-center',
    'justify-center',
    'drop-shadow-sm',
    'drop-shadow-blue-500',
    // 列表模式
    'group-data-[view-type=list]:text-2xl',
    'group-data-[view-type=list]:translate-y-0.5',
    // 卡片模式
    'group-data-[view-type=card]:text-5xl',
    'group-data-[view-type=card]:translate-y-1',
  ],
  coverFileIcon: [
    'cursor-grab',
    'relative',
    'object-contain',
    // 列表模式
    'group-data-[view-type=list]:size-14',
    // 卡片模式
    'group-data-[view-type=card]:h-[61%]',
    'group-data-[view-type=card]:transition-all',
  ],
  coverVideoWrapper: [
    'cursor-grab',
    'absolute inset-0 m-auto',
    'w-full h-full',
    'bg-black',
    'overflow-hidden',
    'border-1',
    'border-base-content/5',
    // 列表模式
    'group-data-[view-type=list]:rounded-lg',
    // 卡片模式
    'group-data-[view-type=card]:rounded-2xl',
    'group-data-[view-type=card]:overflow-hidden',
  ],
  coverVideo: [
    'w-full h-full object-cover',
    'transition-all',
    'duration-300',
    'ease-[cubic-bezier(0.33_0_0.67_1)]',
    // 卡片模式
    'group-data-[view-type=card]:data-[portrait=true]:object-contain',
    'group-data-[view-type=card]:group-hover:scale-105',
  ],
  coverImage: [
    'cursor-grab',
    'object-cover',
    'bg-base-content/90',
    'rounded-md',
    // 列表模式
    'group-data-[view-type=list]:size-14',
    'group-data-[view-type=list]:ring-1',
    'group-data-[view-type=list]:ring-neutral-800',
    // 卡片模式
    'group-data-[view-type=card]:relative',
    'group-data-[view-type=card]:bg-black',
    'group-data-[view-type=card]:object-contain',
    'group-data-[view-type=card]:h-[61%]',
    'group-data-[view-type=card]:transition-all',
  ],
  coverActressFace: [
    'cursor-grab',
    'aspect-square',
    'object-cover',
    'object-top',
    'rounded-lg',
    // 列表模式
    'group-data-[view-type=list]:size-13',
    'group-data-[view-type=list]:border-1',
    'group-data-[view-type=list]:border-neutral-800',
    // 卡片模式
    'group-data-[view-type=card]:absolute',
    'group-data-[view-type=card]:h-[61%]!',
    'group-data-[view-type=card]:rounded-full',
    'group-data-[view-type=card]:border-3',
    'group-data-[view-type=card]:border-base-content/5',
    'group-data-[view-type=card]:shadow-[0_0_12px_var(--color-black)_inset]',
  ],
  contextmenu: [
    'fixed top-0 left-0',
    'bg-base-content/10',
    'rounded-md',
    'menu',
  ],
  top: [
    'text-orange-500 size-5',
    // 列表模式
    'group-data-[view-type=list]:absolute group-data-[view-type=list]:-top-1 group-data-[view-type=list]:-left-2',
    'group-data-[view-type=list]:-rotate-45',
    // 卡片模式
    'group-data-[view-type=card]:absolute group-data-[view-type=card]:top-1 group-data-[view-type=card]:right-1',
  ],
  content: [
    'flex-1',
    // 列表模式
    'group-data-[view-type=list]:flex-col',
    'group-data-[view-type=list]:items-center',
    'group-data-[view-type=list]:min-w-0',
    'group-data-[view-type=list]:gap-4',
    'sm:group-data-[view-type=list]:flex',
    'sm:group-data-[view-type=list]:flex-row',
    // 卡片模式
    'group-data-[view-type=card]:grid',
    'group-data-[view-type=card]:grid-cols-[1fr_auto]',
    'group-data-[view-type=card]:grid-rows-[auto_auto_auto]',
    'group-data-[view-type=card]:p-3',
    'group-data-[view-type=card]:gap-1',
    'group-data-[view-type=card]:min-w-0',
  ],
  name: [
    'relative',
    'flex-1',
    // 列表模式
    'group-data-[view-type=list]:space-x-2',
    // 卡片模式
    'group-data-[view-type=card]:col-span-2',
    'group-data-[view-type=card]:row-start-1',
  ],
  nameText: [
    'text-neutral-100',
    'text-base',
    'break-words',
    'wrap-anywhere',
    // 列表模式
    'group-data-[view-type=list]:truncate',
    'group-data-[view-type=list]:max-sm:block',
    // 卡片模式
    'group-data-[view-type=card]:font-medium',
    'group-data-[view-type=card]:line-clamp-4',
  ],
  star: [
    'inline-flex',
    // 列表模式
    'group-data-[view-type=list]:size-5',
    // 卡片模式
    'group-data-[view-type=card]:size-4',
  ],
  size: [
    'text-base-content/60',
    // 列表模式
    'group-data-[view-type=list]:w-24 group-data-[view-type=list]:text-xs sm:group-data-[view-type=list]:text-sm',
    // 卡片模式
    'group-data-[view-type=card]:text-xs',
    'group-data-[view-type=card]:col-start-2',
    'group-data-[view-type=card]:row-start-3',
    'group-data-[view-type=card]:text-right',
  ],
  time: [
    'text-base-content/60',
    // 列表模式
    'group-data-[view-type=list]:w-60 group-data-[view-type=list]:text-xs sm:group-data-[view-type=list]:text-sm',
    // 卡片模式
    'group-data-[view-type=card]:text-xs',
    'group-data-[view-type=card]:col-start-1',
    'group-data-[view-type=card]:row-start-3',
  ],
  tags: [
    'flex items-center flex-wrap',
    // 列表模式
    'group-data-[view-type=list]:justify-end group-data-[view-type=list]:gap-2 group-data-[view-type=list]:max-w-50',
    // 卡片模式
    'group-data-[view-type=card]:gap-1',
    'group-data-[view-type=card]:col-span-2',
    'group-data-[view-type=card]:row-start-2',
  ],
  tag: [
    'badge border-none bg-base-content/10',
    // 列表模式
    'group-data-[view-type=list]:badge-sm',
    // 卡片模式
    'group-data-[view-type=card]:badge-xs',
  ],
})

const props = {
  /**
   * 视图类型
   */
  viewType: {
    type: String as PropType<'card' | 'list'>,
    default: 'list',
  },
  /**
   * 数据
   */
  data: {
    type: Object as PropType<WebApi.Entity.FilesItem>,
    required: true,
  },
  /**
   * 是否启用路径选择
   */
  pathSelect: {
    type: Boolean,
    default: false,
  },
  /**
   * 是否选中
   */
  checked: {
    type: Boolean,
    default: false,
  },
  /**
   * 是否拖拽中
   */
  dragging: {
    type: Boolean,
    default: false,
  },
  /**
   * 点击
   */
  onClick: {
    type: Function as PropType<(data: WebApi.Entity.FilesItem) => void>,
    default: () => {},
  },
  /**
   * 更新选中状态
   */
  onChecked: {
    type: Function as PropType<(checked: boolean) => void>,
    default: () => {},
  },
  /**
   * 单选
   */
  onRadio: {
    type: Function as PropType<() => void>,
    default: () => {},
  },
  /**
   * 拖拽开始事件
   */
  onDragStart: {
    type: Function as PropType<(event: DragEvent) => void>,
    default: () => {},
  },
  /**
   * 拖拽结束事件
   */
  onDragEnd: {
    type: Function as PropType<(event: DragEvent) => void>,
    default: () => {},
  },
  /**
   * 放置事件
   */
  onDrop: {
    type: Function as PropType<(event: DragEvent) => void>,
    default: () => {},
  },
  /**
   * 右键菜单
   */
  onContextmenu: {
    type: Function as PropType<(event: MouseEvent) => void>,
    default: () => {},
  },
  /**
   * 预览
   */
  onPreview: {
    type: Function as PropType<(data: WebApi.Entity.FilesItem) => void>,
    default: () => {},
  },
} as const

/**
 * 文件列表项
 */
const FileListItem = defineComponent({
  name: 'FileListItem',
  props,
  setup: (props) => {
    const dialog = useDialog()

    const itemRef = shallowRef<HTMLElement>()

    /** 文件列表上下文 */
    const context = useFileListInject()!

    /** 是否为视频文件 */
    const isVideo = computed(() => props.data.iv === 1)

    /** 是否为文件夹 */
    const isFolder = computed(() => props.data.fc === 0)

    /** 文件名中的 Emoji */
    const emoji = computed(() => extractEmojis(props.data.n ?? '')[0])

    /** 是否为拖拽区域 */
    const isDrogzone = shallowRef(false)

    /** 是否为拖拽中 */
    const isDragging = shallowRef(false)

    /** 演员信息 */
    const asyncActress = useAsyncState(async () => {
      if (!isFolder.value) {
        return null
      }
      await actressFaceDB.init()
      const actress = await actressFaceDB.findActress(
        props.data.n.trim(),
      )
      return actress
    }, null, {
      immediate: true,
    })

    /** 选项 */
    const options = computed(() => ({
      pickCode: props.data.pc,
      sha1: props.data.sha,
      coverNum: 1,
      duration: props.data.play_long,
    }))

    /** 配置 */
    const config = {
      elementRef: itemRef,
    }

    /** 路由链接 */
    const link = computed(() => {
      const data = props.data
      // 视频
      if (Utils115.isVideo(data.iv)) {
        return {
          to: `/video/${data.pc}`,
          target: '_self',
        }
      }

      // 支持打开文档
      if (Utils115.isSupportOpenDoc(data.ico)) {
        return {
          href: Utils115.GetOpenDocUrl({
            pickCode: data.pc,
            ico: data.ico,
            sha1: data.sha,
            shareId: '',
            from: '',
          }).href,
          target: '_blank',
        }
      }
      // 文件夹
      if (Utils115.isFolder(data.fc)) {
        return {
          to: `/drive/all/${data.cid}`,
          target: '_self',
        }
      }

      return undefined
    })

    /** 格式化时间 */
    function formatTime(data: typeof props.data) {
      const time = data.t
      const timeigitize = Number(time)
      if (timeigitize) {
        return formatYMDHM(timeigitize * 1000)
      }
      return formatYMDHM(time)
    }

    /** 打开链接 */
    async function open() {
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

      if (props.data.u) {
        props.onPreview?.(props.data)
        return
      }

      dialog.alert({
        title: '提示',
        content: '暂不支持打开该文件类型',
        confirmText: '知道了',
      })
    }

    /** 点击事件 */
    const handleClick = (e: Event) => {
      // 路径选择模式
      if (props.pathSelect) {
        props.onClick?.(props.data)
        return
      }

      // 非信任点击（自动化点击），直接打开
      if (!e.isTrusted) {
        open()
        return
      }

      props.onClick?.(props.data)
    }

    /** 双击事件 */
    const handleDblClick = () => {
      open()
    }

    /** smart 视频封面 hook - 只有视频文件才使用 */
    const videoCoverResult = isVideo.value ? useSmartVideoCover(options, config) : null

    /** 通用的鼠标按下事件处理 */
    const handleMouseDown = (e: MouseEvent) => {
      e.stopPropagation()
    }

    /** 渲染演员封面 */
    const renderActressCover = () => (
      <img
        class={styles.coverActressFace}
        draggable="true"
        src={asyncActress.state.value?.url}
        onMousedown={handleMouseDown}
      />
    )

    /** 渲染视频封面 */
    const renderVideoCover = () => {
      const cover = videoCoverResult!.videoCover.state[0]
      return (
        <div
          class={styles.coverVideoWrapper}
          draggable="true"
          onMousedown={handleMouseDown}
        >
          <img
            class={styles.coverVideo}
            data-portrait={isPortraitImage(cover.width, cover.height)}
            src={cover.img}
          />
        </div>
      )
    }

    /** 渲染图片封面 */
    const renderImageCover = () => (
      <img
        class={styles.coverImage}
        decoding="async"
        draggable="true"
        loading="lazy"
        src={props.data.u}
        onMousedown={handleMouseDown}
      />
    )

    /** 渲染官方图片Icon */
    const renderOfficialIcon = (iconUrl: string) => (
      <img
        class={styles.coverFileIcon}
        draggable="true"
        src={iconUrl}
        onMousedown={handleMouseDown}
      />
    )

    /** 渲染文件夹封面 */
    const renderFolderCover = (icon: string) => (
      <div
        class={styles.coverFolder}
        draggable="true"
        onMousedown={handleMouseDown}
      >
        <Icon
          class={styles.coverFolderIcon}
          icon={icon}
        />
        {emoji.value && (
          <span class={styles.coverFolderSymbol}>
            {emoji.value}
          </span>
        )}
      </div>
    )

    /** 渲染普通文件Icon */
    const renderFileIcon = (icon: string) => (
      <div
        class={styles.coverFileIcon}
        draggable="true"
        onMousedown={handleMouseDown}
      >
        <Icon
          class={styles.coverFileIcon}
          icon={icon}
        />
      </div>
    )

    /** 文件封面 */
    const FileIcon = () => {
      // 优先显示演员封面
      if (asyncActress.isReady.value && asyncActress.state.value) {
        return renderActressCover()
      }

      // 视频封面
      if (
        isVideo.value
        && videoCoverResult?.videoCover.isReady
        && videoCoverResult.videoCover.state.length > 0
      ) {
        return renderVideoCover()
      }

      // 图片封面
      if (props.data.u) {
        return renderImageCover()
      }

      const icon = Utils115.getFileIcon(props.data)

      // 官方图片Icon
      if (icon.startsWith('https://')) {
        return renderOfficialIcon(icon)
      }

      // 文件夹
      if (isFolder.value) {
        return renderFolderCover(icon)
      }

      // 其他文件Icon
      return renderFileIcon(icon)
    }

    /** 右键菜单 */
    useContextmenu(itemRef, (e) => {
      props.onContextmenu?.(e)
    })

    const handleDragLeave = () => {
      isDrogzone.value = false
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()

      // 只有文件夹才允许作为拖拽目标
      if (!isFolder.value) {
        return
      }

      isDrogzone.value = true
    }

    const handleDrop = (e: DragEvent) => {
      if (!isDrogzone.value) {
        return
      }

      isDrogzone.value = false

      const data = e.dataTransfer?.getData('application/json')
      if (!data) {
        return
      }

      /** 如果拖拽的文件中包含当前文件，则不进行拖拽 */
      const items = JSON.parse(data) as WebApi.Entity.FilesItem[]
      if (items.some(item => item.cid === props.data.cid)) {
        return
      }

      props.onDrop?.(e)
    }

    /** 键盘事件处理 */
    const handleCheckboxKeyDown = (e: KeyboardEvent) => {
      // 如果页面有打开的对话框，则不处理键盘事件
      if (document.querySelector('[role="dialog"], .modal, .alert')) {
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        open()
      }
      // 允许空格键切换选中状态（checkbox的默认行为）
      else if (e.key === ' ') {
        e.preventDefault()
        props.onChecked?.(!props.checked)
      }
    }

    return () => (
      <div
        ref={itemRef}
        class={styles.root}
        data-checked={props.checked}
        data-dragging={props.dragging}
        data-dropzone={isDrogzone.value}
        data-view-type={context.viewType.value}
        onDragleave={handleDragLeave}
        onDragover={handleDragOver}
        onDrop={handleDrop}
      >
        {/* checked */}
        <label class={styles.label}>
          <input
            class={styles.checkbox}
            v-show={!props.pathSelect}
            checked={props.checked}
            tabindex="0"
            type="checkbox"
            onInput={(e) => {
              props.onChecked?.((e.target as HTMLInputElement).checked)
            }}
            onKeydown={handleCheckboxKeyDown}
          />
          {/* 路径选择模式下的隐藏焦点元素 */}
          {props.pathSelect && (
            <input
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none',
                width: '1px',
                height: '1px',
              }}
              tabindex="0"
              type="checkbox"
              onKeydown={handleCheckboxKeyDown}
            />
          )}
        </label>

        {/* wrapper */}
        <Link
          class={styles.wrapper}
          {...link.value}
          draggable={false}
          onClickCapture={withModifiers(handleClick, ['prevent'])}
          onDblclick={handleDblClick}
        >
          {/* cover */}
          <span
            class={[
              styles.coverBox,
            ]}
            onDragend={(e) => {
              isDragging.value = false
              props.onDragEnd?.(e as DragEvent)
            }}
            onDragstart={(e) => {
              e.stopPropagation()
              isDragging.value = true
              props.onDragStart?.(e as DragEvent)
            }}
          >
            {/* cover */}
            <FileIcon />

            {/* top */}
            <Icon
              class={styles.top}
              v-show={props.data.is_top}
              icon={ICON_TOP_SOLID}
            />
          </span>

          {/* content */}
          <div class={styles.content}>
            <span class={styles.name}>
              {/* name */}
              <span
                class={styles.nameText}
                title={props.data.ns ?? props.data.n}
                v-html={props.data.ns ?? props.data.n}
              >
              </span>
              {/* star */}
              {
                props.data.m === 1 || props.data.m === '1'
                  ? (
                      <Icon
                        class={styles.star}
                        v-show={props.data.m === 1 || props.data.m === '1'}
                        icon="material-icon-theme:github-sponsors"
                      />
                    )
                  : null
              }
            </span>

            {/* tags */}
            <span class={styles.tags} v-show={(props.data.fl?.length ?? 0) > 0}>
              {
                props.data.fl?.map(tag => (
                  <span
                    key={tag.id}
                    class={styles.tag}
                    style={{
                      backgroundColor: `color-mix(in oklab, ${tag.color} 70%, transparent)`,
                    }}
                  >
                    { tag.name }
                  </span>
                ))
              }
            </span>

            {/* size */}
            {
              !props.pathSelect && props.data.s
                ? (
                    <span class={styles.size}>
                      { formatFileSize(Number(props.data.s)) }
                    </span>
                  )
                : null
            }

            {/* time */}
            <span
              class={styles.time}
              v-show={!props.pathSelect}
              data-tip="修改时间"
            >
              { formatTime(props.data) }
            </span>
          </div>
        </Link>
      </div>
    )
  },
})

export default FileListItem
