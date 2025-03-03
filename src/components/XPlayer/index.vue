<template>
	<div
		class="x-player"
		:class="{ 'is-fullscreen': fullscreen.isFullscreen.value }"
		@mousemove="handleRootMouseMove"
		@mouseleave="handleRootMouseLeave"
	>
		<!-- 播放器容器 -->
		<div class="player-container">
			<!-- 视频容器 -->
			<div
				class="video-container"
			>
				<!-- 视频元素 -->
				<video
					ref="videoElement"
					:key="source.videoKey.value"
					:poster="source.current.value?.poster"
					:muted="volume.isMuted.value"
					:volume="volume.volume.value / 100"
					:autoplay="playing.autoplay.value"
					:loop="playing.loop.value"
					:controls="false"
					:playsinline="true"
					:webkit-playsinline="true"
					@click="playing.togglePlay"
				>
					<track
						v-for="(subtitle, index) in subtitles.list.value"
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

				<!-- 加载动画 -->
				<Loading :show="playing.isLoading.value" />

				<!-- 视频遮罩 -->
				<div
					class="video-mask"
					@click="playing.togglePlay"
					@dblclick="fullscreen.toggleFullscreen"
				></div>
				<!-- 视频控制栏 -->
				<VideoControls />
			</div>
		</div>
		<!-- 弹出层容器 -->
		<div
			class="portal-container"
			:ref="portalContext.container"
		></div>
	</div>
</template>

<script setup lang="ts">
import { type Ref, ref, watch } from "vue";
import VideoControls from "./components/Controls/index.vue";
import { useVideoPlayer } from "./hooks/usePlayer";
import { usePortalProvider } from "./hooks/usePortal";
import type { Subtitle, VideoSource } from "./types";
import "./styles/theme.css";
import Loading from "./components/Loading/index.vue";
import PlayAnimation from "./components/PlayAnimation/index.vue";

export interface XPlayerProps {
	sources: Ref<VideoSource[]>;
	onThumbnailRequest?: ({
		type,
		time,
		isLast,
	}: {
		type: "Cache" | "Must";
		time: number;
		isLast: boolean;
	}) => Promise<ImageBitmap | null>;
	subtitles: Ref<Subtitle[] | null>;
	loadingSubtitles: Ref<boolean>;
	onSubtitleChange?: (subtitle: Subtitle | null) => void;
	defaultSubtitle?: Subtitle | null;
}

const props = withDefaults(defineProps<XPlayerProps>(), {
	onThumbnailRequest: undefined,
	onSubtitleChange: undefined,
	defaultSubtitle: null,
});

// 视频元素
const videoElement = ref<HTMLVideoElement | null>(null);
// 弹出层上下文
const portalContext = usePortalProvider();
// 视频播放器上下文
const { fullscreen, volume, playing, source, controls, subtitles } =
	useVideoPlayer(videoElement, props);

const handleRootMouseMove = () => {
	controls.showWithAutoHide();
};
const handleRootMouseLeave = () => {
	controls.clearHideControlsTimer();
	controls.hide();
};
</script>

<style scoped>
.x-player {
	width: 100%;
	height: 100%;
	position: relative;
	background-color: var(--x-player-background-color);
}
.x-player * {
	user-select: none;
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
