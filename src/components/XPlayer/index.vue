<template>
	<div 
		class="x-player"
		ref="playerRef"
		:class="{ 'is-fullscreen': playerContext.state.isFullscreen.value }"
		@mousemove="handleMouseMove"
		@mouseleave="handleMouseLeave"
	>
		<!-- 播放器容器 -->
		<div class="player-container">
			<!-- 视频容器 -->
			<div 
				class="video-container"
				ref="videoContainerRef"
			>
				<!-- 视频元素 -->
				<video 
					:key="videoKey"
					ref="videoElement"
					:poster="currentSource?.poster"
					:muted="playerContext.state.isMuted.value"
					:volume="playerContext.state.volume.value / 100"
					:autoplay="playerContext.state.autoplay.value"
					:loop="playerContext.state.loop.value"
					:controls="false"
					:playsinline="true"
					:webkit-playsinline="true"
					@click="playerContext.actions.togglePlay"
				>
					<track
						v-for="(subtitle, index) in subtitles"
						:key="index"
						:src="subtitle.url"
						:label="subtitle.label"
						:srclang="subtitle.srclang"
						:kind="subtitle.kind"
						:default="subtitle.default"
					/>
				</video>

				<!-- 播放/暂停动画 -->
				<PlayAnimation />

				<!-- 视频遮罩 -->
				<div 
					class="video-mask"
					@click="playerContext.actions.togglePlay"
					@dblclick="playerContext.actions.toggleFullscreen"
				></div>
				<!-- 视频控制栏 -->
				<VideoControls 
					:sources="props.sources.value"
					:current-source="currentSource"
					:onThumbnailRequest="handleThumbnailRequest"
					:subtitles="subtitles"
					:current-subtitle="currentSubtitle"
					@quality-change="handleQualityChange"
					@subtitle-change="handleSubtitleChange"
				/>
			</div>
		</div>
		<!-- 弹出层容器 -->
		<div 
			class="portal-container"
			ref="portalContainerRef"
		></div>
	</div>
</template>

<script setup lang="ts">
import { type Ref, nextTick, onUnmounted, ref, watch } from "vue";
import VideoControls from "./components/Controls/index.vue";
import { useHls } from "./hooks/useHls";
import { usePortalProvider } from "./hooks/usePortal";
import { useVideoPlayer } from "./hooks/useVideoPlayerContext";
import type { VideoSource } from "./types";
import "./styles/theme.css";
import PlayAnimation from "./components/PlayAnimation/index.vue";

// 定义 props
interface Subtitle {
	// 字幕 url
	url: string;
	// 字幕名称
	label: string;
	// 字幕语言
	srclang: string;
	// 字幕类型
	kind: "subtitles" | "captions";
	// 字幕默认
	default?: boolean;
}

interface Props {
	sources: Ref<VideoSource[]>;
	onThumbnailRequest?: (time: number) => Promise<ImageBitmap>;
	subtitles?: Subtitle[];
}

const props = defineProps<Props>();
const currentSubtitle = ref<Subtitle | null>(null);
const videoKey = ref(0);

// 定义 emits
const emit = defineEmits<(e: "thumbnail-request", time: number) => void>();

// 视频播放器
const playerRef = ref<HTMLElement | null>(null);
// 视频元素
const videoElement = ref<HTMLVideoElement | null>(null);
// 视频容器
const videoContainerRef = ref<HTMLElement | null>(null);
// 当前视频源
const currentSource = ref<VideoSource | undefined>();
// 视频播放器上下文
const playerContext = useVideoPlayer(videoElement);
// 菜单是否可见
const isMenuVisible = ref(false);
// 弹出层容器
const portalContainerRef = ref<HTMLElement | null>(null);
const portalContext = usePortalProvider();

// 鼠标移动视频容器
const handleMouseMove = () => {
	if (isMenuVisible.value) {
		playerContext.actions.showControls();
		return;
	}
	playerContext.actions.showControls();
	playerContext.actions.hideControls();
};

// 鼠标离开视频容器
const handleMouseLeave = () => {
	if (isMenuVisible.value) return;
	playerContext.actions.hideControls();
};

// 初始化视频
const initializeVideo = (source?: VideoSource) => {
	const targetSource = source || currentSource.value;
	if (!videoElement.value || !targetSource) return;

	// 清理之前的视频源
	if (videoElement.value.src) {
		videoElement.value.src = "";
	}

	// 如果视频源是 hls
	if (targetSource.type === "hls") {
		const { initHls, cleanup } = useHls(
			videoElement.value,
			targetSource.hlsConfig,
		);
		initHls(targetSource.url);
		return cleanup;
	}

	// 设置视频源
	videoElement.value.src = targetSource.url;

	// 返回清理函数
	return () => {
		if (videoElement.value) {
			videoElement.value.src = "";
		}
	};
};

const handleQualityChange = async (source: VideoSource) => {
	// 记住当前播放时间和播放状态
	const currentTime = videoElement.value?.currentTime || 0;
	const wasPlaying = !videoElement.value?.paused;

	videoKey.value++;

	await nextTick();

	// 更新当前源
	currentSource.value = source;

	// 切换视频源
	const cleanup = initializeVideo(source);

	// 恢复播放时间和状态
	if (videoElement.value) {
		videoElement.value.currentTime = currentTime;
		if (wasPlaying) {
			videoElement.value.play();
		}
	}
	return () => cleanup?.();
};

// 监听 sources 变化
watch(
	() => props.sources,
	(sources) => {
		currentSource.value = sources.value[0];
		const cleanup = initializeVideo(sources.value[0]);
		return () => cleanup?.();
	},
	{ immediate: true, deep: true },
);

// 监听 subtitles 变化
watch(
	() => props.subtitles,
	(subtitles) => {
		currentSubtitle.value = subtitles?.find((s) => s.default) || null;
	},
);

// 将 ref 赋值给 playerContext
watch(
	[playerRef, videoContainerRef],
	([player, container]) => {
		if (playerContext.refs) {
			playerContext.refs.playerRef.value = player;
			playerContext.refs.videoContainerRef.value = container;
		}
	},
	{ immediate: true },
);

// 监听 portal container ref
watch(
	portalContainerRef,
	(container) => {
		portalContext.container.value = container;
	},
	{ immediate: true },
);

// 处理缩略图请求
const handleThumbnailRequest = async (time: number) => {
	if (props.onThumbnailRequest) {
		return await props.onThumbnailRequest(time);
	}
	return null;
};

// 处理字幕变化
const handleSubtitleChange = (subtitle: Subtitle | null) => {
	currentSubtitle.value = subtitle;
	const tracks = videoElement.value?.textTracks;
	if (tracks) {
		for (let i = 0; i < tracks.length; i++) {
			tracks[i].mode = "disabled";
		}
		if (subtitle) {
			const index =
				props.subtitles?.findIndex((s) => s.url === subtitle.url) ?? -1;
			if (index >= 0 && tracks[index]) {
				tracks[index].mode = "showing";
			}
		}
	}
};

// 卸载时清理
onUnmounted(() => {
	if (videoElement.value) {
		videoElement.value.pause();
	}
});
</script>

<style scoped>
.x-player {
	width: 100%;
	height: 100%;
	position: relative;
	background-color: var(--x-player-background-color);
}

.x-player.is-fullscreen {
	width: 100vw;
	height: 100vh;
}

.player-container {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

.video-container {
	position: relative;
	z-index: 1;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}

.video-mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 2;
}

video {
	width: 100%;
	height: 100%;
	backdrop-filter: saturate(1);
}

/* 确保控制栏在遮罩层上方 */
:deep(.controls-wrapper) {
	z-index: 3;
}

.portal-container {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: 9999;
}

.portal-container > * {
	pointer-events: auto;
}
</style>
