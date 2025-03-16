<template>
	<div class="ext-preview" ref="rootRef">
		<LoadingError v-if="videoData.error.value" style="margin: 0 auto" />
		<Skeleton v-else-if="videoData.isLoading.value" mode="light" width="100%" height="100%" border-radius="0"  />	
		<div class="ext-preview-video pswp-gallery" :id="`gallery-${props.pickCode}`" v-else ref="videoRef">
			<a 
				v-for="(thumbnail, index) in videoData.state.value"
				:key="index"
				class="thumb-item"
				@click.prevent.stop="openPhotoSwipe(index)"
			>
				<img 
					:src="thumbnail.img" 
					:alt="`预览图 ${index + 1}`"
				/>
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAsyncState, useElementVisibility } from "@vueuse/core";
import { sampleSize } from "lodash";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import LoadingError from "../../../../components/LoadingError/index.vue";
import Skeleton from "../../../../components/Skeleton/index.vue";
import { M3U8Clipper } from "../../../../utils/clipper/m3u8";
import Drive115Instance from "../../../../utils/drive115";
import "photoswipe/style.css";
import { previewCache } from "../../../../utils/cache";
import {
	blobToBase64,
	getImageSize,
	imageBitmapToBlob,
	isBlackFrame,
} from "../../../../utils/image";

const props = defineProps<{
	pickCode: string;
	sha1: string;
}>();

const rootRef = ref<HTMLElement>();
const rootVisibilityRef = useElementVisibility(rootRef, {
	threshold: 0.3,
});
const videoRef = ref<HTMLElement>();
const lightbox = ref<PhotoSwipeLightbox | null>(null);

// 初始化 PhotoSwipe
const initPhotoSwipe = () => {
	if (lightbox.value) {
		lightbox.value.destroy();
		lightbox.value = null;
	}

	lightbox.value = new PhotoSwipeLightbox({
		dataSource:
			videoData.state.value?.map((item) => ({
				src: item.img,
				width: item.width,
				height: item.height,
				alt: "预览图",
			})) || [],
		showHideAnimationType: "fade",
		pswpModule: () => import("photoswipe"),
		mouseMovePan: true,
		initialZoomLevel: "fit",
		secondaryZoomLevel: 2,
		maxZoomLevel: 4,
		wheelToZoom: true,
		bgOpacity: 0.9,
	});

	lightbox.value.init();
};

// 打开 PhotoSwipe
const openPhotoSwipe = (index: number) => {
	if (!lightbox.value || !videoData.state.value?.length) return;
	lightbox.value.loadAndOpen(index);
};

const fetchVideoData = async () => {
	const cache = await previewCache.get(props.sha1);
	if (cache) {
		// 从缓存获取数据后，将Blob转换为base64用于显示
		const cachedData = cache.value;
		const processedData = await Promise.all(
			cachedData.map(async (item) => {
				// 将缓存的Blob转换为base64用于显示
				const base64 = await blobToBase64(item);
				const { width, height } = await getImageSize(base64);
				return {
					img: base64,
					width,
					height,
				};
			}),
		);
		return processedData;
	}

	const m3u8List = await Drive115Instance.getM3u8(props.pickCode);
	const source = m3u8List.sort((a, b) => a.quality - b.quality)[0];
	if (!source) return null;

	const clipper = new M3U8Clipper({
		maxWidth: 720,
		maxHeight: 720,
	});
	await clipper.init(source.url, 0);
	const segments = sampleSize(clipper.M3U8Info.segments, 5);
	const frames = await Promise.all(
		segments.map((segment) => clipper.getClip(segment._startTime)),
	);

	// 生成缩略图
	const thumbnails = await Promise.all(
		frames.filter(Boolean).map(async (frame) => {
			const width = frame.img.width;
			const height = frame.img.height;

			// 检测是否为黑帧
			const isBlack = await isBlackFrame(frame.img);
			if (isBlack) return null;

			// 直接从ImageBitmap创建Blob用于缓存
			const blob = await imageBitmapToBlob(frame.img, 0.8);

			// 将Blob转换为base64用于显示
			const base64 = await blobToBase64(blob);

			return {
				// 用于显示
				img: base64,
				// 用于缓存
				cacheBlob: blob,
				width,
				height,
			};
		}),
	);

	clipper.clear();

	const filteredThumbnails = thumbnails.filter(Boolean);

	try {
		// 缓存数据 - 使用Blob
		const cacheData = filteredThumbnails.map((item) => item.cacheBlob);
		await previewCache.set(props.sha1, cacheData);
	} catch (error) {
		console.error("缓存失败:", error);
	}

	// 返回用于显示的数据
	return filteredThumbnails.map((item) => ({
		img: item.img,
		width: item.width,
		height: item.height,
	}));
};

const videoData = useAsyncState(fetchVideoData, null, { immediate: false });

// 监听元素可见性
watch(
	() => rootVisibilityRef.value,
	(visible) => {
		if (visible) {
			videoData.execute(0);
		}
	},
);

// 监听数据变化，初始化 PhotoSwipe
watch(
	() => videoData.state.value,
	async (newValue) => {
		if (newValue?.length > 0) {
			await nextTick();
			initPhotoSwipe();
		}
	},
);

// 组件销毁时清理
onBeforeUnmount(() => {
	if (lightbox.value) {
		lightbox.value.destroy();
		lightbox.value = null;
	}
});
</script>

<style scoped>
.ext-preview {
	width: 100%;
	height: 150px;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	.ext-preview-video {
		width: 100%;
		height: 150px;
		display: flex;
		justify-content: center;
		overflow: hidden;
		overflow-x: auto;
		gap: 1px;

		/* 优化滚动条样式 */
		&::-webkit-scrollbar {
			height: 0; /* 减小滚动条高度 */
			width: 0;
		}

		.thumb-item {
			height: 150px;
			cursor: zoom-in;
			text-decoration: none;

			&:hover {
				opacity: 0.9;
			}

			img {
				height: 150px;
				object-fit: cover;
				object-position: center;
				vertical-align: top;
			}
		}
	}
}
</style>