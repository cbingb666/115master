import { ref } from "vue";
import type { Subtitle } from "../../../components/XPlayer/types";
import { subtitlecat } from "../../../utils/subtitlecat";

// 字幕
export const useDataSubtitles = () => {
	const subtitles = ref<Subtitle[]>([]);

	const fetch = async (keyword: string) => {
		const ResSubtitles = await subtitlecat.fetchSubtitle(keyword, "zh-CN");
		subtitles.value = ResSubtitles.map((subtitle, index) => ({
			url: subtitle.url,
			label: subtitle.title,
			srclang: subtitle.targetLanguage,
			kind: "subtitles" as const,
			default: index === 0,
		}));
	};

	const cleanup = () => {
		subtitles.value = [];
	};

	return {
		subtitles,
		fetch,
		cleanup,
	};
};
