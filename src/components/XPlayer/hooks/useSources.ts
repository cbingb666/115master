import { useDebounceFn } from "@vueuse/core";
import { ref, shallowRef, toValue, watch } from "vue";
import { type VideoSource, VideoSourceExtension } from "../types";
import { PlayerCoreType } from "./playerCore/types";
import type { PlayerContext } from "./usePlayerProvide";

/**
 * 视频源
 */
export const useSources = (ctx: PlayerContext) => {
	// 视频元素
	const playerElementRef = ctx.refs.playerElementRef;
	// 播放器
	const playerCore = ctx?.playerCore;
	// 视频源列表
	const list = ctx.rootProps.sources;
	// 当前视频源
	const current = ref<VideoSource | null>(null);
	// 是否中断
	const isInterrupt = shallowRef(false);
	// 是否正在切换播放器核心
	const isSwitching = shallowRef(false);
	// 获取 hls 视频源
	const getHlsSource = () => {
		return list.value.find((item) => item.type === "hls");
	};

	const getDefaultPlayerCore = (source: VideoSource) => {
		if (source.type === "hls") {
			return PlayerCoreType.Hls;
		}
		if ([VideoSourceExtension.mkv].includes(source.extension)) {
			return PlayerCoreType.AvPlayer;
		}
		return PlayerCoreType.Native;
	};

	// 初始化视频
	const initializeVideo = async (
		source: VideoSource,
		playerCoreType?: PlayerCoreType,
		lastTime?: number,
	) => {
		if (!ctx.driver) {
			throw new Error("videoDriver is not found");
		}

		// 更新当前源
		current.value = source;

		try {
			await ctx.driver?.switchDriver(
				playerCoreType ?? getDefaultPlayerCore(source),
			);

			if (!playerCore.value) {
				throw new Error("player is not found");
			}

			if (!playerElementRef.value) {
				throw new Error("playerElementRef is not found");
			}

			// 初始化播放器
			await playerCore.value.init(playerElementRef.value);

			// 加载视频源
			await playerCore.value.load(source.url, lastTime ?? 0);
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				return;
			}
			if (error instanceof Error) {
				const hlsSource = getHlsSource();

				if (hlsSource && playerCore?.value?.type !== PlayerCoreType.Hls) {
					await initializeVideo(hlsSource, undefined, lastTime ?? 0);
				}

				return;
			}

			throw error;
		}
	};

	// 切换视频源
	const changeQuality = async (source: VideoSource) => {
		if (!playerCore.value) {
			throw new Error("player is not found");
		}
		// 记住当前播放时间和播放状态
		const currentTime = playerCore.value.currentTime || 0;

		// 初始化新视频驱动
		await initializeVideo(source);

		// 恢复播放时间和状态
		playerCore.value.seek(currentTime);
	};

	// 中断源
	const interruptSource = () => {
		isInterrupt.value = true;
		if (playerCore.value) {
			playerCore.value
				.destroy()
				.catch((e: Error) => console.error("销毁播放器失败:", e));
		}
	};

	// 恢复源
	const resumeSource = () => {
		isInterrupt.value = false;
		initializeVideo(current.value!);
	};

	// 切换播放器核心的实际实现
	const switchPlayerCoreImpl = async (type: PlayerCoreType) => {
		if (isSwitching.value) {
			console.warn("正在切换播放器核心，忽略此次操作");
			return;
		}

		if (!current.value) {
			throw new Error("当前没有视频源");
		}

		isSwitching.value = true;

		try {
			const currentTime = playerCore.value?.currentTime || 0;
			const wasPaused = playerCore.value?.paused ?? true;

			// 确保当前播放器完全停止
			if (playerCore.value && !playerCore.value.paused) {
				await playerCore.value.pause();
			}

			await initializeVideo(current.value, type);

			if (playerCore.value) {
				await playerCore.value.seek(currentTime);

				// 恢复播放状态
				if (!wasPaused) {
					await playerCore.value.play();
				}
			}
		} finally {
			isSwitching.value = false;
		}
	};

	// 使用防抖的切换播放器核心方法
	const switchPlayerCore = useDebounceFn(switchPlayerCoreImpl, 300);

	watch(
		list,
		async () => {
			isInterrupt.value = false;
			if (list.value.length === 0) {
				await ctx.playerCore.value?.destroy();
				return;
			}
			await initializeVideo(
				list.value[0],
				undefined,
				toValue(ctx.rootProps.lastTime),
			);
		},
		{ immediate: true, deep: true },
	);

	return {
		list,
		current,
		changeQuality,
		interruptSource,
		resumeSource,
		isInterrupt,
		isSwitching,
		switchPlayerCore,
	};
};
