import { ref } from "vue";

/**
 * 视频页面参数
 */
export const useParamsVideoPage = () => {
	const params = new URLSearchParams(window.location.search);
	const pickCode = ref<string | null>(params.get("pick_code"));
	const avNumber = ref<string | null>(params.get("avNumber"));

	return {
		pickCode,
		avNumber,
	};
};
