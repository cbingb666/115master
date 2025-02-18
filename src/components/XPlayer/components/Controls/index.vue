<template>
	<div 
		class="controls-wrapper"
		:class="{ 'hide': !state.isControlsVisible.value && !isMenuVisible }"
	>
		<!-- 控制栏渐变 -->
		<div class="controls-gradient"></div>
		<!-- 视频控制栏 -->
		<div class="video-controls" :class="{ 'is-visible': isVisible }">
			<div class="controls-content">
				<ProgressBar 
					:onThumbnailRequest="onThumbnailRequest"
				/>
				<div class="controls-bar">
					<div class="left-controls">
						<PlayButton />
						<VolumeControl />
						<TimeDisplay />
					</div>
					<div class="right-controls">
						<SpeedButton />
						<SubtitleButton
							:subtitles="subtitles"
							:currentSubtitle="currentSubtitle"
							@change="handleSubtitleChange"
							@menu-visible-change="handleMenuVisibleChange"
						/>
						<QualityButton 
							:sources="sources"
							:currentSource="currentSource"
							@change="handleQualityChange"
							@menu-visible-change="handleMenuVisibleChange"
						/>
						<FullscreenButton />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { usePlayerContext } from "../../hooks/useVideoPlayerContext";
import type { Subtitle, VideoSource } from "../../types";
import FullscreenButton from "./FullscreenButton.vue";
import PlayButton from "./PlayButton.vue";
import ProgressBar from "./ProgressBar.vue";
import QualityButton from "./QualityButton.vue";
import SpeedButton from "./SpeedButton.vue";
import SubtitleButton from "./SubtitleButton.vue";
import TimeDisplay from "./TimeDisplay.vue";
import VolumeControl from "./VolumeControl.vue";

// 视频播放器上下文
const { state } = usePlayerContext();

// 定义 props
interface Props {
	sources: VideoSource[];
	currentSource?: VideoSource;
	onThumbnailRequest?: (time: number) => Promise<ImageBitmap>;
	subtitles?: Subtitle[];
	currentSubtitle: Subtitle | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	(e: "quality-change", source: VideoSource): void;
	(e: "subtitle-change", subtitle: Subtitle | null): void;
}>();

const isMenuVisible = ref(false);
const isVisible = ref(true);
let hideTimeout: number | null = null;

// 画质变化
const handleQualityChange = (source: VideoSource) => {
	emit("quality-change", source);
};

// 菜单可见性变化
const handleMenuVisibleChange = (visible: boolean) => {
	isMenuVisible.value = visible;
};

const handleSubtitleChange = (subtitle: Subtitle | null) => {
	emit("subtitle-change", subtitle);
};

const showControls = () => {
	isVisible.value = true;
	if (hideTimeout) {
		clearTimeout(hideTimeout);
	}
	hideTimeout = window.setTimeout(() => {
		if (!state.isPlaying.value) {
			isVisible.value = false;
		}
	}, 3000);
};

onMounted(() => {
	document.addEventListener("mousemove", showControls);
});

onUnmounted(() => {
	document.removeEventListener("mousemove", showControls);
	if (hideTimeout) {
		clearTimeout(hideTimeout);
	}
});
</script>

<style scoped>
.controls-wrapper {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	pointer-events: auto;
	transition: opacity 0.3s ease;
}

.controls-wrapper.hide {
	opacity: 0;
}

.controls-gradient {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 180px;
	background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAC4CAYAAAAi0IY0AAAAAXNSR0IArs4c6QAAAQxJREFUOE9lyNdHBQAAhfHb3nvvuu2997jNe29TJJEkkkgSSSSJJJJEEkkiifRH5jsP56Xz8PM5gcC/xfCIWBNHxZsESiSaJEokQ4pJpUSaSadEhsmkskw2JXJMLiXyIN8UUKLQFFGi2JRQpaaMEuWmghKVUGWqKVFjgpSoNXVUvWmgRKNpokQztJhWSrSZdkp0mE6qy3RTosf0UqIP+s0AJQbNECWGzQg1asYoMW4mKBGCSTNFiWkzQ4lZM0eFTYQSUTNPiQVYNEuUWIYVWIU1WIcN2IQt2IYd2IU92IcDOIQjOIYTOIUzOIcLuIQruIYbuIU7uIcHeIQneIYXeIU3eIcP+IQv+IYf+P0Dkn4pkUpVXukAAAAASUVORK5CYII=');
	background-repeat: repeat-x;
	background-position: bottom;
	z-index: 1;
}

.video-controls {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
	color: #fff;
	opacity: 0;
	transition: opacity 0.3s ease;
	z-index: 2;
}

.video-controls.is-visible {
	opacity: 1;
}

.controls-content {
	padding: 10px 20px;
}

.controls-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.left-controls,
.right-controls {
	display: flex;
	align-items: center;
	gap: 10px;
}

button {
	background: none;
	border: none;
	color: white;
	cursor: pointer;
	padding: 5px;
}

button:hover {
	opacity: 0.8;
}

.material-symbols-rounded {
	font-size: 24px;
	color: white;
	font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24;
}

.progress-container {
	position: absolute;
	top: 0;
	left: 20px;
	right: 20px;
	z-index: 3;
}

.progress-container.hide {
	transform: translateY(84px);
}

.controls-buttons {
	margin-top: 40px;
	padding-bottom: 12px;
	transform-origin: bottom;
}

.controls-buttons.hide {
	transform: translateY(84px) scaleX(0);
}

.controls-gradient.hide {
	opacity: 0;
}
</style> 