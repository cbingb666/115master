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
			<div class="thumbnail-loading" v-show="loading">
				<Loading/>
			</div>
		</div>
		<div class="time-tooltip">
			{{ formatTime(time) }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { usePlayerContext } from "../../hooks/usePlayer";
import { formatTime } from "../../utils/time";
import Loading from "./Loading.vue";

interface Props {
	visible: boolean;
	position: number;
	time: number;
	progressBarWidth: number;
}

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 180;

const props = withDefaults(defineProps<Props>(), {});
const { rootProps, source } = usePlayerContext();
const { onThumbnailRequest } = rootProps;
const thumbnailCanvas = ref<HTMLCanvasElement | null>(null);
const ctx = computed(() => thumbnailCanvas.value?.getContext("2d"));
const width = ref(DEFAULT_WIDTH);
const height = ref(DEFAULT_HEIGHT);
const thumb = reactive({
	lastHoverTime: -1,
	lastRequestTime: -1,
	renderTime: -1,
	renderImage: null as ImageBitmap | null,
});
const loading = computed(
	() =>
		thumb.lastRequestTime >= 0 && thumb.lastRequestTime === thumb.lastHoverTime,
);

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

const lastTimer = ref<NodeJS.Timeout | null>(null);
const updateThumbnail = async (hoverTime: number, isLast: boolean) => {
	if (lastTimer.value) {
		clearTimeout(lastTimer.value);
		lastTimer.value = null;
	}

	// 重置缩略图
	thumb.renderImage = null;

	if (!isLast) {
		lastTimer.value = setTimeout(() => {
			if (hoverTime === thumb.lastHoverTime) {
				updateThumbnail(hoverTime, true);
			}
		}, 300);
	}

	// 尝试从缓存中取, 其实是同步返回
	const cacheImage = await onThumbnailRequest({
		type: "Cache",
		time: hoverTime,
		isLast,
	});
	if (cacheImage) {
		thumb.renderImage = cacheImage;
		thumb.renderTime = hoverTime;

		if (isLast) {
			thumb.lastRequestTime = -1;
		}
		return;
	}

	thumb.lastRequestTime = hoverTime;
	const newImage = await onThumbnailRequest({
		type: "Must",
		time: hoverTime,
		isLast,
	});
	if (!newImage) return;

	// 如果请求时间与最新Hover时间相同，则更新缩略图
	if (hoverTime === thumb.lastHoverTime && isLast) {
		thumb.lastRequestTime = -1;
		thumb.renderImage = newImage;
		thumb.renderTime = hoverTime;
	}
};

// 监听缩略图请求
watch(
	() => [props.visible, props.time],
	async () => {
		if (!onThumbnailRequest) return;
		if (!props.visible || !props.time) {
			thumb.lastHoverTime = -1;
			thumb.renderImage = null;
			return;
		}

		const hoverTime = props.time;
		// 更新 hover 时间
		thumb.lastHoverTime = hoverTime;
		await updateThumbnail(hoverTime, false);
	},
);
// 绘制缩略图
watch(
	() => thumb.renderImage,
	(newVal, oldVal) => {
		if (thumbnailCanvas.value && ctx.value) {
			width.value = newVal?.width ?? oldVal?.width ?? DEFAULT_WIDTH;
			height.value = newVal?.height ?? oldVal?.height ?? DEFAULT_HEIGHT;
			requestAnimationFrame(() => {
				ctx.value.fillRect(0, 0, width.value, height.value);
				if (newVal && thumb.renderTime === thumb.lastHoverTime) {
					ctx.value.drawImage(newVal, 0, 0, width.value, height.value);
				}
			});
		}
	},
);
// 监听源列表
watch([source.list], () => {
	thumb.lastHoverTime = -1;
	thumb.lastRequestTime = -1;
	thumb.renderTime = -1;
	thumb.renderImage = null;
	if (lastTimer.value) {
		clearTimeout(lastTimer.value);
		lastTimer.value = null;
	}
});

onUnmounted(() => {
	if (lastTimer.value) {
		clearTimeout(lastTimer.value);
		lastTimer.value = null;
	}
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
	display: flex;
	position: relative;
	border-radius: 16px;
	box-shadow: 0 2px 8px rgba(15, 15, 15, 0.7);
	overflow: hidden;
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
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	border-radius: 16px;
}
</style>
