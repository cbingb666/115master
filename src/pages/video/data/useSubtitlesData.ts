import { useAsyncState } from "@vueuse/core";
import type { Subtitle } from "../../../components/XPlayer/types";
import { subtitlePreference } from "../../../utils/cache/subtitlePreference";
import { drive115 } from "../../../utils/drive115";
import { fetchRequest } from "../../../utils/request/fetchRequest";
import {
	convertSrtToVtt,
	vttToBlobUrl,
} from "../../../utils/subtitle/subtitleTool";
import { subtitlecat } from "../../../utils/subtitle/subtitlecat";

// 获取字幕
export const useDataSubtitles = () => {
	// 通过 subtitleCat 获取字幕
	const getFromSubtitlecat = async (keyword: string) => {
		if (!keyword) {
			return [];
		}
		const res = await subtitlecat.fetchSubtitle(keyword, "zh-CN");
		return res.map((subtitle) => ({
			id: subtitle.id,
			url: subtitle.url,
			label: subtitle.title,
			srclang: subtitle.targetLanguage,
			source: "Subtitle Cat",
			kind: "subtitles" as const,
		}));
	};

	// 通过 115 获取字幕
	const getFrom115 = async (pickcode: string) => {
		const res = await drive115.webApiGetMoviesSubtitle({
			pickcode,
		});
		return Promise.all(
			res.data.list.map(async (subtitle) => {
				const url = new URL(subtitle.url);
				url.protocol = "https://";
				const vttText = await fetchRequest.get(url.href);
				return {
					id: subtitle.sid,
					url: vttToBlobUrl(convertSrtToVtt(await vttText.text())),
					label: `${subtitle.title}`,
					source: subtitle.file_id ? "Upload" : "Built-in",
					srclang: subtitle.language || "zh-CN",
					kind: "subtitles" as const,
				};
			}),
		);
	};

	// 获取字幕
	const subtitles = useAsyncState<Subtitle[]>(
		async (pickcode: string, keyword: string) => {
			const preference = await subtitlePreference.getPreference(pickcode);
			const subtitleCats = await getFromSubtitlecat(keyword);
			const subtitles115 = await getFrom115(pickcode);

			return [...subtitleCats, ...subtitles115].map((s) => {
				return {
					...s,
					default: preference ? preference.id === s.id : false,
				};
			});
		},
		[],
		{
			immediate: false,
		},
	);

	return subtitles;
};
