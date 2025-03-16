import { tryOnUnmounted, useThrottleFn } from "@vueuse/core";
import { sampleSize } from "lodash";
import type { VideoSource } from "../../../components/XPlayer/types";
import {
	M3U8Clipper,
	type M3U8ClipperOptions,
} from "../../../utils/clipper/m3u8";
import { type LaneConfig, Scheduler } from "../../../utils/scheduler";

// 缩略图生成器配置
const CLIPPER_OPTIONS: M3U8ClipperOptions = {
	maxWidth: 320,
	maxHeight: 180,
};

// 车道配置
const LANE_CONFIG: Record<string, LaneConfig> = {
	must: {
		name: "must",
		priority: 1,
		maxConcurrent: 5,
	},
	buffer: {
		name: "buffer",
		priority: 2,
		maxConcurrent: 5,
	},
};

const SCHEDULER_OPTIONS = {
	maxConcurrent: 5,
	maxQueueLength: 500,
	laneConfig: LANE_CONFIG,
};

const BLUR = 30;

export function useDataThumbnails() {
	// 缩略图生成器
	const clipper = new M3U8Clipper(CLIPPER_OPTIONS);

	// 任务调度器
	const scheduler = new Scheduler<ImageBitmap | null>(SCHEDULER_OPTIONS);

	// 初始化缩略图生成器
	let isInited = false;
	const initialize = async (sources: VideoSource[]) => {
		isInited = false;
		clipper.clear();

		const source = findLowestQualityHLS(sources);
		if (!source) return;
		await clipper.init(source.url, BLUR);
		await autoBuffer();
		isInited = true;
	};

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

	// 节流拉取缩略图
	const onMThumbnailRequestMust = useThrottleFn(
		async (time: number, isLast: boolean): Promise<ImageBitmap | null> => {
			if (!isInited || Number.isNaN(time)) {
				return null;
			}

			const segment = clipper.findSegmentByTime(time);
			const id = segment?._uri ?? "";

			if (!id) {
				throw new Error("segment is not null");
			}

			const lane = isLast ? LANE_CONFIG.must : LANE_CONFIG.buffer;

			let promise: Promise<ImageBitmap | null>;

			const task = scheduler.get(id);

			// 如果有存在的任务并且是最后的任务，尝试抢占车道
			if (
				task &&
				isLast &&
				scheduler.tryOvertaking(id, LANE_CONFIG.must.name)
			) {
				promise = task.promise;
			} else if (task) {
				promise = task.promise;
			}
			// 如果任务不存在，则添加任务
			else {
				promise = scheduler.add(
					async () => {
						const clipImage = await clipper.getClip(time);
						return clipImage?.img ?? null;
					},
					{
						id,
						lane: lane.name,
						priority: 0,
						immediate: true,
						action: "unshift",
					},
				);
			}

			// 返回任务结果
			return await promise.catch((error) => {
				console.error(error.message);
				throw error;
			});
		},
		125,
		true,
		false,
	);

	// 获取指定时间点的缩略图
	const onThumbnailRequest = async ({
		type,
		time,
		isLast,
	}: {
		type: "Cache" | "Must";
		time: number;
		isLast: boolean;
	}): Promise<ImageBitmap | null> => {
		if (!isInited || Number.isNaN(time)) {
			return null;
		}
		const _blurTime = clipper.blurTime(time);
		if (type === "Cache") {
			const clipImage = clipper.getClipByCache(_blurTime);
			return clipImage?.img ?? null;
		}

		return onMThumbnailRequestMust(_blurTime, isLast);
	};

	// 自动加载缩略图
	const autoBuffer = async () => {
		const blurSegments = sampleSize(
			clipper.blurSegments,
			Math.max(
				Math.min(clipper.blurSegments.length, 50),
				clipper.blurSegments.length /
					(localStorage.getItem("115master-super-auto-buffer") ? 1 : 3),
			),
		);
		if (!blurSegments.length) {
			throw new Error("blurSegments is not null");
		}

		for (const segment of blurSegments) {
			const id = segment._uri ?? "";
			if (scheduler.get(id)) {
				continue;
			}
			scheduler.add(
				async () => {
					const clipImage = await clipper.getClip(segment._startTime);
					return clipImage?.img ?? null;
				},
				{
					id,
					lane: LANE_CONFIG.buffer.name,
					priority: 1,
					immediate: true,
					action: "unshift",
				},
			);
		}
	};

	// clear
	const clear = () => {
		clipper.clear();
		scheduler.clear();
	};

	tryOnUnmounted(() => {
		clear();
	});

	return {
		initialize,
		onThumbnailRequest,
		clear,
	};
}
