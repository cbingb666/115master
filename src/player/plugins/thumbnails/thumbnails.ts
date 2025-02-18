import throttle from "lodash/throttle";
import { PlayerPlugin } from "..";
import type { Player } from "../..";
import { AsyncQueue } from "../../../utils/asyncQueue";
import { type ClipFrame, M3U8Clipper } from "../../../utils/clip";
import "./thumbnails.css";
import { calculateFitSize } from "./utils";

type TumbnailsState = {
	intervalSeconds?: number;
	samplesPerSegment?: number;
	maxWidth: number;
	maxHeight: number;
};

type CachedFrame = {
	frame: ClipFrame;
	segmentIndex: number;
};

type SegmentFrame = {
	frames: ClipFrame[];
	isLoaded: boolean;
	isProcessing: boolean;
	isAutoPreload: boolean;
};

export class Tumbnails extends PlayerPlugin<TumbnailsState> {
	static pluginName = "tumbnails";
	private clipper: M3U8Clipper | undefined;
	thumbnalCount = 0;
	private frameCache: Map<number, CachedFrame> = new Map(); // 按秒级时间索引存储帧
	private segmentFrame: Map<number, SegmentFrame> = new Map(); // 按秒级时间索引存储片段g
	private videoUrl?: string;
	private segments?: { uri: string; duration: number }[];
	private totalDuration?: number;
	private throttledMove: ((position: number) => void) | undefined;
	private thumbnailWidth = 0;
	private thumbnailHeight = 0;
	private previewCanvas: HTMLCanvasElement | undefined;
	private previewCtx: CanvasRenderingContext2D | undefined;
	private lastPosition = 0;
	private isManualLoading = false; // 添加标记是否有手动加载的状态
	private autoPreloadTimeout: number | null = null; // 添加这个属性来跟踪 timeout
	private loadQueue: AsyncQueue<void>;
	private readonly TASK_GROUP_AUTO_PRELOAD = "TASK_GROUP_AUTO_PRELOAD";

	constructor(player: Player) {
		super(Tumbnails.pluginName, player, {
			intervalSeconds: 60,
			samplesPerSegment: 10,
			maxWidth: 540,
			maxHeight: 304,
		});
		this.loadQueue = new AsyncQueue(2, 100); // 最大并发2，队列长度100
	}

	destroy(): void {
		this.frameCache.clear();
		// @ts-ignore
		this.throttledMove?.cancel();
		if (this.autoPreloadTimeout) {
			clearTimeout(this.autoPreloadTimeout);
		}
		this.loadQueue.clear();
		window.removeEventListener("resize", this.handleResize.bind(this));
	}

	async mount() {
		const options = this.player.options;
		const optionsVideo = options.video;
		if (!optionsVideo) {
			throw new Error("options video is not defined");
		}
		const optionsVideothumbnails = optionsVideo.thumbnails;
		if (!optionsVideothumbnails) {
			throw new Error("options video thumbnails is not defined");
		}

		const qualitys = optionsVideo.quality;
		if (!qualitys || qualitys.length === 0) {
			throw new Error("qualitys is not defined or qualitys is empty");
		}

		console.log("qualitys", qualitys);
		const url = qualitys[qualitys.length - 1].url;
		this.videoUrl = url;
		this.clipper = new M3U8Clipper();
		this.previewEleSetCanvas(this.player.controller.thumbnails.container);

		await this.initSegments(url);

		this.player.controller.thumbnails.move = this.move.bind(this);
		this.player.controller.thumbnails.resize = this.resize.bind(this);
		this.player.on("loadedmetadata", this.onLoadedMetadata.bind(this));
		window.addEventListener("resize", this.handleResize.bind(this));
		this.throttledMove = throttle(this.handleMove.bind(this), 250, {
			leading: true,
			trailing: true,
		});
	}

	onStateChange() {
		this.thumbnailWidth = 0;
		this.thumbnailHeight = 0;
		this.thumbnalCount = 0;
		this.frameCache.clear();
		this.segmentFrame.clear();
		this.mount();
	}

	onLoadedMetadata() {
		this.handleResize();
		this.autoPreload(30, 2);
	}

	autoPreload(num = 10, concurrency = 2) {
		if (!this.segments || this.isManualLoading) {
			return;
		}

		const loadedCount = Array.from(this.segmentFrame.values()).filter(
			(segment) => segment.isLoaded && segment.isAutoPreload,
		).length;

		if (loadedCount >= num) {
			return;
		}

		const unloadedIndices = this.getUnloadedIndices();
		if (unloadedIndices.length === 0) return;

		const remainingToLoad = num - loadedCount;
		const shuffledIndices = unloadedIndices.sort(() => Math.random() - 0.5);
		const selectedIndices = shuffledIndices.slice(0, remainingToLoad);

		selectedIndices.forEach((index) => {
			this.segmentFrame.set(index, {
				frames: [],
				isLoaded: false,
				isProcessing: true,
				isAutoPreload: true,
			});

			this.loadQueue
				.add(() => this.loadThumbnailAtIndex(index, true), {
					priority: 0,
					group: this.TASK_GROUP_AUTO_PRELOAD,
					id: `thumbnail-${index}`,
					retries: 2,
					timeout: 10000,
				})
				.catch((error: Error) => {
					console.error("Failed to load thumbnail:", error);
					const segment = this.segmentFrame.get(index);
					if (segment) {
						segment.isProcessing = false;
					}
				});
		});

		// if (this.loadQueue.length === 0 && !this.isManualLoading) {
		//     setTimeout(() => this.autoPreload(num, concurrency), 1000);
		// }
	}

	private handleResize() {
		const { width, height } = calculateFitSize(
			this.state.maxWidth,
			this.state.maxHeight,
			this.player.video.videoWidth,
			this.player.video.videoHeight,
		);
		this.thumbnailWidth = width;
		this.thumbnailHeight = height;
		if (this.previewCanvas) {
			this.previewCanvas.width = this.thumbnailWidth;
			this.previewCanvas.height = this.thumbnailHeight;
		}
		this.resize(
			this.thumbnailWidth,
			this.thumbnailHeight,
			this.player.template.barWrap.offsetWidth,
		);
	}

	previewEleSetCanvas(div: HTMLElement) {
		if (!div.parentNode) {
			throw new Error("div.parentNode is not defined");
		}

		const canvas = document.createElement("canvas");

		// 复制 div 元素的所有属性到 canvas 元素
		for (let i = 0; i < div.attributes.length; i++) {
			const attr = div.attributes[i];
			canvas.setAttribute(attr.name, attr.value);
		}

		canvas.style.backgroundImage = "none";
		canvas.style.backgroundPosition = "0 0";

		// 替换 div 元素为 canvas 元素
		div.parentNode.replaceChild(canvas, div);

		// 你可以在这里初始化你的 canvas 绘图
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error("ctx is not defined");
		}
		this.previewCanvas = canvas;
		this.previewCtx = ctx;
		this.player.controller.thumbnails.container = canvas;
		return {
			canvas,
			ctx,
		};
	}

	private async initSegments(url: string) {
		if (!this.clipper) {
			throw new Error("clipper is not defined");
		}
		try {
			const { segments, totalDuration } =
				await this.clipper.getM3U8InfoByUrl(url);
			this.segments = segments;
			this.totalDuration = totalDuration;
			this.thumbnalCount = segments.length;
		} catch (error) {
			console.error("Failed to init segments:", error);
		}
	}

	private getSegmentIndexByTime(time: number): number {
		if (!this.segments || !this.totalDuration) {
			return -1;
		}

		let accumulatedDuration = 0;
		for (let i = 0; i < this.segments.length; i++) {
			accumulatedDuration += this.segments[i].duration;
			if (accumulatedDuration >= time) {
				return i;
			}
		}
		return this.segments.length - 1;
	}

	private async loadThumbnailAtIndex(index: number, isAutoPreload = false) {
		if (!this.clipper) {
			throw new Error("clipper is not defined");
		}
		if (!this.videoUrl || !this.segments) {
			throw new Error("videoUrl or segments is not defined");
		}

		try {
			const segment = this.segments[index];
			const segmentStartTime = this.getSegmentStartTime(index);
			const thumbnail = await this.clipper.createSegmentClipsByUrl({
				segmentUrl: segment.uri,
				segmentStartTime: segmentStartTime,
				samplesPerSegment: this.state.samplesPerSegment!,
				maxWidth: this.thumbnailWidth,
				maxHeight: this.thumbnailHeight,
			});

			if (thumbnail) {
				if (!isAutoPreload) {
					this.renderThumbnail(thumbnail.frames[0]);
				}
				this.segmentFrame.set(index, {
					frames: thumbnail.frames,
					isLoaded: true,
					isProcessing: false,
					isAutoPreload: isAutoPreload,
				});
			}
		} catch (error) {
			console.error("Failed to load thumbnail:", error);
		}
	}

	private renderThumbnail(frame: ClipFrame) {
		if (!this.previewCtx) {
			return;
		}
		const aspectRatio = frame.img.width / frame.img.height;
		const frameWidth = this.thumbnailWidth;
		const frameHeight = frameWidth / aspectRatio;
		// 清空画布
		this.previewCtx.clearRect(0, 0, frameWidth, frameHeight);
		this.previewCtx.drawImage(frame.img, 0, 0, frameWidth, frameHeight);
	}

	resize(width: number, height: number, barWrapWidth: number) {
		const thumbnails = this.player.controller.thumbnails;
		if (this.previewCanvas) {
			this.previewCanvas.width = width;
			this.previewCanvas.height = height;
			this.previewCanvas.style.top = `${-height + 2}px`;
		}
		thumbnails.barWidth = barWrapWidth;
	}

	move(position: number) {
		if (position === this.lastPosition) {
			return;
		}
		this.updateBoxPosition(position);
		const direction = position - this.lastPosition; // 计算方向要在更新 lastPosition 之前
		this.lastPosition = position;

		const thumbnails = this.player.controller.thumbnails;

		if (!this.totalDuration) {
			return;
		}

		const currentTime = (position / thumbnails.barWidth) * this.totalDuration;
		const segmentIndex = this.getSegmentIndexByTime(currentTime);

		if (segmentIndex < 0) {
			return;
		}

		// 先从片缓存中查找
		const segmentCache = this.segmentFrame.get(segmentIndex);
		if (segmentCache?.isLoaded) {
			const frame =
				direction > 0
					? segmentCache.frames.find((f) => {
							return f.t >= currentTime;
						})
					: segmentCache.frames.reverse().find((f) => {
							return f.t <= currentTime;
						});

			if (frame) {
				this.renderThumbnail(frame);
				return;
			}
		}

		if (segmentCache?.isProcessing) {
			return;
		}

		// 如果正在等待恢复自动加载，取消等待
		if (this.autoPreloadTimeout) {
			clearTimeout(this.autoPreloadTimeout);
			this.autoPreloadTimeout = null;
		}

		this.throttledMove?.(segmentIndex);
	}

	private handleMove(segmentIndex: number) {
		if (this.autoPreloadTimeout) {
			clearTimeout(this.autoPreloadTimeout);
			this.autoPreloadTimeout = null;
		}

		this.isManualLoading = true;
		this.segmentFrame.set(segmentIndex, {
			frames: [],
			isLoaded: false,
			isProcessing: true,
			isAutoPreload: false,
		});

		// 取消所有自动预加载任务
		this.loadQueue.pause(this.TASK_GROUP_AUTO_PRELOAD);

		// 加载当前请求的缩略图
		this.loadQueue
			.add(() => this.loadThumbnailAtIndex(segmentIndex, false), {
				priority: 1,
				id: `thumbnail-manual-${segmentIndex}`,
				retries: 3,
				timeout: 5000,
			})
			.then(() => {
				this.autoPreloadTimeout = setTimeout(() => {
					this.isManualLoading = false;
					this.loadQueue.resume(this.TASK_GROUP_AUTO_PRELOAD);
				}, 3000);
			})
			.catch((error) => {
				console.error("Failed to load thumbnail:", error);
				const segment = this.segmentFrame.get(segmentIndex);
				if (segment) {
					segment.isProcessing = false;
				}
			});
	}

	private updateBoxPosition(position: number) {
		if (!this.previewCanvas) {
			throw new Error("previewCanvas is not defined");
		}
		const thumbnails = this.player.controller.thumbnails;
		const offset = 10;
		this.previewCanvas.style.transform = `translateX(${Math.min(
			Math.max(position - this.previewCanvas.offsetWidth / 2, -offset),
			thumbnails.barWidth - (this.thumbnailWidth - offset),
		)}px)`;
	}

	private getSegmentStartTime(index: number): number {
		if (!this.segments) {
			return 0;
		}
		let startTime = 0;
		for (let i = 0; i < index; i++) {
			startTime += this.segments[i].duration;
		}
		return startTime;
	}

	private getUnloadedIndices(): number[] {
		if (!this.segments) return [];
		return Array.from({ length: this.segments.length }, (_, i) => i).filter(
			(index) => {
				const segment = this.segmentFrame.get(index);
				return !segment || (!segment.isLoaded && !segment.isProcessing);
			},
		);
	}
}
