import { ref } from "vue";
import type { VideoSource } from "../../../components/XPlayer";
import drive115 from "../../../utils/drive115";
export const useFetchVideoSources = () => {
	const list = ref<VideoSource[]>([]);

	const fetch = async (pickCode: string) => {
		const [download, m3u8List] = await Promise.allSettled([
			drive115.getFileDownloadUrl(pickCode),
			drive115.parseM3u8Url(drive115.getM3u8RootUrl(pickCode)),
		]);

		if (download.status === "fulfilled") {
			list.value.unshift({
				name: "Ultra原画",
				url: download.value.url,
				type: "auto",
				quality: 9999,
				displayQuality: "Ultra原画",
			});
		}

		if (m3u8List.status === "fulfilled") {
			list.value.push(
				...m3u8List.value.map((item) => ({
					name: `${item.quality}P`,
					url: item.url,
					type: "hls" as const,
					quality: item.quality,
				})),
			);
		}
	};

	return {
		list: ref(list.value),
		fetch,
	};
};
