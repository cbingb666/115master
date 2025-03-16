import { useAsyncState } from "@vueuse/core";
import { subtitlePreference } from "../../../utils/cache/subtitlePreference";
import { subtitlecat } from "../../../utils/subtitle/subtitlecat";

// 字幕
export const useDataSubtitles = () => {
	const subtitles = useAsyncState(
		async (pickcode: string, keyword: string) => {
			if (!keyword) {
				return [];
			}
			const ResSubtitles = await subtitlecat.fetchSubtitle(keyword, "zh-CN");
			const preference = await subtitlePreference.getPreference(pickcode);
			return ResSubtitles.map((subtitle) => ({
				id: subtitle.id,
				url: subtitle.url,
				label: subtitle.title,
				srclang: subtitle.targetLanguage,
				kind: "subtitles" as const,
				default: preference ? preference.id === subtitle.id : false,
			}));
		},
		[],
		{
			immediate: false,
		},
	);

	return subtitles;
};
