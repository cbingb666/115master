import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import { format } from '@115master/utils'
import { computed, defineComponent, shallowRef, withModifiers } from 'vue'
import { ErrorStatusFeedback } from '@/components/ErrorStatusFeedback'
import { formatTime } from '@/components/XPlayer/utils/time'
import { useSmartVideoCover } from '@/hooks/useVideoCover'
import { I, Icon } from '@/icons'

/** 播放列表视频封面数量 */
const PLAYLIST_VIDEO_COVER_NUM = 1

const PlaylistItem = defineComponent({
  name: 'PlaylistItem',

  props: {
    item: {
      type: Object as PropType<Share.Entity.FilesItem>,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
  },

  emits: {
    play: (_item: Share.Entity.FilesItem) => true,
  },

  setup(props, { emit }) {
    /** 根元素引用 */
    const root = shallowRef<HTMLElement>()

    /** 选项 */
    const options = computed(() => ({
      pickCode: props.item.pc,
      sha1: props.item.sha,
      coverNum: PLAYLIST_VIDEO_COVER_NUM,
      duration: props.item.play_long,
    }))

    /** smart 视频封面 hook */
    const { retry, videoCover } = useSmartVideoCover(options, {
      elementRef: root,
    })

    /** 进度百分比 */
    const progress = computed(() => {
      return props.item.current_time / props.item.play_long
    })

    return () => (
      <a
        ref={root}
        href={`https://115.com/web/lixian/master/video/?pick_code=${props.item.pc}`}
        target="_blank"
        rel="noreferrer"
        class="flex cursor-pointer break-words"
        aria-current={props.active ? 'true' : undefined}
        onClick={withModifiers(() => emit('play', props.item), ['prevent'])}
      >
        <div class="group/cover relative flex aspect-video w-40 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl before:absolute before:inset-0 before:rounded-xl before:bg-black before:content-[''] sm:w-50">
          {videoCover.error
            ? (
                <div
                  class="contents"
                  onClick={withModifiers(() => {}, ['stop'])}
                >
                  <ErrorStatusFeedback
                    class="relative!"
                    error={videoCover.error}
                    title="视频封面加载失败"
                    size="xs"
                    padded={false}
                    detailLabel="查看视频封面加载错误"
                    retryLabel="重试加载"
                    closeLabel="关闭"
                    onRetry={retry}
                  />
                </div>
              )
            : videoCover.isLoading
              ? <div class="skeleton relative h-full w-full rounded-xl" />
              : videoCover.isReady
                ? (
                    <img
                      src={videoCover.state[0]?.img}
                      class="relative block h-full w-full object-contain"
                    />
                  )
                : <div class="skeleton relative h-full w-full rounded-xl" />}

          <div class="ui-glass-overlay app-font-time absolute right-2 bottom-2 rounded-md px-1.5 py-0.5 text-xs font-medium tracking-tight">
            {formatTime(props.item.play_long)}
          </div>

          {!!props.item.m && (
            <div class="absolute top-1.5 left-1.5 p-0.5">
              <Icon name={I.STAR_FILL} class="text-primary size-6 drop-shadow-xs/50" />
            </div>
          )}

          {props.item.current_time > 0 && (
            <div class="bg-base-100/40 absolute right-0 bottom-0 h-[4px] w-full">
              <div
                class="bg-base-content app-shadow absolute top-0 left-0 h-full w-0"
                style={{ width: `${progress.value * 100}%` }}
              />
            </div>
          )}
        </div>
        <div class="flex flex-col justify-between gap-1 px-4">
          <div
            class={[
              'text-base-content/90 line-clamp-3 text-sm leading-5 font-medium break-all',
              props.active && 'text-primary',
            ]}
            title={props.item.n}
          >
            {props.item.n}
          </div>
          <div class="text-base-content/30 app-font-file-size text-xs font-medium tracking-tight">
            {format.fileSize(Number(props.item.s))}
          </div>
        </div>
      </a>
    )
  },
})

export default PlaylistItem
