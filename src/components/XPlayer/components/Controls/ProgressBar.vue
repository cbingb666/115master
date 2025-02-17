<template>
	<div class="progress-bar">
		<div 
			ref="progressBarRef"
			class="progress-bar-wrapper"
			@click="handleProgressClick"
			@mousemove="handleMouseMove"
			@mouseenter="isHovering = true"
			@mouseleave="handleMouseLeave"
			@mousedown="handleMouseDown"
		>
			<div class="progress-bar-container">
				<!-- 缓冲进度 -->
				<div 
					class="progress-buffer"
					:style="{ width: `${state.buffered.value}%` }"
				></div>

				<!-- 原始播放进度（拖拽时保持显示） -->
				<div 
					class="progress-current" 
					:style="{ 
						width: `${state.progress.value}%`,
						opacity: isDragging ? 0.5 : 1
					}"
				></div>

				<!-- 拖拽时的实时进度 -->
				<div 
					v-if="isDragging"
					class="progress-current progress-dragging" 
					:style="{ width: `${progress}%` }"
				></div>

				<!-- 预览进度 -->
				<div 
					v-show="isHovering && !isDragging"
					class="progress-hover" 
					:style="{ width: `${hoverProgress}%` }"
				></div>

				<!-- 原始进度拖拽点 -->
				<div 
					v-if="isDragging"
					class="progress-handle-container"
					:style="{ left: `${originalProgress}%` }"
				>
					<div class="progress-handle progress-handle-original"></div>
				</div>

				<!-- 当前进度拖拽点 -->
				<div 
					class="progress-handle-container"
					:style="{ left: `${isDragging ? progress : state.progress.value}%` }"
				>
					<div 
						class="progress-handle"
						:class="{ 'is-dragging': isDragging }"
					></div>
				</div>
			</div>

			<!-- 缩略图和时间提示容器 -->
			<div 
				class="preview-container"
				v-show="isHovering || isDragging"
				:style="{ left: `${isDragging ? progress : hoverProgress}%` }"
			>
				<Thumbnail
					:position="0"
					:visible="true"
					:current-time="previewTime"
					:duration="state.duration.value"
					:thumbnails="thumbnails"
					:type="thumbnailType"
				/>
				<div class="time-tooltip">
					{{ formatTime(previewTime) }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePlayerContext } from "../../hooks/useVideoPlayer";
import Thumbnail from "../Thumbnail/index.vue";

const progressBarRef = ref<HTMLElement | null>(null);
const isHovering = ref(false);
const isDragging = ref(false);
const hoverProgress = ref(0);
const progress = ref(0);
const originalProgress = ref(0);
const previewTime = ref(0);

const { state, actions } = usePlayerContext();
const localProgress = ref(0); // 用于平滑过渡的本地进度

// 添加缩略图相关的 props
interface Props {
	thumbnails?: string[] | ImageBitmap[];
	thumbnailType?: "image" | "canvas";
}

const props = withDefaults(defineProps<Props>(), {
	thumbnailType: "image",
});

const thumbnails = computed(() => props.thumbnails || []);

// 计算当前显示的进度
const currentProgress = computed(() => {
	return isDragging.value ? localProgress.value : state.progress.value;
});

// 监听视频实际进度变化
watch(
	() => state.progress.value,
	(newProgress) => {
		if (!isDragging.value) {
			localProgress.value = newProgress;
		}
	},
);

// 格式化时间
const formatTime = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// 计算进度位置
const calculatePosition = (event: MouseEvent, element: HTMLElement) => {
	const rect = element.getBoundingClientRect();
	return Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
};

// 处理鼠标移动
const handleMouseMove = (event: MouseEvent) => {
	if (!progressBarRef.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	hoverProgress.value = position * 100;
	previewTime.value = position * state.duration.value;

	if (isDragging.value) {
		progress.value = position * 100;
		previewTime.value = position * state.duration.value;
	}
};

// 处理鼠标按下
const handleMouseDown = (event: MouseEvent) => {
	if (!progressBarRef.value) return;
	isDragging.value = true;
	originalProgress.value = state.progress.value;

	const position = calculatePosition(event, progressBarRef.value);
	progress.value = position * 100;
	previewTime.value = position * state.duration.value;

	document.addEventListener("mousemove", handleGlobalMouseMove);
	document.addEventListener("mouseup", handleMouseUp);
	event.preventDefault();
};

// 处理全局鼠标移动
const handleGlobalMouseMove = (event: MouseEvent) => {
	if (!progressBarRef.value || !isDragging.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	progress.value = position * 100;
	previewTime.value = position * state.duration.value;
};

// 处理鼠标松开
const handleMouseUp = () => {
	if (isDragging.value) {
		const finalTime = (progress.value / 100) * state.duration.value;
		actions.seekTo(finalTime);
	}
	isDragging.value = false;
	document.removeEventListener("mousemove", handleGlobalMouseMove);
	document.removeEventListener("mouseup", handleMouseUp);
};

// 处理鼠标离开
const handleMouseLeave = () => {
	if (!isDragging.value) {
		isHovering.value = false;
	}
};

// 进度条点击
const handleProgressClick = (event: MouseEvent) => {
	if (!progressBarRef.value || isDragging.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	const newTime = position * state.duration.value;
	previewTime.value = newTime;
	actions.seekTo(newTime);
};
</script>

<style scoped>
.progress-bar {
	margin-bottom: 10px;
	position: relative;
	font-size: 13px;
}

.progress-bar-wrapper {
	padding: 8px 0;
	cursor: pointer;
	position: relative;
}

.progress-bar-container {
	height: 3px;
	background-color: rgba(255, 255, 255, 0.2);
	position: relative;
	transition: height 0.1s ease;
}

.progress-bar-wrapper:hover .progress-bar-container {
	height: 5px;
}

.progress-buffer {
	position: absolute;
	height: 100%;
	background-color: rgba(255, 255, 255, 0.4);
	transition: width 0.2s ease;
}

.progress-current {
	position: absolute;
	height: 100%;
	background-color: var(--x-player-controller-progress-bar-color);
	transition: width 0.1s linear;
}

.progress-current.progress-dragging {
	background-color: var(--x-player-controller-progress-bar-color);
	transition: none;
}

.progress-hover {
	position: absolute;
	height: 100%;
	background-color: var(--x-player-controller-progress-bar-color-hover);
	pointer-events: none;
}

.progress-handle-container {
	position: absolute;
	height: 100%;
	transform: translateX(-50%);
}

.progress-handle {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 13px;
	height: 13px;
	background-color: var(--x-player-controller-progress-bar-color);
	border-radius: 50%;
	transform: translate(-50%, -50%) scale(0);
	transition: transform 0.1s ease;
	pointer-events: none;
}

.progress-bar-wrapper:hover .progress-handle {
	transform: translate(-50%, -50%) scale(1);
}

.progress-handle.is-dragging {
	transform: translate(-50%, -50%) scale(1);
}

.progress-handle-original {
	background-color: rgba(255, 255, 255, 0.5);
	transform: translate(-50%, -50%) scale(1) !important;
}

.preview-container {
	position: absolute;
	bottom: 100%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	margin-bottom: 8px;
}

.time-tooltip {
	background-color: rgba(28, 28, 28, 0.9);
	color: #fff;
	padding: 2px 4px;
	border-radius: 2px;
	font-size: 12px;
	white-space: nowrap;
}
</style> 