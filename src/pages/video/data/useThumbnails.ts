import { tryOnUnmounted, useThrottleFn } from "@vueuse/core";
import type { VideoSource } from "../../../components/XPlayer/types";
import { getUniformSample } from "../../../utils/array";
import {
	M3U8Clipper,
	type M3U8ClipperOptions,
} from "../../../utils/clipper/m3u8";
import { Scheduler, TaskStatus } from "../../../utils/scheduler";

// 缩略图生成器配置
const CLIPPER_OPTIONS: M3U8ClipperOptions = {
	maxWidth: 320,
	maxHeight: 180,
};

// 车道配置
const LANE_CONFIG = {
	must: {
		name: "must",
		priority: 1,
		maxConcurrent: 3,
	},
	buffer: {
		name: "buffer",
		priority: 2,
		maxConcurrent: 3,
	},
};

const SCHEDULER_OPTIONS = {
	maxConcurrent: 4,
	maxQueueLength: 500,
	laneConfig: LANE_CONFIG,
};

export function useDataThumbnails() {
	// 缩略图生成器
	const clipper = new M3U8Clipper(CLIPPER_OPTIONS);

	// 任务调度器
	const scheduler = new Scheduler<ImageBitmap | null>(SCHEDULER_OPTIONS);

	// clear
	const clear = () => {
		clipper.clear();
		scheduler.clear();
	};

	tryOnUnmounted(() => {
		clear();
	});

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
	let isInited = false;
	const initialize = async (sources: VideoSource[]) => {
		isInited = false;
		clipper.clear();

		const source = findLowestQualityHLS(sources);
		if (!source) return;
		await clipper.fetchM3U8Info(source.url);
		await autoBuffer();
		isInited = true;
	};

	// 模糊时间
	const blurTime = (time: number, blur: number, max: number) => {
		const _blurTime = time - (time % blur) + blur / 2;
		return Math.min(Math.max(0, _blurTime), max);
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

			// 暂停缓冲车道
			if (isLast) {
				scheduler.pause(LANE_CONFIG.buffer.name);
			}

			let promise: Promise<ImageBitmap | null>;

			const task = scheduler.get(id);

			// 如果有存在的任务并且是最后的任务，尝试抢占车道
			if (task && isLast && scheduler.tryOvertaking(id, lane.name)) {
				promise = task.promise;
			}
			// 如果任务存在并且是暂停状态，尝试恢复任务
			else if (task && scheduler.tryResume(id)) {
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
						priority: lane.priority,
						immediate: true,
						action: "unshift",
					},
				);
			}

			// 返回任务结果
			return await promise
				.catch((error) => {
					console.error(error.message);
					throw error;
				})
				.finally(() => {
					if (isLast) {
						scheduler.resume(LANE_CONFIG.buffer.name);
					}
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

		const blur = 30;
		const _blurTime = blurTime(
			time,
			blur,
			Math.floor(clipper.M3U8Info?.totalDuration ?? 0),
		);
		if (type === "Cache") {
			const clipImage = clipper.getClipByCache(_blurTime);
			return clipImage?.img ?? null;
		}

		return onMThumbnailRequestMust(_blurTime, isLast);
	};

	// 自动加载缩略图
	const autoBuffer = async () => {
		const segments = clipper.M3U8Info?.segments ?? [];
		const preloadSegments = getUniformSample(segments, 50);

		for (const segment of preloadSegments) {
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
					priority: 2,
					immediate: true,
					action: "unshift",
				},
			);
		}
	};

	return {
		initialize,
		onThumbnailRequest,
		clear,
	};
}
