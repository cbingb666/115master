import type { EmitFn, InjectionKey, Ref, ShallowRef, ToRefs } from 'vue'
import type { usePlayerCoreDecorator } from './playerCore/usePlayerCore'
import type { Events } from '@/components/XPlayer/events'
import type { XPlayerEmit, XPlayerProps } from '@/components/XPlayer/types'
import type { Logger } from '@/utils/logger'
import { useVModels } from '@vueuse/core'
import {

  inject,
  onScopeDispose,
  provide,
  ref,
} from 'vue'
import { useShortcuts } from '@/components/XPlayer/components/Shortcuts/shortcuts.hooks'
import { EventMitt } from '@/components/XPlayer/events'
import { xPlayerLogger } from '@/components/XPlayer/utils/logger'
import {

  useSwitchPlayerCore,
} from './playerCore/usePlayerCore'
import { useContextMenu } from './useContextMenu'
import { useControls } from './useControls'
import { useCssVar } from './useCssVar'
import { useFullscreen } from './useFullscreen'
import { useHud } from './useHud'
import { usePictureInPicture } from './usePictureInPicture'
import { usePlaybackRate } from './usePlaybackRate'
import { usePlaySettings } from './usePlaySettings'
import { usePopupManager } from './usePopupManager'
import { useProgressBar } from './useProgressBar'
import { useSources } from './useSources'
import { useStatistics } from './useStatistics'
import { useSubtitles } from './useSubtitles'
import { useThumbnailSettings } from './useThumbnailSettings'
import { useTransform } from './useTransform'
import { useVideoEnhance } from './useVideoEnhance'

/**
 * 播放器引用
 */
export interface PlayerRefs {
  /** 播放器元素引用 */
  playerElementRef: ShallowRef<HTMLDivElement | null>
  /** 根引用 */
  rootRef: ShallowRef<HTMLElement | null>
}

/**
 * 播放器上下文
 */
export interface PlayerContext {
  /** 根引用 */
  refs: PlayerRefs
  /** 根事件 */
  rootEmit: EmitFn<XPlayerEmit>
  /** 根属性 */
  rootProps: XPlayerProps
  /** 根属性 */
  rootPropsVm: ToRefs<XPlayerProps>
  /** 驱动 */
  driver: ReturnType<typeof useSwitchPlayerCore>
  /** 全屏 */
  fullscreen: ReturnType<typeof useFullscreen>
  /** 画中画 */
  pictureInPicture: ReturnType<typeof usePictureInPicture>
  /** 倍速 */
  playbackRate: ReturnType<typeof usePlaybackRate>
  /** 进度条 */
  progressBar: ReturnType<typeof useProgressBar>
  /** 控制栏 */
  controls: ReturnType<typeof useControls>
  /** 字幕 */
  subtitles: ReturnType<typeof useSubtitles>
  /** 视频源 */
  source: ReturnType<typeof useSources>
  /** 热键 */
  shortcuts: ReturnType<typeof useShortcuts>
  /** 画面转换 */
  transform: ReturnType<typeof useTransform>
  /** 预览图设置 */
  thumbnailSettings: ReturnType<typeof useThumbnailSettings>
  /** HUD显示 */
  hud: ReturnType<typeof useHud>
  /** 变量 */
  cssVar: ReturnType<typeof useCssVar>
  /** 视频增强 */
  videoEnhance: ReturnType<typeof useVideoEnhance>
  /** 调试面板 */
  statistics: ReturnType<typeof useStatistics>
  /** Popup管理器 */
  popupManager: ReturnType<typeof usePopupManager>
  /** 右键菜单 */
  contextMenu: ReturnType<typeof useContextMenu>
  /** 播放器核心 */
  playerCore: Ref<ReturnType<typeof usePlayerCoreDecorator> | undefined>
  /** 播放设置 */
  playSettings: ReturnType<typeof usePlaySettings>
  /** 事件 */
  eventMitt: EventMitt<Events>
  /** 日志 */
  logger: InstanceType<typeof Logger>
}

/**
 * 播放器上下文符号
 */
export const PlayerSymbol: InjectionKey<PlayerContext> = Symbol('XPlayer')

/**
 * 播放器 Provide
 */
export function usePlayerProvide(
  // 根引用
  refs: PlayerRefs,
  // 根属性
  rootProps: XPlayerProps,
  // 根事件
  rootEmit: EmitFn<XPlayerEmit>,
) {
  const context: PlayerContext = {
    refs: {
      rootRef: refs.rootRef,
      playerElementRef: refs.playerElementRef,
    },
    rootEmit,
    rootProps,
    rootPropsVm: useVModels(rootProps, rootEmit),
    playerCore: ref(),
    eventMitt: new EventMitt<Events>(),
  } as PlayerContext

  /**
   * 日志
   */
  context.logger = xPlayerLogger

  /**
   * 播放器驱动核心
   */
  context.driver = useSwitchPlayerCore(context)

  /** Popup管理器 */
  const popupManager = usePopupManager(context)
  context.popupManager = popupManager

  /** 倍速 */
  const playbackRate = usePlaybackRate(context)
  context.playbackRate = playbackRate

  /** 全屏 */
  const fullscreen = useFullscreen(context)
  context.fullscreen = fullscreen

  /** 进度条 */
  const progressBar = useProgressBar(context)
  context.progressBar = progressBar

  /** 控制栏 */
  const controls = useControls(context)
  context.controls = controls

  /** 字幕 */
  const subtitles = useSubtitles(context)
  context.subtitles = subtitles

  /** 源 */
  const source = useSources(context)
  context.source = source

  /** 热键设置 */
  const shortcuts = useShortcuts(context)
  context.shortcuts = shortcuts

  /** 画中画 */
  const pictureInPicture = usePictureInPicture(context)
  context.pictureInPicture = pictureInPicture

  /** 画面转换 */
  const transform = useTransform(context)
  context.transform = transform

  /** 预览图设置 */
  const thumbnailSettings = useThumbnailSettings(context)
  context.thumbnailSettings = thumbnailSettings

  /** HUD显示 */
  const hud = useHud(context)
  context.hud = hud

  /** 变量 */
  const cssVar = useCssVar(context)
  context.cssVar = cssVar

  /** 视频增强 */
  const videoEnhance = useVideoEnhance(context)
  context.videoEnhance = videoEnhance

  /** 调试面板 */
  const debugPanel = useStatistics()
  context.statistics = debugPanel

  /** 右键菜单 */
  const contextMenu = useContextMenu(context)
  context.contextMenu = contextMenu

  /** 播放设置 */
  const playSettings = usePlaySettings(context)
  context.playSettings = playSettings

  // 组件卸载时销毁播放器核心，释放 worker / 解码线程 / WebGL / 音频等资源
  onScopeDispose(() => {
    context.playerCore.value?.destroy().catch((e) => {
      context.logger.error('销毁播放器失败:', e)
    })
  })

  provide(PlayerSymbol, context)
  return context
}

/**
 * 使用播放器上下文
 */
export function usePlayerContext() {
  const context = inject(PlayerSymbol)
  if (!context) {
    throw new Error(
      'usePlayerContext must be used within a VideoPlayer component',
    )
  }
  return context
}
