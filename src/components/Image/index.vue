<template>
	<div class="image-container">
		<Skeleton width="100%" height="100%" :mode="skeletonMode" v-if="loading" />
		<LoadingError v-else-if="error" />
		<img v-else :src="src" :origin-src="props.src" :refferer="props.referer" v-bind="$attrs" />
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { imageCache } from "../../utils/cache/imageCache";
import { blobToBase64, compressImage } from "../../utils/image";
import { GMRequest } from "../../utils/request/gmRequst";
import LoadingError from "../LoadingError/index.vue";
import Skeleton from "../Skeleton/index.vue";
type Props = {
	referer?: string;
	src: string;
	alt: string;
	skeletonMode?: "light" | "dark";
	cache?: boolean;
};

const props = defineProps<Props>();
const src = ref<string>();
const loading = ref(false);
const error = ref(false);
const gmRequst = new GMRequest();

const getImageByGmRequest = async (src: string): Promise<Base64URLString> => {
	if (props.cache) {
		const cache = await imageCache.get(src);
		if (cache) {
			return await blobToBase64(cache.value);
		}
	}
	const res = await gmRequst.get(src, {
		headers: {
			...(props.referer ? { Referer: props.referer } : {}),
		},
		responseType: "blob",
	});
	const blob = new Blob([await res.blob()], { type: "image/jpeg" });
	const compressedBlob = await compressImage(blob, {
		maxWidth: 720,
		maxHeight: 720,
		quality: 0.8,
		type: "image/webp",
	});
	props.cache && imageCache.set(props.src, compressedBlob);
	return await blobToBase64(compressedBlob);
};

const loadImage = async (_src: string) => {
	try {
		loading.value = true;
		if (props.referer) {
			const result = await getImageByGmRequest(_src);
			src.value = result;
		} else {
			src.value = _src;
		}
	} catch {
		src.value = "";
		error.value = true;
	} finally {
		loading.value = false;
	}
};

watch(
	() => props.src,
	async (newVal) => {
		if (newVal) {
			loadImage(newVal);
		} else {
			src.value = "";
		}
	},
	{ immediate: true },
);
</script>

<style scoped>
.image-container {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}
</style>