import { type InjectionKey, type Ref, inject, provide, ref, watch } from "vue";
import type { XPlayerProps } from "../index.vue";
import { useControls } from "./useControls";
import { useFullscreen } from "./useFullscreen";
import { useHotKey } from "./useHotKey";
import { usePlaybackRate } from "./usePlaybackRate";
import { usePlaying } from "./usePlaying";
import { useProgress } from "./useProgress";
import { useSource } from "./useSources";
import { useSubtitles } from "./useSubtitles";
import { useVolume } from "./useVolume";

export interface PlayerContext {
	rootProps: XPlayerProps;
	fullscreen: ReturnType<typeof useFullscreen>;
	volume: ReturnType<typeof useVolume>;
	playbackRate: ReturnType<typeof usePlaybackRate>;
	progress: ReturnType<typeof useProgress>;
	playing: ReturnType<typeof usePlaying>;
	controls: ReturnType<typeof useControls>;
	subtitles: ReturnType<typeof useSubtitles>;
	source: ReturnType<typeof useSource>;
	refs: {
		videoElementRef: Ref<HTMLVideoElement | null>;
	};
}

export const PlayerSymbol: InjectionKey<PlayerContext> = Symbol("VideoPlayer");

export function useVideoPlayer(
	videoElementRef: Ref<HTMLVideoElement | null>,
	rootProps: XPlayerProps,
) {
	// 音量
	const volume = useVolume(videoElementRef);
	// 播放速度
	const playbackRate = usePlaybackRate(videoElementRef);
	// 全屏
	const fullscreen = useFullscreen();
	// 进度
	const progress = useProgress(videoElementRef);
	// 播放
	const playing = usePlaying(videoElementRef);
	// 控制
	const controls = useControls();
	// 字幕
	const subtitles = useSubtitles(
		videoElementRef,
		rootProps.subtitles,
		rootProps.loadingSubtitles,
		rootProps.onSubtitleChange,
	);
	// 源
	const source = useSource(videoElementRef, rootProps.sources);
	// 热键
	useHotKey({
		togglePlay: playing.togglePlay,
		skip: progress.skip,
		adjustVolume: volume.adjustVolume,
	});

	const context = {
		rootProps,
		fullscreen,
		volume,
		playbackRate,
		progress,
		playing,
		controls,
		subtitles,
		source,
		refs: {
			videoElementRef,
		},
	};

	provide(PlayerSymbol, context);

	return context;
}

// 使用播放器上下文的 hook
export function usePlayerContext() {
	const context = inject(PlayerSymbol);
	if (!context) {
		throw new Error(
			"usePlayerContext must be used within a VideoPlayer component",
		);
	}
	return context;
}
