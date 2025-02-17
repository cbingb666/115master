<template>
	<div 
		class="x-player"
		ref="playerRef"
		:class="{ 'is-fullscreen': playerContext.state.isFullscreen.value }"
		@dblclick="playerContext.actions.toggleFullscreen"
		@mousemove="handleMouseMove"
		@mouseleave="handleMouseLeave"
	>
		<div class="player-container">
			<div class="video-container">
				<video 
					ref="videoElement"
					@click="playerContext.actions.togglePlay"
				></video>
				<VideoControls 
					:sources="props.sources.value"
					:current-source="currentSource"
					@quality-change="handleQualityChange"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { type Ref, computed, onMounted, onUnmounted, ref, watch } from "vue";
import VideoControls from "./components/Controls/index.vue";
import { useHls } from "./hooks/useHls";
import { useVideoPlayer } from "./hooks/useVideoPlayer";
import type { VideoSource } from "./types";
import "./styles/theme.css";

// 定义 props
interface Props {
	sources: Ref<VideoSource[]>;
	thumbnails?: string[] | ImageBitmap[];
	thumbnailType?: "image" | "canvas";
}

const props = withDefaults(defineProps<Props>(), {
	thumbnailType: "image",
});

const playerRef = ref<HTMLElement | null>(null);
const videoElement = ref<HTMLVideoElement | null>(null);
const currentSource = ref<VideoSource | undefined>();

const playerContext = useVideoPlayer(videoElement);

const isMenuVisible = ref(false);

const handleMouseMove = () => {
	if (isMenuVisible.value) {
		playerContext.actions.showControls();
		return;
	}
	playerContext.actions.showControls();
	playerContext.actions.hideControls();
};

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

	if (targetSource.type === "hls") {
		const { initHls, cleanup } = useHls(
			videoElement.value,
			targetSource.hlsConfig,
		);
		initHls(targetSource.url);
		return cleanup;
	}

	videoElement.value.src = targetSource.url;
	return () => {
		if (videoElement.value) {
			videoElement.value.src = "";
		}
	};
};

const handleQualityChange = (source: VideoSource) => {
	// 记住当前播放时间和播放状态
	const currentTime = videoElement.value?.currentTime || 0;
	const wasPlaying = !videoElement.value?.paused;

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

watch(
	() => props.sources,
	(sources) => {
		currentSource.value = sources.value[0];
		const cleanup = initializeVideo(sources.value[0]);
		return () => cleanup?.();
	},
	{ immediate: true, deep: true },
);

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

video {
	max-width: 100%;
	max-height: 100%;
}
</style>
