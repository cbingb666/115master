import type Stats from "@libmedia/avpipeline/struct/stats";
import type AVPlayer from "@libmedia/avplayer";
import type { AVPlayerOptions } from "@libmedia/avplayer";
import { AVCodecID } from "@libmedia/avutil/codec";
import type AVCodecParameters from "@libmedia/avutil/struct/avcodecparameters";
import type { Rational } from "@libmedia/avutil/struct/rational";
import type { Data } from "@libmedia/common/types/type";
import { useDebounceFn, useElementSize, useIntervalFn } from "@vueuse/core";
import ee from "event-emitter";
import { get } from "lodash";
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { CDN_BASE_URL } from "../../../../constants";
import { loadESM } from "../../../../utils/loadESM";
import type { PlayerContext } from "../usePlayerProvide";
import { type PlayerCoreMethods, PlayerCoreType } from "./types";
import { usePlayerCoreState } from "./usePlayerCoreState";

// 获取 wasm 参数
type GetWasmArgs = Parameters<NonNullable<AVPlayerOptions["getWasm"]>>;

// 流
type Stream = {
	// 媒体类型
	mediaType: string;
	// 编码器参数
	codecparProxy: AVCodecParameters;
	// 索引
	index: number;
	// 流 id
	id: number;
	// 编码器参数
	codecpar: pointer<AVCodecParameters>;
	// 帧数
	nbFrames: int64;
	// 元数据
	metadata: Data;
	// 时长
	duration: int64;
	// 开始时间
	startTime: int64;
	// 显示方式
	disposition: int32;
	// 时间基
	timeBase: Rational;
};

// 资源 CDN 地址
const CDN_URL_WASM = `${CDN_BASE_URL}/gh/cbingb666/libmedia@latest/dist`;

// 默认配置
export const DEFAULT_OPTIONS: Partial<AVPlayerOptions> = {
	// 是否为直播
	isLive: false,
	// 是否启用硬件加速
	enableHardware: true,
	// 是否启用 WebCodecs
	enableWebCodecs: true,
	// 是否启用 WebGPU
	enableWebGPU: true,
	// 是否启用 worker
	enableWorker: true,
	// 缓冲时间
	preLoadTime: 60,
	// check mse
	checkUseMES: () => {
		return false;
	},
};

// 收集统计信息
export const PICK_STATS_KEYS: (keyof Stats)[] = [
	// 音频编码器
	"audiocodec",
	// 视频编码器
	"videocodec",
	// 音频当前时间
	"audioCurrentTime",
	// 视频当前时间
	"videoCurrentTime",
	// 宽度
	"width",
	// 高度
	"height",
	// 通道
	"channels",
	// 采样率
	"sampleRate",
	// 带宽
	"bandwidth",
	// 音频比特率
	"audioBitrate",
	// 视频比特率
	"videoBitrate",
	// 音频包队列长度
	"audioPacketQueueLength",
	// 视频包队列长度
	"videoPacketQueueLength",
	// 视频编码帧率
	"videoEncodeFramerate",
	// 视频解码帧率
	"videoDecodeFramerate",
	// 视频渲染帧率
	"videoRenderFramerate",
	// 关键帧间隔
	"keyFrameInterval",
	// 音频编码帧率
	"audioEncodeFramerate",
	// 音频解码帧率
	"audioDecodeFramerate",
	// 音频渲染帧率
	"audioRenderFramerate",
	// 音频帧解码间隔最大值
	"audioFrameDecodeIntervalMax",
	// 音频帧渲染间隔最大值
	"audioFrameRenderIntervalMax",
	// 视频帧解码间隔最大值
	"videoFrameDecodeIntervalMax",
	// 视频帧渲染间隔最大值
	"videoFrameRenderIntervalMax",
	// 抖动
	"jitter",
	// 音频卡顿次数
	"audioStutter",
	// 视频卡顿次数
	"videoStutter",
];

// 添加构造函数类型定义
type AVPlayerConstructor = new (options: AVPlayerOptions) => AVPlayer;

// 获取 wasm 地址
const getWasmUrl = (...args: GetWasmArgs) => {
	const [type, codecId, mediaType] = args;
	const DECODE_BASE_URL = `${CDN_URL_WASM}/decode`;
	const RESAMPLE_BASE_URL = `${CDN_URL_WASM}/resample`;
	const STRETCHPITCH_BASE_URL = `${CDN_URL_WASM}/stretchpitch`;

	switch (type) {
		case "decoder":
			// PCM
			if (codecId && codecId >= 65536 && codecId <= 65572) {
				return `${DECODE_BASE_URL}/pcm-simd.wasm`;
			}
			switch (codecId) {
				// -- 视频解码器 --
				// H264
				case AVCodecID.AV_CODEC_ID_H264:
					return `${DECODE_BASE_URL}/h264-simd.wasm`;
				// HEVC
				case AVCodecID.AV_CODEC_ID_HEVC:
					return `${DECODE_BASE_URL}/hevc-simd.wasm`;
				// MPEG4
				case AVCodecID.AV_CODEC_ID_MPEG4:
					return `${DECODE_BASE_URL}/mpeg4-simd.wasm`;
				// VVC
				case AVCodecID.AV_CODEC_ID_VVC:
					return `${DECODE_BASE_URL}/vvc-simd.wasm`;
				// AV1
				case AVCodecID.AV_CODEC_ID_AV1:
					return `${DECODE_BASE_URL}/av1-simd.wasm`;
				// VP8
				case AVCodecID.AV_CODEC_ID_VP8:
					return `${DECODE_BASE_URL}/vp8-simd.wasm`;
				// VP9
				case AVCodecID.AV_CODEC_ID_VP9:
					return `${DECODE_BASE_URL}/vp9-simd.wasm`;
				// THEORA
				case AVCodecID.AV_CODEC_ID_THEORA:
					return `${DECODE_BASE_URL}/theora-simd.wasm`;
				// MPEG1/2
				case AVCodecID.AV_CODEC_ID_MPEG2VIDEO:
					return `${DECODE_BASE_URL}/mpeg2video-simd.wasm`;

				// -- 音频解码器 --
				// AAC
				case AVCodecID.AV_CODEC_ID_AAC:
					return `${DECODE_BASE_URL}/aac-simd.wasm`;
				// MP3
				case AVCodecID.AV_CODEC_ID_MP3:
					return `${DECODE_BASE_URL}/mp3-simd.wasm`;
				// OPUS
				case AVCodecID.AV_CODEC_ID_OPUS:
					return `${DECODE_BASE_URL}/opus-simd.wasm`;
				// FLAC
				case AVCodecID.AV_CODEC_ID_FLAC:
					return `${DECODE_BASE_URL}/flac-simd.wasm`;
				// SPEEX
				case AVCodecID.AV_CODEC_ID_SPEEX:
					return `${DECODE_BASE_URL}/speex-simd.wasm`;
				// VORBIS
				case AVCodecID.AV_CODEC_ID_VORBIS:
					return `${DECODE_BASE_URL}/vorbis-simd.wasm`;
				// AC3
				case AVCodecID.AV_CODEC_ID_AC3:
					return `${DECODE_BASE_URL}/ac3-simd.wasm`;
				// EAC3
				case AVCodecID.AV_CODEC_ID_EAC3:
					return `${DECODE_BASE_URL}/eac3-simd.wasm`;
				// DTS (很多会出现部分声音缺失)
				case AVCodecID.AV_CODEC_ID_DTS:
					return `${DECODE_BASE_URL}/dca-simd.wasm`;
				default:
					return new Error(
						`Unsupported decoder: ${type} ${codecId} ${mediaType}`,
					);
			}
		case "resampler":
			return `${RESAMPLE_BASE_URL}/resample-simd.wasm`;
		case "stretchpitcher":
			return `${STRETCHPITCH_BASE_URL}/stretchpitch-simd.wasm`;
		default:
			return new Error(`Unsupported wasm: ${type} ${codecId} ${mediaType}`);
	}
};

// 收集不支持的 wasm
const collectUnsupportWasm = (
	collect: Array<GetWasmArgs>,
	getWasmFn: typeof getWasmUrl,
) => {
	return (...args: GetWasmArgs) => {
		const result = getWasmFn(...args);
		if (result instanceof Error) {
			collect.push(args);
			return "";
		}
		return result;
	};
};

/**
 * 使用 AvPlayerCore
 */
export const useAvPlayerCore = (ctx: PlayerContext) => {
	// 是否正在跳转
	let seeking = false;
	// 播放器引用
	const playerRef = shallowRef<AVPlayer | null>(null);
	// 容器引用
	const containerRef = shallowRef<HTMLDivElement | null>(null);
	// 状态
	const state = usePlayerCoreState();
	// 统计信息
	const stats = ref<Stats | undefined>();
	// 不支持的 wasm
	const unsupportWasm = shallowRef<GetWasmArgs[]>([]);
	// 流
	const streams = ref<Stream[]>([]);
	// 音频流 id
	const audioStreamId = ref<number | null>(null);
	// 视频流 id
	const videoStreamId = ref<number | null>(null);
	// 字幕流 id
	const subtitleStreamId = ref<number | null>(null);
	// 音频流
	const audioStreams = computed(() => {
		return streams.value.filter((stream) => stream.mediaType === "Audio");
	});
	// 视频流
	const videoStreams = computed(() => {
		return streams.value.filter((stream) => stream.mediaType === "Video");
	});
	// 当前视频流
	const currentVideoStream = computed(() => {
		return videoStreams.value.find(
			(stream) => stream.id === videoStreamId.value,
		);
	});
	// 事件发射器
	const customEmitter = ee();
	// 是否第一次播放
	const isFirstPlay = ref(true);
	// 上次播放时间
	const lastTime = ref<number | null>(null);
	// 检查 player
	const checkPlayer = () => {
		if (!playerRef.value) {
			throw new Error("playerRef is not found");
		}
		return playerRef.value;
	};
	// 监听当前视频流
	watch(currentVideoStream, (stream) => {
		if (stream) {
			state.videoWidth.value = stream.codecparProxy.width;
			state.videoHeight.value = stream.codecparProxy.height;
		}
	});

	// 收集统计信息
	const { pause: pauseCollectStats, resume: resumeCollectStats } =
		useIntervalFn(
			() => {
				const statsKeys = PICK_STATS_KEYS;
				const _stats = playerRef.value?.getStats();

				if (!_stats) {
					return;
				}
				stats.value = Object.fromEntries(
					statsKeys.map((key) => [key, get(_stats, key)]),
				) as unknown as Stats;
			},
			1000,
			{
				immediate: false,
			},
		);

	// 检查流是否支持
	const isSupportStream = (stream: Stream) => {
		return !unsupportWasm.value.find(
			([type, codecId]) =>
				type === "decoder" && codecId === stream.codecparProxy.codecId,
		);
	};

	// 获取首选音频流
	const getPreferredAudioStream = (streams: Stream[]) => {
		return streams.find((stream) => {
			return (
				stream.mediaType === "Audio" &&
				stream.codecparProxy.chLayout.nbChannels <= 8 &&
				stream.metadata.language === "eng"
			);
		});
	};

	// 方法
	const methods: PlayerCoreMethods = {
		init: async (container) => {
			try {
				const AVPlayer = await loadESM<AVPlayerConstructor>({
					pkgName: "@libmedia-beta/avplayer",
					path: "dist/esm/avplayer.js",
					varName: "AVPlayer",
				});
				const player = new AVPlayer({
					...DEFAULT_OPTIONS,
					...ctx.rootProps.avPlayerConfig,
					container,
					getWasm: collectUnsupportWasm(unsupportWasm.value, getWasmUrl),
				});

				containerRef.value = container;
				playerRef.value = player;

				playerRef.value?.on("playing", () => {
					state.paused.value = false;
				});
				playerRef.value?.on("paused", () => {
					state.paused.value = true;
				});
				playerRef.value?.on("loaded", () => {
					state.isLoading.value = false;
					state.loaded.value = true;
				});
				playerRef.value?.on("error", (error) => {
					console.error(error);
				});
				playerRef.value?.on("seeking", () => {
					state.isLoading.value = true;
				});
				playerRef.value?.on("seeked", () => {
					state.isLoading.value = false;
				});
				playerRef.value?.on("timeout", () => {
					console.warn("avplayer timeout");
				});
				playerRef.value?.on("time", (pts) => {
					if (seeking) {
						return;
					}
					state.currentTime.value = Number(pts) / 1000;
				});
			} catch (error) {
				console.error("初始化 AVPlayer 失败:", error);
				state.loadError.value = error as Error;
			}
		},
		load: async (url, _lastTime) => {
			lastTime.value = _lastTime ?? null;
			const player = checkPlayer();
			await player
				.load(url)
				.then(async () => {
					streams.value = await player.getStreams();

					console.log(videoStreams.value);

					// 设置首选音频流
					const preferredAudioStream = getPreferredAudioStream(streams.value);
					if (preferredAudioStream) {
						await player.selectAudio(preferredAudioStream.id);
						audioStreamId.value = preferredAudioStream.id;
					}

					// 恢复收集统计信息
					resumeCollectStats();

					// 设置音量
					methods.setVolume(state.volume.value);

					// 设置静音
					methods.setMute(state.muted.value);

					// 设置播放速率
					methods.setPlaybackRate(state.playbackRate.value);

					// 自动播放
					if (state.autoPlay.value) {
						await methods
							.play()
							.then(async () => {
								state.canplay.value = true;
								customEmitter.emit("canplay");

								state.isSuspended.value =
									!state.muted.value && player.isSuspended();
							})
							.catch((error) => {
								console.error("播放失败", error);
								state.loadError.value = error;
							});
					} else {
						state.canplay.value = true;
						customEmitter.emit("canplay");
					}
				})
				.catch((error) => {
					state.loadError.value = error;
					pauseCollectStats();
					throw error;
				});
			// 获取视频时长
			state.duration.value = Number(player.getDuration()) / 1000;
			// 获取容器尺寸
			const { width, height } = useElementSize(containerRef.value);
			// 防抖调整容器尺寸
			const resizeDebounced = useDebounceFn(() => {
				if (playerRef.value) {
					playerRef.value.resize(width.value, height.value);
				}
			}, 30);
			watch([width, height], resizeDebounced);
		},
		getRenderElement: () => {
			return (
				containerRef.value?.querySelector("canvas") ??
				containerRef.value?.querySelector("video") ??
				null
			);
		},
		play: () => {
			const player = checkPlayer();
			state.paused.value = false;
			return player
				.play({
					subtitle: false,
				})
				.then(async () => {
					if (isFirstPlay.value) {
						// 回跳到上次播放时间, 必须在播放后，否则部分高画质视频会无法播放
						await methods.seek(lastTime.value ?? state.currentTime.value);
						isFirstPlay.value = false;
					}

					videoStreamId.value = player.getSelectedVideoStreamId();
					subtitleStreamId.value = player.getSelectedSubtitleStreamId();
				});
		},
		pause: () => {
			const player = checkPlayer();
			state.paused.value = true;
			return player.pause();
		},
		togglePlay: () => {
			if (state.paused.value) {
				return methods.play();
			}
			return methods.pause();
		},
		setPlaybackRate: (rate) => {
			const player = checkPlayer();
			state.playbackRate.value = rate;
			player.setPlaybackRate(Math.min(rate, 2));
		},
		setVolume: (volume) => {
			const player = checkPlayer();
			state.volume.value = volume;
			player.setVolume((volume / 100) * 3);
		},
		setMute: (muted) => {
			const player = checkPlayer();
			state.muted.value = muted;
			player.setVolume(muted ? 0 : 100);
			if (!muted) {
				methods.resumeSuspended();
			}
		},
		toggleMute: () => {
			methods.setMute(!state.muted.value);
		},
		resumeSuspended: async () => {
			const player = checkPlayer();
			await player.resume();
			state.isSuspended.value = false;
		},
		setAutoPlay: (autoPlay) => {
			state.autoPlay.value = autoPlay;
		},
		seek: async (time) => {
			seeking = true;
			const player = checkPlayer();
			state.currentTime.value = time;
			await player.seek(BigInt(Math.floor(time * 1000)));
			await nextTick();
			seeking = false;
		},
		on: (event, callback) => {
			watch(
				playerRef,
				(player) => {
					if (player) {
						switch (event) {
							case "canplay":
								customEmitter.on("canplay", callback);
								break;
							case "timeupdate":
								player.on("time", () => {
									callback(state.currentTime.value);
								});
								break;
							case "seeking":
								player.on("seeking", () => {
									callback(state.currentTime.value);
								});
								break;
							case "seeked":
								player.on("seeked", () => {
									callback(state.currentTime.value);
								});
								break;
							default:
								player.on(event, callback);
						}
					}
				},
				{
					once: true,
				},
			);
		},

		// 销毁
		destroy: async () => {
			// 销毁事件监听
			destoryListeners();
			// 暂停收集统计信息
			pauseCollectStats();
			// 重置状态
			state.reset();
			// 销毁播放器
			if (playerRef.value) {
				playerRef.value.pause();
				await playerRef.value.destroy();
			}
			playerRef.value = null;
			return Promise.resolve();
		},
	};

	// 销毁事件监听
	const destoryListeners = () => {
		for (const [key, events] of Object.entries(
			playerRef.value?.listeners ?? {},
		)) {
			for (const event of events) {
				playerRef.value?.off(key, event.fn);
			}
		}
	};

	const setAudioStream = async (id: number) => {
		const player = checkPlayer();
		audioStreamId.value = id;
		await player.selectAudio(id);
	};

	return {
		...state,
		...methods,
		stats,
		streams,
		audioStreams,
		videoStreams,
		audioStreamId,
		videoStreamId,
		subtitleStreamId,
		isSupportStream,
		setAudioStream,
		type: PlayerCoreType.AvPlayer as const,
	};
};
