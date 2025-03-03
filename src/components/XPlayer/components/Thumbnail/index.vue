<template>
	<div 
		class="preview-container"
		v-show="visible"
		:style="{ 
			left: `${position}%`,
			transform: `translateX(${previewTransform}px)`
		}"
	>
		<div class="thumbnail-container">
			<canvas 
				ref="thumbnailCanvas"
				:width="width"
				:height="height"
			></canvas>
			<div class="thumbnail-loading" v-if="tasks.length > 0">
				<LoadingBar />
			</div>
		</div>
		<div class="time-tooltip">
			{{ formatTime(time) }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef, watch } from "vue";
import { usePlayerContext } from "../../hooks/usePlayer";
import { formatTime } from "../../utils/time";
import LoadingBar from "./LoadingBar.vue";

interface Props {
	visible: boolean;
	position: number;
	time: number;
	progressBarWidth: number;
}

const props = withDefaults(defineProps<Props>(), {});
const { rootProps, source } = usePlayerContext();
const { onThumbnailRequest } = rootProps;
const thumbnailCanvas = ref<HTMLCanvasElement | null>(null);
const ctx = computed(() => thumbnailCanvas.value?.getContext("2d"));
const currentThumbnail = ref<ImageBitmap | null>(null);
const tasks = ref<number[]>([]);
const width = computed(() => currentThumbnail.value?.width ?? 320);
const height = computed(() => currentThumbnail.value?.height ?? 180);

// 计算预览容器的位移，防止超出边界
const previewTransform = computed(() => {
	if (!thumbnailCanvas.value) return -(width.value / 2);

	const thumbnailWidth = width.value;
	const centerOffset = props.progressBarWidth * (props.position / 100);

	// 如果缩略图会超出左边界
	if (centerOffset < thumbnailWidth / 2) {
		return -centerOffset;
	}

	// 如果缩略图会超出右边界
	if (centerOffset > props.progressBarWidth - thumbnailWidth / 2) {
		return -(thumbnailWidth - (props.progressBarWidth - centerOffset));
	}

	// 正常情况，缩略图居中显示
	return -(thumbnailWidth / 2);
});

// 更新缩略图
watch(
	() => props.time,
	async (newTime) => {
		if (onThumbnailRequest) {
			tasks.value.push(newTime);
			currentThumbnail.value = await onThumbnailRequest(newTime);
			tasks.value = tasks.value.filter((task) => task !== newTime);
		}
	},
);

// 绘制缩略图
watch(currentThumbnail, (newVal) => {
	if (thumbnailCanvas.value && ctx.value) {
		requestAnimationFrame(() => {
			ctx.value.fillRect(0, 0, width.value, height.value);
			if (newVal) {
				ctx.value.drawImage(newVal, 0, 0, width.value, height.value);
			}
		});
	}
});

watch([source.list], () => {
	currentThumbnail.value = null;
});
</script>

<style scoped>
.preview-container {
	position: absolute;
	bottom: 100%;
	margin-bottom: 10px;
	pointer-events: none;
	will-change: transform;
}

.thumbnail-container {
	position: relative;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(15, 15, 15, 0.7);
	canvas {
		background: rgba(15, 15, 15, 0.9);
	}
}

.time-tooltip {
	text-align: center;
	margin-top: 4px;
	color: #fff;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.thumbnail-loading {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 2px;
	background: rgba(0, 0, 0, 0.3);
}
</style> 