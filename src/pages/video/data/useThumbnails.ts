import { ref } from "vue";

export const useThumbnails = () => {
	const thumbnails = ref<string[]>([]);

	return {
		thumbnails,
	};
};
