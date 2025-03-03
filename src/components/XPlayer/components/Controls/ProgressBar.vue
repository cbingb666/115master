<template>
	<div class="progress-bar">
		<!-- 进度条外容器 -->
		<div 
			ref="progressBarRef"
			class="progress-bar-wrapper"
			@click="handleBarWrapperClick"
			@mousemove="handleBarWrapperMouseMove"
			@mouseenter="handleBarWrapperMouseEnter"
			@mouseleave="handleBarWrapperMouseLeave"
			@mousedown="handleBarWrapperMouseDown"
		>
			<!-- 进度条内容器 -->
			<div class="progress-bar-container">
				<!-- 缓冲进度 -->
				<div 
					class="progress-buffer"
					:style="{ width: `${progress.buffered.value}%` }"
				></div>

				<!-- 原始播放进度（拖拽时保持显示） -->
				<div 
					class="progress-current"
					:style="{ 
						width: `${progress.progress.value}%`,
						opacity: isDragging ? 0.5 : 1
					}"
				></div>

				<!-- 拖拽时的实时进度 -->
				<div 
					v-if="isDragging"
					class="progress-current progress-dragging"
					:style="{ width: `${dragProgress}%` }"
				></div>

				<!-- 预览进度 -->
				<div 
					v-show="isPreviewVisible && !isDragging"
					class="progress-hover" 
					:style="{ width: `${previewProgress}%` }"
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
					:style="{ 
						left: `${isDragging ? dragProgress : progress.progress.value}%` 
					}"
				>
					<div 
						class="progress-handle"
						:class="{ 'is-dragging': isDragging }"
					></div>
				</div>
			</div>

			<!-- 缩略图预览 -->
			<Thumbnail
				:visible="isPreviewVisible || isDragging"
				:position="isDragging ? dragProgress : previewProgress"
				:time="isDragging ? previewTime : (isPreviewVisible ? previewTime : progress.currentTime.value)"
				:progress-bar-width="progressBarWidth"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { usePlayerContext } from "../../hooks/usePlayer";
import Thumbnail from "../Thumbnail/index.vue";

const { progress } = usePlayerContext();
// 进度条容器
const progressBarRef = ref<HTMLElement | null>(null);
// 进度条宽度
const progressBarWidth = computed(() => progressBarRef.value?.offsetWidth || 0);
// 是否正在拖拽
const isDragging = ref(false);
// 拖拽进度
const dragProgress = ref(0);
// 原始进度
const originalProgress = ref(0);
// 预览时间
const previewTime = ref(0);
// 预览进度
const previewProgress = ref(0);
// 预览是否可见
const isPreviewVisible = ref(false);

// 处理鼠标进入
const handleBarWrapperMouseEnter = () => {
	if (!isPreviewVisible.value) {
		showPreview();
	}
};

// 处理鼠标离开
const handleBarWrapperMouseLeave = () => {
	hidePreview();
};

// 计算鼠标位置对应的进度
const calculatePosition = (event: MouseEvent, element: HTMLElement) => {
	const rect = element.getBoundingClientRect();
	const position = (event.clientX - rect.left) / rect.width;
	return Math.min(Math.max(position, 0), 1);
};

// 处理鼠标按下
const handleBarWrapperMouseDown = (event: MouseEvent) => {
	if (!progressBarRef.value) return;

	const position = calculatePosition(event, progressBarRef.value);
	startDragging(position);

	document.addEventListener("mousemove", handleGlobalMouseMove);
	document.addEventListener("mouseup", handleMouseUp);
};

// 处理鼠标松开
const handleMouseUp = (event: MouseEvent) => {
	document.removeEventListener("mousemove", handleGlobalMouseMove);
	document.removeEventListener("mouseup", handleMouseUp);
	const position = calculatePosition(event, progressBarRef.value);
	stopDragging(position);
};

// 处理鼠标移动
const handleBarWrapperMouseMove = (event: MouseEvent) => {
	if (!progressBarRef.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	updatePreview(position);
};

// 处理全局鼠标移动
const handleGlobalMouseMove = (event: MouseEvent) => {
	if (!progressBarRef.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	updateDragging(position);
};

// 进度条点击
const handleBarWrapperClick = (event: MouseEvent) => {
	if (!progressBarRef.value || isDragging.value) return;
	const position = calculatePosition(event, progressBarRef.value);
	const newTime = position * progress.duration.value;
	progress.seekTo(newTime);
};

// 更新预览位置
const updatePreview = (position: number) => {
	previewProgress.value = position * 100;
	previewTime.value = position * progress.duration.value;
};

// 开始拖拽
const startDragging = (position: number) => {
	isDragging.value = true;
	originalProgress.value = progress.progress.value;
	dragProgress.value = position * 100;
	previewTime.value = position * progress.duration.value;
};

// 更新拖拽
const updateDragging = (position: number) => {
	if (!isDragging.value) return;
	dragProgress.value = position * 100;
	previewTime.value = position * progress.duration.value;
};

// 停止拖拽
const stopDragging = (position: number) => {
	if (isDragging.value) {
		const finalTime = position * progress.duration.value;
		progress.seekTo(finalTime);

		previewProgress.value = position * 100;
		previewTime.value = finalTime;
	}
	isDragging.value = false;
};

// 显示预览
const showPreview = () => {
	isPreviewVisible.value = true;
};

// 隐藏预览
const hidePreview = () => {
	if (!isDragging.value) {
		isPreviewVisible.value = false;
		// 重置预览进度和时间
		previewProgress.value = 0;
		previewTime.value = 0;
	}
};

onUnmounted(() => {
	document.removeEventListener("mousemove", handleGlobalMouseMove);
	document.removeEventListener("mouseup", handleMouseUp);
});
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