<template>
	<div 
		class="thumbnail"
		:style="{
			display: visible ? 'block' : 'none'
		}"
	>
		<canvas 
			v-if="type === 'canvas'"
			ref="canvasRef"
			:width="width"
			:height="height"
		></canvas>
		<img
			v-else
			:src="currentThumbnail"
			:width="width"
			:height="height"
			alt="thumbnail"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface Props {
	position: number;
	visible: boolean;
	width?: number;
	height?: number;
	type?: "image" | "canvas";
	thumbnails?: string[] | ImageBitmap[];
	currentTime?: number;
	duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
	width: 160,
	height: 90,
	type: "image",
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const currentThumbnail = ref("");

// 更新缩略图
const updateThumbnail = () => {
	if (
		!props.thumbnails?.length ||
		props.currentTime === undefined ||
		props.duration === undefined
	)
		return;

	const index = Math.floor(
		(props.currentTime / props.duration) * props.thumbnails.length,
	);
	const thumbnail =
		props.thumbnails[Math.min(index, props.thumbnails.length - 1)];

	if (
		props.type === "canvas" &&
		thumbnail instanceof ImageBitmap &&
		canvasRef.value
	) {
		const ctx = canvasRef.value.getContext("2d");
		if (ctx) {
			ctx.clearRect(0, 0, props.width, props.height);
			ctx.drawImage(thumbnail, 0, 0, props.width, props.height);
		}
	} else if (typeof thumbnail === "string") {
		currentThumbnail.value = thumbnail;
	}
};

// 监听时间变化更新缩略图
watch(
	() => props.currentTime,
	() => updateThumbnail(),
);
</script>

<style scoped>
.thumbnail {
	background-color: #000;
	border-radius: 4px;
	overflow: hidden;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

canvas, img {
	display: block;
}
</style> 