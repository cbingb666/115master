import { throttle } from "lodash";
import { ref } from "vue";
import type { VideoSource } from "../../../components/XPlayer/types";
import { type ClipFrame, M3U8Clipper } from "../../../utils/clip";

export function useDataThumbnails() {
	const isLoading = ref(false);
	const clipper = new M3U8Clipper({
		maxCacheSize: 100,
		queueSize: 100,
		queueConcurrency: 2,
	});
	const getThumbnailByTime =
		ref<(time: number) => Promise<ClipFrame | null | undefined>>();

	// 找到最低画质的 HLS 源
	const findLowestQualityHLS = (sources: VideoSource[]): VideoSource | null => {
		let lowestQuality: VideoSource | null = null;
		sources.forEach((source) => {
			if (source.type === "hls") {
				if (!lowestQuality || source.quality < lowestQuality.quality) {
					lowestQuality = source;
				}
			}
		});
		return lowestQuality;
	};

	// 初始化缩略图生成器
	const initialize = async (sources: VideoSource[]) => {
		const source = findLowestQualityHLS(sources);
		if (!source) return;
		await clipper.getM3U8InfoByUrl(source.url);
		getThumbnailByTime.value = throttle(
			(time: number) =>
				clipper.getClipByTime(time, {
					maxWidth: 320,
					maxHeight: 180,
					samplesPerSegment: 10,
				}),
			250,
			{
				leading: true,
				trailing: true,
			},
		);
		isLoading.value = true;
	};

	// 获取指定时间点的缩略图
	const getThumbnailAtTime = async (time: number) => {
		if (Number.isNaN(time)) {
			return null;
		}
		if (!getThumbnailByTime.value) {
			return null;
		}
		const clipFrame = clipper.getClipByTimeByCache(time);

		if (clipFrame) {
			return clipFrame?.img;
		}

		const clipFrameNew = await getThumbnailByTime.value(time);
		if (clipFrameNew) {
			return clipFrameNew?.img;
		}
	};

	// 清理资源
	const cleanup = () => {
		clipper.destroy();
	};

	return {
		isLoading,
		initialize,
		getThumbnailAtTime,
		cleanup,
	};
}
