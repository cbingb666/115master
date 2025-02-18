import { ref } from "vue";
import {
	type ProcessedSubtitle,
	subtitlecat,
} from "../../../utils/subtitlecat";

// 字幕
export const useDataSubtitles = () => {
	const subtitles = ref<ProcessedSubtitle[]>([]);

	const fetch = async (keyword: string) => {
		const ResSubtitles = await subtitlecat.fetchSubtitle(keyword, "zh-CN");
		subtitles.value = ResSubtitles;
	};
	return {
		subtitles,
		fetch,
	};
};
