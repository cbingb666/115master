<template>
	<div 
		class="controls-wrapper"
		:class="{ 'hide': !state.isControlsVisible.value && !isMenuVisible }"
	>
		<div class="controls-gradient"></div>
		<div class="video-controls">
			<div class="progress-container">
				<ProgressBar />
			</div>
			<div class="controls-buttons">
				<div class="left">
					<PlayButton />
					<VolumeControl />
					<TimeDisplay />
				</div>
				<div class="right">
					<QualityButton
						:sources="sources"
						:current-source="currentSource"
						@change="handleQualityChange"
						@menu-visible-change="handleMenuVisibleChange"
					/>
					<FullscreenButton />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { usePlayerContext } from "../../hooks/useVideoPlayer";
import type { VideoSource } from "../../types";
import FullscreenButton from "./FullscreenButton.vue";
import PlayButton from "./PlayButton.vue";
import ProgressBar from "./ProgressBar.vue";
import QualityButton from "./QualityButton.vue";
import TimeDisplay from "./TimeDisplay.vue";
import VolumeControl from "./VolumeControl.vue";

const { state } = usePlayerContext();

interface Props {
	sources: VideoSource[];
	currentSource?: VideoSource;
}

const props = defineProps<Props>();
const emit = defineEmits<(e: "quality-change", source: VideoSource) => void>();

const isMenuVisible = ref(false);

const handleQualityChange = (source: VideoSource) => {
	emit("quality-change", source);
};

const handleMenuVisibleChange = (visible: boolean) => {
	isMenuVisible.value = visible;
};
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
	position: relative;
	z-index: 2;
	height: 100px;
	pointer-events: auto;
}

.controls-buttons {
	position: absolute;
	bottom: 0;
	left: 20px;
	right: 20px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 16px;
	transform-origin: bottom;
}

.left,
.right {
	display: flex;
	align-items: center;
	gap: 15px;
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