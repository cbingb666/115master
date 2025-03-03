// @ts-ignore
import MP4Box, { DataStream } from "mp4box";
import Mux from "mux.js";

// 视频帧
export type ClipFrame = {
	// 图片 ImageBitMap
	img: ImageBitmap;
	// 帧时长
	duration: number | null;
	// 样本数量
	timestamp: number;
};

// MP4 样本类型定义
export type MP4Sample = {
	cts: number;
	dts: number;
	duration: number;
	is_sync: boolean;
	timescale: number;
	data: Uint8Array;
	description: Uint8Array;
	description_offset: number;
	description_length: number;
	number: number;
	track_id: number;
	size: number;
};

export type ClipperOptions = {
	// 缩略图宽度
	maxWidth: number;
	// 缩略图高度
	maxHeight: number;
};

/**
 * 视频缩略图生成器核心
 * @link https://github.com/videojs/mux.js
 * @link https://github.com/gpac/mp4box.js
 */
export class ClipperCore {
	constructor(protected options: ClipperOptions) {}

	// 处理单个片段
	public async processSegment({
		buffer,
		nbSamples,
		maxWidth,
		maxHeight,
	}: {
		buffer: ArrayBuffer;
		nbSamples: number;
		maxWidth: number;
		maxHeight: number;
	}): Promise<ClipFrame[]> {
		const frames: ClipFrame[] = [];
		// @ts-ignore
		const mp4boxfile = MP4Box.createFile();

		return new Promise((resolve, reject) => {
			let videoDecoder: VideoDecoder | null = null;
			// biome-ignore lint/suspicious/noExplicitAny: <unknow>
			let videoTrack: any | null = null;
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
						nbSamples,
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
							});
							videoFrame.close();
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
			mp4boxfile.onSamples = (
				trackId: number,
				_: unknown,
				samples: MP4Sample[],
			) => {
				if (videoTrack?.id === trackId) {
					mp4boxfile.stop();

					// 解码选中的样本
					for (let i = 0; i < samples.length; i++) {
						const sample = samples[i];
						const isKeyFrame = sample.is_sync;
						const chunk = new EncodedVideoChunk({
							type: isKeyFrame ? "key" : "delta",
							timestamp: (sample.cts * 10e6) / videoTrack.timescale,
							duration: (sample.duration * 10e6) / videoTrack.timescale,
							data: sample.data,
						});

						videoDecoder?.decode(chunk);
					}
				}

				videoDecoder
					?.flush()
					.then(() => {
						resolve(frames);
					})
					.catch(reject);
			};

			try {
				transmuxer.push(new Uint8Array(buffer));
				transmuxer.flush();
				mp4boxfile.flush();
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
				// @ts-ignore
				const stream = new DataStream(buffer, 0, DataStream.BIG_ENDIAN);
				box.write(stream);
				return new Uint8Array(stream.buffer, 8, stream.position - 8);
			}
		} catch (error) {
			console.error("Error in getExtradata:", error);
		}
		return null;
	}

	// 计算缩略图大小
	private calcClipSize(
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

	// 根获取 ArrayBuffer
	fetchBuffer(url: string): Promise<ArrayBuffer> {
		return fetch(url).then((response) => response.arrayBuffer());
	}
}
