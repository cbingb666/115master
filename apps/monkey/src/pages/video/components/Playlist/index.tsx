import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import type { useDataPlaylist } from '@/pages/video/data/useDataPlaylist'
import { Button, scrollbar, StatusFeedback } from '@115master/ui'
import { defineComponent, nextTick, shallowRef, watch } from 'vue'
import { I, Icon } from '@/icons'
import { errorFeedback } from '@/utils/errorFeedback'
import PlaylistItem from './item'
import './index.css'

const Playlist = defineComponent({
  name: 'Playlist',

  props: {
    playlist: {
      type: Object as PropType<ReturnType<typeof useDataPlaylist>>,
      required: true,
    },
    pickCode: {
      type: String,
      default: undefined,
    },
  },

  emits: {
    play: (_item: Share.Entity.FilesItem) => true,
    close: () => true,
  },

  setup(props, { emit }) {
    const content = shallowRef<HTMLElement>()

    /** 点击播放 */
    function play(item: Share.Entity.FilesItem) {
      if (item.pc === props.pickCode)
        return

      emit('play', item)
    }

    /** 滚动到激活的项目 */
    async function scroll(withAnimation = true) {
      await nextTick()

      content.value
        ?.querySelector<HTMLElement>('[aria-current="true"]')
        ?.scrollIntoView({
          behavior: withAnimation ? 'smooth' : 'instant',
          block: 'center',
        })
    }

    /** 监听播放列表的变化，滚动到激活的项目 */
    watch(
      () => props.playlist.state,
      () => scroll(false),
    )

    watch(
      () => props.pickCode,
      () => scroll(true),
    )

    function body() {
      if (props.playlist.error) {
        return (
          <div class="flex h-[calc(100%-var(--app-playlist-header-height))] h-full flex-col gap-5 overflow-y-auto px-(--app-playlist-space) pt-[var(--app-playlist-header-height)] [--ui-scrollbar-track-inset-start:var(--app-playlist-header-height)]">
            <StatusFeedback
              status="error"
              {...errorFeedback(props.playlist.error)}
            />
          </div>
        )
      }

      if (props.playlist.isLoading || !props.playlist.isReady) {
        return (
          <div class="flex h-[calc(100%-var(--app-playlist-header-height))] h-full flex-col gap-5 overflow-y-auto px-(--app-playlist-space) pt-[var(--app-playlist-header-height)] [--ui-scrollbar-track-inset-start:var(--app-playlist-header-height)]">
            <div class="skeleton h-24 w-full rounded-lg" />
          </div>
        )
      }

      return (
        <div
          ref={content}
          class={[
            scrollbar(),
            'flex h-[calc(100%-var(--app-playlist-header-height))] h-full flex-col gap-5 overflow-y-auto px-(--app-playlist-space) pt-[var(--app-playlist-header-height)] [--ui-scrollbar-track-inset-start:var(--app-playlist-header-height)]',
          ]}
        >
          {props.playlist.state?.data.map(item => (
            <PlaylistItem
              key={item.pc}
              item={item}
              active={item.pc === props.pickCode}
              onPlay={play}
            />
          ))}
          <div class="divider text-base-content/30 mx-auto w-1/3" />
        </div>
      )
    }

    return () => {
      const count = props.playlist.state?.data.length ?? 0

      return (
        <div class="text-base-content relative box-border flex h-full flex-col [--app-playlist-header-height:calc(var(--spacing)*16+var(--app-playlist-handle-space,0rem))] [--app-playlist-space:calc(var(--spacing)*4)]">
          <div
            data-app-playlist-header
            class="app-playlist__header ui-z-raised text-base-content absolute inset-x-0 top-0 flex h-(--app-playlist-header-height) flex-shrink-0 items-center justify-between px-(--app-playlist-space) pt-[calc(var(--spacing)*4+var(--app-playlist-handle-space,0rem))] pb-4"
          >
            <div class="flex items-center gap-2.5 text-xl font-medium tracking-tight">
              <Icon name={I.PLAYLIST} class="size-10" />
              播放列表
              {count > 0 && (
                <span class="text-base-content/70 text-sm tracking-wide">
                  (
                  {count}
                  )
                </span>
              )}
            </div>
            <Button
              variant="glass-floating"
              shape="circle"
              aria-label="关闭播放列表"
              title="关闭播放列表"
              onClick={() => emit('close')}
            >
              <Icon name={I.CLOSE} class="size-6" />
            </Button>
          </div>

          {body()}
        </div>
      )
    }
  },
})

export default Playlist
