<template>
	<div class="progress-bar">
		<!-- 进度条外容器 -->
		<div 
			ref="progressBarRef"
			class="progress-bar-wrapper"
			@click="handleProgressClick"
			@mousemove="handleMouseMove"
			@mouseenter="handleMouseEnter"
			@mouseleave="handleMouseLeave"
			@mousedown="handleMouseDown"
		>
			<!-- 进度条内容器 -->
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
						opacity: state.isDragging.value ? 0.5 : 1
					}"
				></div>

				<!-- 拖拽时的实时进度 -->
				<div 
					v-if="state.isDragging.value"
					class="progress-current progress-dragging"
					:style="{ width: `${state.dragProgress.value}%` }"
				></div>

				<!-- 预览进度 -->
				<div 
					v-show="state.isPreviewVisible.value && !state.isDragging.value"
					class="progress-hover" 
					:style="{ width: `${state.previewProgress.value}%` }"
				></div>

				<!-- 原始进度拖拽点 -->
				<div 
					v-if="state.isDragging.value"
					class="progress-handle-container"
					:style="{ left: `${state.originalProgress.value}%` }"
				>
					<div class="progress-handle progress-handle-original"></div>
				</div>

				<!-- 当前进度拖拽点 -->
				<div 
					class="progress-handle-container"
					:style="{ 
						left: `${state.isDragging.value ? state.dragProgress.value : state.progress.value}%` 
					}"
				>
					<div 
						class="progress-handle"
						:class="{ 'is-dragging': state.isDragging.value }"
					></div>
				</div>
			</div>

			<!-- 缩略图预览 -->
			<Thumbnail
				:visible="state.isPreviewVisible.value || state.isDragging.value"
				:position="state.isDragging.value ? state.dragProgress.value : state.previewProgress.value"
				:time="state.previewTime.value"
				:progress-bar-width="progressBarWidth"
				:on-thumbnail-request="onThumbnailRequest"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { usePlayerContext } from "../../hooks/useVideoPlayerContext";
import Thumbnail from "../Thumbnail/index.vue";

interface Props {
	onThumbnailRequest?: (time: number) => Promise<ImageBitmap | null>;
}

const { onThumbnailRequest } = defineProps<Props>();
const { state, actions } = usePlayerContext();

const progressBarRef = ref<HTMLElement | null>(null);
const progressBarWidth = computed(() => progressBarRef.value?.offsetWidth || 0);

// 计算鼠标位置对应的进度
const calculatePosition = (event: MouseEvent, element: HTMLElement) => {
	const rect = element.getBoundingClientRect();
	const position = (event.clientX - rect.left) / rect.width;
	return Math.min(Math.max(position, 0), 1);
};

// 处理鼠标移动
const handleMouseMove = (event: MouseEvent) => {
	if (!progressBarRef.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	actions.updatePreview(position);
};

// 处理鼠标进入
const handleMouseEnter = () => {
	actions.showPreview();
};

// 处理鼠标离开
const handleMouseLeave = () => {
	actions.hidePreview();
};

// 处理鼠标按下
const handleMouseDown = (event: MouseEvent) => {
	if (!progressBarRef.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	actions.startDragging(position);

	document.addEventListener("mousemove", handleGlobalMouseMove);
	document.addEventListener("mouseup", handleMouseUp);
};

// 处理全局鼠标移动
const handleGlobalMouseMove = (event: MouseEvent) => {
	if (!progressBarRef.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	actions.updateDragging(position);
};

// 处理鼠标松开
const handleMouseUp = () => {
	actions.stopDragging();
	document.removeEventListener("mousemove", handleGlobalMouseMove);
	document.removeEventListener("mouseup", handleMouseUp);
};

// 进度条点击
const handleProgressClick = (event: MouseEvent) => {
	if (!progressBarRef.value || state.isDragging.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	const newTime = position * state.duration.value;
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
</style> 