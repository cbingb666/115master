import { type Manifest, Parser } from "m3u8-parser";
import MP4Box from "mp4box";
// @ts-ignore
import { DataStream } from "mp4box";
import Mux from "mux.js";
import { AsyncQueue } from "./asyncQueue";

export type M3U8Info = {
	// 视频流信息
	manifest: Manifest;
	// 分片信息
	segments: {
		// 分片 URL
		uri: string;
		// 分片时长
		duration: number;
		// 分片开始时间
		startTime: number;
		// 分片结束时间
		endTime: number;
		// 分片索引
		index: number;
	}[];
	// 视频流总时长
	totalDuration: number;
};

// 视频帧
export type ClipFrame = {
	// 图片 ImageBitMap
	img: ImageBitmap;
	// 帧时长
	duration: number | null;
	// 帧时间戳 (不准确)
	timestamp: number;
	// 帧时间戳 (准确)
	t: number;
};

export type SegmentCacheIndexKey = number;

export type SegmentCacheValue = {
	frames: ClipFrame[];
	count: number;
	times: {
		fetchBuffer: number;
		processSegment: number;
	};
};

export type ClipperOptions = {
	// 缩略图宽度
	maxWidth: number;
	// 缩略图高度
	maxHeight: number;
	// 每个分片生成帧数
	samplesPerSegment: number;
};

export type M3U8ClipperOptions = {
	// 缓存大小
	maxCacheSize: number;
	// 缓存队列大小
	queueSize: number;
	// 并发数
	queueConcurrency: number;
};

export class M3U8Clipper {
	// 缓存分段信息
	segmentCache = new Map<SegmentCacheIndexKey, SegmentCacheValue>();
	// 缓存 M3U8 信息
	M3U8Info: M3U8Info | null = null;
	// 缓存视频帧
	queue = new AsyncQueue<SegmentCacheValue | undefined>(3, 100);
	// 缓存大小
	maxCacheSize: number;
	// 缓存队列大小
	queueSize: number;
	// 并发数
	concurrency: number;

	constructor(options: M3U8ClipperOptions) {
		this.maxCacheSize = options.maxCacheSize;
		this.queueSize = options.queueSize;
		this.concurrency = options.queueConcurrency;

		this.queue = new AsyncQueue<SegmentCacheValue | undefined>(
			options.queueConcurrency,
			options.queueSize,
		);
	}

	// 处理单个片段
	private async processSegment({
		buffer,
		samplesPerSegment,
		maxWidth,
		maxHeight,
	}: {
		buffer: ArrayBuffer;
		samplesPerSegment: number;
		maxWidth: number;
		maxHeight: number;
	}): Promise<ClipFrame[]> {
		const frames: ClipFrame[] = [];
		const mp4boxfile = MP4Box.createFile();

		return new Promise((resolve, reject) => {
			let videoDecoder: VideoDecoder | null = null;
			// biome-ignore lint/suspicious/noExplicitAny: <unknow>
			let videoTrack: any | null = null;
			let countSample = 0;

			// @ts-ignore
			const transmuxer = new Mux.mp4.Transmuxer();

			// ts to mp4
			// biome-ignore lint/suspicious/noExplicitAny: <unknow>
			transmuxer.on("data", (segment: any) => {
				const initSegment = new Uint8Array(segment.initSegment);
				const data = new Uint8Array(segment.data);

				const buffer = new ArrayBuffer(
					initSegment.byteLength + data.byteLength,
				);
				const uint8View = new Uint8Array(buffer);
				uint8View.set(initSegment, 0);
				uint8View.set(data, initSegment.byteLength);

				// @ts-ignore
				buffer.fileStart = 0;
				mp4boxfile.appendBuffer(buffer);
			});

			// 提取帧图像
			// biome-ignore lint/suspicious/noExplicitAny: <unknow>
			mp4boxfile.onReady = (info: any) => {
				videoTrack = info.videoTracks[0];
				if (videoTrack) {
					mp4boxfile.setExtractionOptions(videoTrack.id, "video", {
						nbSamples: samplesPerSegment,
					});

					// 计算缩略图大小
					const { width, height } = this.calcClipSize(
						videoTrack.track_width,
						videoTrack.track_height,
						maxWidth,
						maxHeight,
					);

					videoDecoder = new VideoDecoder({
						output: async (videoFrame) => {
							const img = await createImageBitmap(videoFrame, {
								resizeQuality: "pixelated",
								premultiplyAlpha: "none",
								resizeWidth: width,
								resizeHeight: height,
							});
							frames.push({
								img,
								duration: videoFrame.duration,
								timestamp: videoFrame.timestamp,
								t: 0,
							});
							videoFrame.close();
							countSample++;

							if (countSample >= samplesPerSegment) {
								resolve(frames);
							}
						},
						error: (err) => {
							console.error("videoDecoder error:", err);
							reject(err);
						},
					});

					// 配置解码器
					videoDecoder.configure({
						codec: videoTrack.codec,
						codedWidth: videoTrack.track_width,
						codedHeight: videoTrack.track_height,
						hardwareAcceleration: "prefer-hardware",
						optimizeForLatency: true,
						description: this.getExtradata(mp4boxfile) as Uint8Array,
					});

					mp4boxfile.start();
				}
			};

			// 处理采样
			// biome-ignore lint/suspicious/noExplicitAny: <unknow>
			mp4boxfile.onSamples = (trackId: any, _: any, samples: any) => {
				if (videoTrack?.id === trackId) {
					mp4boxfile.stop();
					for (const sample of samples) {
						const chunk = new EncodedVideoChunk({
							type: sample.is_sync ? "key" : "delta",
							timestamp: sample.cts,
							duration: sample.duration,
							data: sample.data,
						});
						videoDecoder?.decode(chunk);
					}
				}

				if (countSample === samplesPerSegment) {
					resolve(frames);
					videoDecoder?.flush();
				}
			};

			try {
				transmuxer.push(new Uint8Array(buffer));
				transmuxer.flush();
				mp4boxfile.flush();
				// @ts-ignore
				videoDecoder?.flush();
			} catch (error) {
				reject(error);
			}
		});
	}

	// 辅助函数：获取解码器所需的额外数据
	// biome-ignore lint/suspicious/noExplicitAny: <unknow>
	private getExtradata(mp4box: any): Uint8Array | null {
		try {
			const entry = mp4box.moov.traks[0].mdia.minf.stbl.stsd.entries[0];
			const box = entry.avcC ?? entry.hvcC ?? entry.vpcC;

			if (box != null) {
				const buffer = new ArrayBuffer(1024);
				const stream = new DataStream(buffer, 0, DataStream.BIG_ENDIAN);
				box.write(stream);
				return new Uint8Array(stream.buffer, 8, stream.position - 8);
			}
		} catch (error) {
			console.error("Error in getExtradata:", error);
		}
		return null;
	}

	// 根获取 ArrayBuffer
	fetchBuffer(segmentUrl: string): Promise<ArrayBuffer> {
		return fetch(segmentUrl).then((response) => response.arrayBuffer());
	}

	// 计算缩略图大小
	calcClipSize(
		width: number,
		height: number,
		maxWidth: number,
		maxHeight: number,
	) {
		const scale = Math.min(maxWidth / width, maxHeight / height);
		return {
			width: width * scale,
			height: height * scale,
		};
	}

	// 根据 URL 生成分段截图
	public async createSegmentClipsByUrl({
		segmentUrl,
		segmentStartTime = 0,
		samplesPerSegment,
		maxWidth,
		maxHeight,
	}: {
		segmentUrl: string;
		segmentStartTime: number;
	} & ClipperOptions): Promise<SegmentCacheValue | undefined> {
		try {
			const startFetchBuffer = performance.now();
			const buffer = await this.fetchBuffer(segmentUrl);
			const endFetchBuffer = performance.now();

			const startProcessSegment = performance.now();

			const frames = (
				await this.processSegment({
					buffer,
					samplesPerSegment,
					maxWidth: maxWidth,
					maxHeight: maxHeight,
				})
			).map((frame, index) => {
				return {
					...frame,
					t: segmentStartTime + index * frame.duration!,
				};
			});

			const endProcessSegment = performance.now();
			if (!frames.length) {
				console.warn("No video frames extracted");
				return;
			}

			return {
				frames,
				count: frames.length,
				times: {
					fetchBuffer: endFetchBuffer - startFetchBuffer,
					processSegment: endProcessSegment - startProcessSegment,
				},
			};
		} catch (error) {
			console.error("Error creating thumbnail:", error);
			return undefined;
		}
	}

	// 根据 URL 获取带时长的分段信息
	public async getM3U8InfoByUrl(m3u8url: string) {
		const response = await fetch(m3u8url);
		const m3u8Text = await response.text();

		const parser = new Parser();
		parser.push(m3u8Text);
		parser.end();

		const manifest = parser.manifest;
		let startTime = 0;
		const segments: M3U8Info["segments"] = manifest.segments.map(
			(segment, index) => {
				const uri = new URL(segment.uri, m3u8url).href;
				startTime += segment.duration;
				return {
					uri,
					duration: segment.duration,
					startTime,
					endTime: startTime + segment.duration,
					index,
				};
			},
		);

		const totalDuration = segments.reduce(
			(sum, segment) => sum + segment.duration,
			0,
		);

		const M3U8Info: M3U8Info = {
			manifest,
			segments,
			totalDuration,
		};
		this.M3U8Info = M3U8Info;
	}

	// 根据时间获取分段
	private getSegmentByTime(time: number) {
		if (!this.M3U8Info) {
			throw new Error("M3U8Info is not initialized");
		}
		let currentTime = 0;
		for (const segment of this.M3U8Info.segments) {
			if (time >= currentTime && time < currentTime + segment.duration) {
				return segment;
			}
			currentTime += segment.duration;
		}
		return null;
	}

	// 根据时间获取帧
	private findFrameByTime(frames: ClipFrame[], time: number) {
		return frames.find((frame) => {
			return frame.t > time;
		});
	}

	// 根据时间获取帧（缓存）
	public getClipByTimeByCache(time: number) {
		const segment = this.getSegmentByTime(time);
		if (!segment) {
			throw new Error("Segment is not found");
		}
		// 缓存中获取
		const cacheValue = this.segmentCache.get(segment.index);
		if (cacheValue) {
			const frame = this.findFrameByTime(cacheValue.frames, time);
			if (frame) {
				return frame;
			}
			return null;
		}
	}

	// 根据 time 获取缩略图
	public async getClipByTime(time: number, options: ClipperOptions) {
		const segment = this.getSegmentByTime(time);
		if (!segment) {
			throw new Error("Segment is not found");
		}

		// 缓存中没有，则生成
		const clips = await this.queue.add(
			() =>
				this.createSegmentClipsByUrl({
					segmentUrl: segment.uri,
					segmentStartTime: time,
					...options,
				}),
			{
				priority: 1,
				timeout: 5000,
				retries: 3,
			},
		);

		if (!clips) {
			return null;
		}

		// 缓存
		if (clips) {
			this.segmentCache.set(segment.index, clips);
		}

		return this.findFrameByTime(clips.frames, time);
	}

	destroy() {
		this.queue.clear();
		this.segmentCache.clear();
	}
}
