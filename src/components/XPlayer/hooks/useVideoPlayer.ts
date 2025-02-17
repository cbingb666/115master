import { type InjectionKey, type Ref, inject, provide, ref, watch } from "vue";

export interface PlayerState {
	isPlaying: Ref<boolean>;
	isMuted: Ref<boolean>;
	isFullscreen: Ref<boolean>;
	volume: Ref<number>;
	currentTime: Ref<number>;
	duration: Ref<number>;
	buffered: Ref<number>;
	progress: Ref<number>;
	isControlsVisible: Ref<boolean>;
}

export interface PlayerActions {
	togglePlay: () => Promise<void>;
	setVolume: (value: number) => void;
	toggleMute: () => void;
	toggleFullscreen: () => void;
	seekTo: (time: number) => void;
	skip: (seconds: number) => void;
	adjustVolume: (delta: number) => void;
	showControls: () => void;
	hideControls: () => void;
}

export interface PlayerContext {
	state: PlayerState;
	actions: PlayerActions;
}

export const PlayerSymbol: InjectionKey<PlayerContext> = Symbol("VideoPlayer");

export function useVideoPlayer(videoElementRef: Ref<HTMLVideoElement | null>) {
	// 播放器状态
	const isPlaying = ref(false);
	const isMuted = ref(false);
	const isFullscreen = ref(false);
	const volume = ref(100);
	const currentTime = ref(0);
	const duration = ref(0);
	const buffered = ref(0);
	const progress = ref(0);
	const isControlsVisible = ref(true);
	let hideControlsTimer: number | null = null;
	const isHoveringControls = ref(false);

	// 更新播放状态
	const updatePlayingState = () => {
		if (!videoElementRef.value) return;
		isPlaying.value = !videoElementRef.value.paused;
	};

	// 更新进度
	const updateProgress = () => {
		if (!videoElementRef.value) return;
		currentTime.value = videoElementRef.value.currentTime;
		duration.value = videoElementRef.value.duration;
		progress.value = (currentTime.value / duration.value) * 100;
	};

	// 更新缓冲进度
	const updateBuffer = () => {
		if (!videoElementRef.value) return;
		const timeRanges = videoElementRef.value.buffered;
		if (timeRanges.length > 0) {
			buffered.value =
				(timeRanges.end(timeRanges.length - 1) /
					videoElementRef.value.duration) *
				100;
		}
	};

	// 播放控制
	const togglePlay = async () => {
		if (!videoElementRef.value) return;
		try {
			if (videoElementRef.value.paused) {
				await videoElementRef.value.play();
			} else {
				videoElementRef.value.pause();
			}
		} catch (error) {
			console.error("Failed to toggle play state:", error);
		}
	};

	// 音量控制
	const setVolume = (value: number) => {
		if (!videoElementRef.value) return;
		videoElementRef.value.volume = value / 100;
		volume.value = value;
		isMuted.value = value === 0;
	};

	// 静音控制
	const toggleMute = () => {
		if (!videoElementRef.value) return;
		videoElementRef.value.muted = !videoElementRef.value.muted;
		isMuted.value = videoElementRef.value.muted;
		volume.value = videoElementRef.value.muted
			? 0
			: videoElementRef.value.volume * 100;
	};

	// 全屏状态监听
	const handleFullscreenChange = () => {
		isFullscreen.value = !!document.fullscreenElement;
	};

	// 添加全屏变化监听
	document.addEventListener("fullscreenchange", handleFullscreenChange);
	document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
	document.addEventListener("mozfullscreenchange", handleFullscreenChange);
	document.addEventListener("MSFullscreenChange", handleFullscreenChange);

	// 全屏控制
	const toggleFullscreen = async () => {
		try {
			const container = document.querySelector(".x-player");
			if (!container) return;

			if (!document.fullscreenElement) {
				await container.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		} catch (error) {
			console.error("Failed to toggle fullscreen:", error);
		}
	};

	// 跳转到指定时间
	const seekTo = (time: number) => {
		if (!videoElementRef.value) return;
		// 立即更新进度状态，不等待 timeupdate 事件
		currentTime.value = time;
		progress.value = (time / duration.value) * 100;
		// 实际更新视频时间
		videoElementRef.value.currentTime = time;
	};

	// 快进快退
	const skip = (seconds: number) => {
		if (!videoElementRef.value) return;
		const newTime = currentTime.value + seconds;
		const clampedTime = Math.min(Math.max(0, newTime), duration.value);
		seekTo(clampedTime);
	};

	// 调整音量
	const adjustVolume = (delta: number) => {
		if (!videoElementRef.value) return;
		const newVolume = Math.min(Math.max(0, volume.value + delta), 100);
		setVolume(newVolume);
	};

	// 热键处理
	const handleKeydown = (event: KeyboardEvent) => {
		// 忽略输入框的按键事件
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement
		) {
			return;
		}

		switch (event.code) {
			case "Space":
				event.preventDefault();
				togglePlay();
				break;
			case "ArrowLeft":
				event.preventDefault();
				skip(-5);
				break;
			case "ArrowRight":
				event.preventDefault();
				skip(5);
				break;
			case "ArrowUp":
				event.preventDefault();
				adjustVolume(5);
				break;
			case "ArrowDown":
				event.preventDefault();
				adjustVolume(-5);
				break;
		}
	};

	// 添加热键监听
	document.addEventListener("keydown", handleKeydown);

	// 控制栏显示/隐藏控制
	const showControls = () => {
		if (hideControlsTimer) {
			clearTimeout(hideControlsTimer);
			hideControlsTimer = null;
		}
		isControlsVisible.value = true;
	};

	const hideControls = () => {
		if (hideControlsTimer) {
			clearTimeout(hideControlsTimer);
		}
		hideControlsTimer = window.setTimeout(() => {
			isControlsVisible.value = false;
		}, 3000);
	};

	const handleMouseMove = () => {
		showControls();
		hideControls();
	};

	const handleMouseLeave = () => {
		if (!isControlsVisible.value) return;
		hideControls();
	};

	// 设置事件监听
	const setupControlsEventListeners = () => {
		const videoContainer = document.querySelector(".video-container");
		// const controls = document.querySelector(".controls-wrapper");

		if (videoContainer) {
			videoContainer.addEventListener("mousemove", handleMouseMove);
			videoContainer.addEventListener("mouseleave", handleMouseLeave);
		}

		// if (controls) {
		// 	controls.addEventListener("mouseenter", handleControlsMouseEnter);
		// 	controls.addEventListener("mouseleave", handleControlsMouseLeave);
		// }

		showControls();
	};

	// 清理事件监听
	const cleanupControlsEventListeners = () => {
		const videoContainer = document.querySelector(".video-container");
		// const controls = document.querySelector(".controls-wrapper");

		if (videoContainer) {
			videoContainer.removeEventListener("mousemove", handleMouseMove);
			videoContainer.removeEventListener("mouseleave", handleMouseLeave);
		}

		// if (controls) {
		// 	controls.removeEventListener("mouseenter", handleControlsMouseEnter);
		// 	controls.removeEventListener("mouseleave", handleControlsMouseLeave);
		// }

		if (hideControlsTimer) {
			clearTimeout(hideControlsTimer);
		}
	};

	// 事件监听设置
	const setupEventListeners = () => {
		if (!videoElementRef.value) return;

		// 播放状态事件
		videoElementRef.value.addEventListener("play", updatePlayingState);
		videoElementRef.value.addEventListener("pause", updatePlayingState);
		videoElementRef.value.addEventListener("playing", updatePlayingState);
		videoElementRef.value.addEventListener("waiting", updatePlayingState);
		videoElementRef.value.addEventListener("ended", updatePlayingState);

		// 进度相关事件
		videoElementRef.value.addEventListener("timeupdate", updateProgress);
		videoElementRef.value.addEventListener("progress", updateBuffer);
		videoElementRef.value.addEventListener("loadedmetadata", updateProgress);

		// 初始化状态
		updatePlayingState();
		updateProgress();
		isMuted.value = videoElementRef.value.muted;
		volume.value = videoElementRef.value.muted
			? 0
			: videoElementRef.value.volume * 100;

		// 添加控制栏事件监听
		setupControlsEventListeners();
	};

	// 清理事件监听
	const cleanupEventListeners = () => {
		if (!videoElementRef.value) return;

		videoElementRef.value.removeEventListener("play", updatePlayingState);
		videoElementRef.value.removeEventListener("pause", updatePlayingState);
		videoElementRef.value.removeEventListener("playing", updatePlayingState);
		videoElementRef.value.removeEventListener("waiting", updatePlayingState);
		videoElementRef.value.removeEventListener("ended", updatePlayingState);
		videoElementRef.value.removeEventListener("timeupdate", updateProgress);
		videoElementRef.value.removeEventListener("progress", updateBuffer);
		videoElementRef.value.removeEventListener("loadedmetadata", updateProgress);
		document.removeEventListener("fullscreenchange", handleFullscreenChange);
		document.removeEventListener(
			"webkitfullscreenchange",
			handleFullscreenChange,
		);
		document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
		document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
		document.removeEventListener("keydown", handleKeydown);

		// 清理控制栏事件监听
		cleanupControlsEventListeners();
	};

	// 监听 videoElement 的变化
	watch(
		videoElementRef,
		(newVideo, oldVideo) => {
			if (oldVideo) {
				cleanupEventListeners();
			}
			if (newVideo) {
				setupEventListeners();
			}
		},
		{ immediate: true },
	);

	const playerContext: PlayerContext = {
		state: {
			isPlaying,
			isMuted,
			isFullscreen,
			volume,
			currentTime,
			duration,
			buffered,
			progress,
			isControlsVisible,
		},
		actions: {
			togglePlay,
			setVolume,
			toggleMute,
			toggleFullscreen,
			seekTo,
			skip,
			adjustVolume,
			showControls,
			hideControls,
		},
	};

	// 提供上下文
	provide(PlayerSymbol, playerContext);

	return playerContext;
}

// 使用播放器上下文的 hook
export function usePlayerContext() {
	const context = inject(PlayerSymbol);
	if (!context) {
		throw new Error(
			"usePlayerContext must be used within a VideoPlayer component",
		);
	}
	return context;
}
