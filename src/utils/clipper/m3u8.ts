import { type Manifest, Parser, type Segment } from "m3u8-parser";
import { type ClipFrame, ClipperCore, type ClipperOptions } from "./core";

// M3U8 分段扩展
export interface SegmentExt extends Segment {
	// 分片 URL
	_uri: string;
	// 分片时长
	_duration: number;
	// 分片开始时间
	_startTime: number;
	// 分片结束时间
	_endTime: number;
	// 分片索引
	_index: number;
}

// M3U8 信息扩展
export interface ManifestExt extends Manifest {
	// 分片信息
	segments: SegmentExt[];
	// 视频流总时长
	totalDuration: number;
}

// 分段缓存索引
export type SegmentCacheIndexKey = number;

// 分段截图
export type SegmentClips = {
	frames: ClipFrame[];
	count: number;
	segment: SegmentExt;
	times: {
		total: number;
	};
};

// M3U8 视频缩略图生成器选项
export type M3U8ClipperOptions = ClipperOptions;

/**
 * M3U8 视频缩略图生成器
 */
export class M3U8Clipper extends ClipperCore {
	// 缓存分段缩略图
	public segmentCache = new Map<SegmentCacheIndexKey, SegmentClips>();
	// M3U8 信息
	public M3U8Info: ManifestExt | null = null;
	// 分段截图 Promise
	public clipingPromise = new Map<
		SegmentCacheIndexKey,
		Promise<SegmentClips | null>
	>();
	// 模糊
	public blur = 0;
	// 模糊分段
	public blurSegments: SegmentExt[] = [];

	constructor(protected options: M3U8ClipperOptions) {
		super(options);
	}

	async init(url: string, blur: number) {
		this.blur = blur;
		await this.fetchM3U8Info(url);
		this.blurSegments = this.getblurSegments(this.M3U8Info?.segments ?? []);
	}

	// 模糊时间
	public blurTime(time: number) {
		const _blurTime = time - (time % this.blur) + this.blur / 2;
		return Math.min(Math.max(0, _blurTime), this.M3U8Info?.totalDuration ?? 0);
	}

	// 模糊分段
	public getblurSegments(segments: SegmentExt[]): SegmentExt[] {
		return segments.filter((segment) => {
			const segmentBlurTime = this.blurTime(segment._startTime);
			const isInBlurRange =
				segment._startTime <= segmentBlurTime &&
				segment._endTime >= segmentBlurTime;
			return isInBlurRange;
		});
	}

	// 获取 M3U8 信息
	public async fetchM3U8Info(url: string): Promise<ManifestExt> {
		const response = await fetch(url);
		const m3u8Text = await response.text();
		const parser = new Parser();
		parser.push(m3u8Text);
		parser.end();

		// 转换 M3U8 信息
		const manifest = parser.manifest as ManifestExt;
		let startTime = 0;
		manifest.segments = manifest.segments.map((segment, index) => {
			const uri = new URL(segment.uri, url).href;
			const endTime = startTime + segment.duration;
			const info = {
				...segment,
				_uri: uri,
				_duration: segment.duration,
				_startTime: startTime,
				_endTime: endTime,
				_index: index,
			};
			startTime = endTime;
			return info;
		});
		manifest.totalDuration = startTime;

		this.M3U8Info = manifest;
		return manifest;
	}

	// 获取缩略图
	public async getClip(time: number): Promise<ClipFrame | null> {
		if (!this.M3U8Info) {
			throw new Error("M3U8Info is not initialized");
		}

		const segment = this.findSegmentByTime(time);
		if (!segment) {
			throw new Error(
				`Segment is not found: ${time}，totalDuration: ${this.M3U8Info?.totalDuration}`,
			);
		}

		const clipingPromise = this.clipingPromise.get(segment._index);
		if (clipingPromise) {
			throw new Error(
				`Segment is already being clipped: ${segment._index}
				`,
			);
		}

		const promise = this.clipsSegment(segment);
		this.clipingPromise.set(segment._index, promise);

		const segmentClips = await promise;

		if (!segmentClips) {
			return null;
		}

		this.segmentCache.set(segment._index, segmentClips);
		return this.findFrameByTime(segmentClips, time);
	}

	// 获取缓存缩略图
	public getClipByCache(time: number): ClipFrame | null {
		if (!this.M3U8Info) {
			throw new Error("M3U8Info is not initialized");
		}

		const segment = this.findSegmentByTime(time);
		if (!segment) {
			throw new Error(
				`Segment is not found: ${time}，totalDuration: ${this.M3U8Info?.totalDuration}`,
			);
		}

		const clips = this.segmentCache.get(segment._index);
		if (!clips) {
			return null;
		}
		return this.findFrameByTime(clips, time);
	}

	// 根据时间获取分段
	public findSegmentByTime(time: number): SegmentExt | null {
		if (!this.M3U8Info) {
			throw new Error("M3U8Info is not initialized");
		}
		for (const segment of this.M3U8Info.segments) {
			if (time >= segment._startTime && time < segment._endTime) {
				return segment;
			}
		}
		return null;
	}

	// 清除缓存
	public clear() {
		this.M3U8Info = null;
		this.segmentCache.clear();
		this.clipingPromise.clear();
	}

	// 根据 URL 生成分段截图
	private async clipsSegment(
		segment: SegmentExt,
	): Promise<SegmentClips | null> {
		const startTime = performance.now();

		try {
			const processedFrames = await this.processStreamingSegment({
				url: segment._uri,
				nbSamples: 1,
				maxWidth: this.options.maxWidth,
				maxHeight: this.options.maxHeight,
			});

			if (!processedFrames.length) {
				console.warn("No video frames extracted");
				return null;
			}

			const endTime = performance.now();
			const totalTime = endTime - startTime;

			const segmentClips: SegmentClips = {
				frames: processedFrames,
				count: processedFrames.length,
				segment: segment,
				times: {
					total: totalTime,
				},
			};

			// console.log(`分段截图完成
			// 	耗时：${segmentClips.times.total}ms
			// 	分片 URL：${segmentClips.segment._uri}
			// 	分片索引：${segmentClips.segment._index}
			// 	分片截图数量：${segmentClips.frames.length}
			// 	分片时长：${segmentClips.segment._duration}s
			// 	分片开始时间：${segmentClips.segment._startTime}s
			// 	分片结束时间：${segmentClips.segment._endTime}s
			// 	`);

			return segmentClips;
		} catch (error) {
			console.error("Error processing segment:", error);
			return null;
		}
	}

	// 根据 time 获取帧
	private findFrameByTime(
		segmentClips: SegmentClips,
		time: number,
	): ClipFrame | null {
		return (
			segmentClips.frames.find(
				(frame) => segmentClips.segment._startTime + frame.timestamp >= time,
			) ??
			segmentClips.frames[0] ??
			null
		);
	}
}
