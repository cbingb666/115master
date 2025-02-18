export interface VideoSource {
	// 名称
	name: string;
	// 地址
	url: string;
	// 海报
	poster?: string;
	// 类型
	type: "auto" | "hls" | "mp4"; // 明确定义支持的类型
	// 质量
	quality: number;
	// 显示的画质值（可选）
	displayQuality?: string | number;
	// 画质标签（可选）
	label?: string;
	isHLS?: boolean;
	hlsConfig?: {
		autoStartLoad?: boolean;
		startPosition?: number;
		debug?: boolean;
		[key: string]: unknown;
	};
}

export interface Subtitle {
	url: string;
	label: string;
	srclang: string;
	kind: "subtitles" | "captions";
	default?: boolean;
}
