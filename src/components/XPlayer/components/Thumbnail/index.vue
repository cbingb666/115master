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
		</div>
		<div class="time-tooltip">
			{{ formatTime(time) }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { formatTime } from "../../utils/time";

interface Props {
	visible: boolean;
	position: number;
	time: number;
	width?: number;
	height?: number;
	progressBarWidth: number;
	onThumbnailRequest?: (time: number) => Promise<ImageBitmap | null>;
}

const props = withDefaults(defineProps<Props>(), {
	width: 320,
	height: 180,
});

const thumbnailCanvas = ref<HTMLCanvasElement | null>(null);
const ctx = computed(() => thumbnailCanvas.value?.getContext("2d"));
const currentThumbnail = ref<ImageBitmap | null>(null);

// 计算预览容器的位移，防止超出边界
const previewTransform = computed(() => {
	if (!thumbnailCanvas.value) return -(props.width / 2);

	const thumbnailWidth = props.width;
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
		if (props.onThumbnailRequest) {
			currentThumbnail.value = await props.onThumbnailRequest(newTime);
		}
	},
);

// 绘制缩略图
watch(currentThumbnail, (newVal) => {
	if (newVal && thumbnailCanvas.value && ctx.value) {
		requestAnimationFrame(() => {
			ctx.value.fillRect(0, 0, props.width, props.height);
			ctx.value.drawImage(newVal, 0, 0, props.width, props.height);
		});
	}
});
</script>

<style scoped>
.preview-container {
	position: absolute;
	bottom: 100%;
	margin-bottom: 10px;
	pointer-events: none;
}

.thumbnail-container {
	background-color: rgba(0, 0, 0, 0.8);
	border-radius: 4px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.time-tooltip {
	text-align: center;
	margin-top: 4px;
	color: #fff;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
</style> 