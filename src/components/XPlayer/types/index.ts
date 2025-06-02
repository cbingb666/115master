import type { AVPlayerOptions } from "@libmedia/avplayer";
import type { HlsConfig } from "hls.js";
import type { Ref } from "vue";

/**
 * 缩略图帧
 */
export type ThumbnailFrame =
	| {
			// 缩略图
			img: ImageBitmap;
			// 请求时间
			seekTime: number;
			// 经过模糊处理的时间
			seekBlurTime: number;
			// 帧实际时间
			frameTime: number;
			// 消耗时间
			consumedTime: number;
	  }
	| undefined;

/**
 * 缩略图请求
 */
export type ThumbnailRequest = ({
	type,
	time,
	isLast,
}: {
	// 类型
	type: "Cache" | "Must";
	// 时间
	time: number;
	// 是否最后
	isLast: boolean;
}) => Promise<ThumbnailFrame>;

/**
 * 视频源扩展名
 */
export const VideoSourceExtension = {
	mp4: "mp4",
	m3u8: "m3u8",
	m2ts: "m2ts",
	ts: "ts",
	flv: "flv",
	avi: "avi",
	mkv: "mkv",
	rmvb: "rmvb",
	mov: "mov",
	webm: "webm",
	iso: "iso",
	unknown: "unknown",
};

/**
 * 视频源
 */
export interface VideoSource {
	// 名称
	name: string;
	// 地址
	url: string;
	// 海报
	poster?: string;
	// 类型
	type: "auto" | "hls"; // 明确定义支持的类型
	// 扩展名
	extension:
		| string
		| (typeof VideoSourceExtension)[keyof typeof VideoSourceExtension];
	// 质量
	quality: number;
	// 显示的画质值（可选）
	displayQuality?: string | number;
	// hls 配置
	hlsConfig?: {
		// 自动开始加载
		autoStartLoad?: boolean;
		// 开始位置
		startPosition?: number;
		// 调试
		debug?: boolean;
		// 其他配置
		[key: string]: unknown;
	};
}

// 字幕
export interface Subtitle {
	// 字幕 id
	id: string;
	// 字幕 url
	url: string;
	// 字幕名称
	label: string;
	// 字幕语言
	srclang: string;
	// 字幕类型
	kind: "subtitles" | "captions";
	// 字幕默认
	default?: boolean;
	// 字幕来源
	source?: string;
}

/**
 * 播放器属性
 */
export type XPlayerProps = {
	// 视频源
	sources: Ref<VideoSource[]>;
	// 显示播放列表
	showPlaylist: boolean;
	// 音量
	volume: number;
	// 静音
	muted: boolean;
	// 播放速率 (0.1-15)
	playbackRate: number;
	// 字幕
	subtitles: Ref<Subtitle[] | null>;
	// 字幕准备就绪
	subtitlesReady: Ref<boolean>;
	// 字幕加载中
	subtitlesLoading: Ref<boolean>;
	// 上次播放时间
	lastTime?: number;
	// 自动缓冲缩略图
	autoLoadThumbnails: boolean;
	// 自动播放
	autoPlay: boolean;
	// 禁用HDR
	disabledHDR: boolean;
	// 缩略图采样间隔
	thumbnailsSamplingInterval: number;
	// hls 配置
	hlsConfig?: Partial<HlsConfig>;
	// avPlayer 配置
	avPlayerConfig?: Partial<AVPlayerOptions>;
	// 缩略图请求
	onThumbnailRequest?: ThumbnailRequest;
	// 字幕改变
	onSubtitleChange?: (subtitle: Subtitle | null) => void;
	// 播放器可播放
	onCanplay?: () => void;
	// 更新当前时间
	onTimeupdate?: (time: number) => void;
	// 跳转中
	onSeeking?: (time: number) => void;
	// 跳转结束
	onSeeked?: (time: number) => void;
	// 空闲
	onIdled?: () => void;
};

export type XPlayerEmit = {
	// 播放列表
	"update:showPlaylist": [boolean];
	// 音量
	"update:volume": [number];
	// 静音
	"update:muted": [boolean];
	// 播放速率
	"update:playbackRate": [number];
	// 自动缓冲缩略图
	"update:autoLoadThumbnails": [boolean];
	// 禁用HDR
	"update:disabledHDR": [boolean];
	// 缩略图采样间隔
	"update:thumbnailsSamplingInterval": [number];
};
