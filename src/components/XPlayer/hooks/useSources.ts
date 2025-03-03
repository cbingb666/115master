import { type Ref, computed, nextTick, ref, watch } from "vue";
import type { VideoSource } from "../types";
import { useHls } from "./useHls";

export const useSource = (
	videoElementRef: Ref<HTMLVideoElement | null>,
	sources: Ref<VideoSource[]>,
) => {
	// 视频源列表
	const list = sources;
	// 当前视频源
	const current = ref<VideoSource | null>(null);
	// 视频源唯一标识
	const videoKey = computed(() => current.value?.url);
	// hls
	const hls = useHls(videoElementRef);
	// 清理函数
	const cleanupRef = ref<(() => void) | undefined>(() => void 0);

	// 初始化视频
	const initializeVideo = async (source: VideoSource) => {
		// 更新当前源
		current.value = source;

		// 等待新的 videoElementRef 更新
		await nextTick();

		if (!videoElementRef.value) return;

		// 清理之前的视频源
		if (videoElementRef.value.src) {
			videoElementRef.value.src = "";
		}

		// 如果视频源是 hls
		if (source.type === "hls") {
			hls.initHls(source.url, source.hlsConfig);
		} else {
			// 设置视频源
			videoElementRef.value.src = source.url;
			videoElementRef.value.load();
			videoElementRef.value.play();
		}

		return () => {
			if (videoElementRef.value) {
				videoElementRef.value.src = "";
				hls.destroy();
			}
		};
	};

	// 切换视频源
	const changeQuality = async (source: VideoSource) => {
		// 记住当前播放时间和播放状态
		const currentTime = videoElementRef.value?.currentTime || 0;
		const wasPlaying = !videoElementRef.value?.paused;

		cleanupRef.value?.();
		// 切换视频源
		cleanupRef.value = await initializeVideo(source);

		// 恢复播放时间和状态
		if (videoElementRef.value) {
			videoElementRef.value.currentTime = currentTime;
			if (wasPlaying) {
				videoElementRef.value.play();
			}
		}
	};

	watch(
		list,
		async () => {
			cleanupRef.value?.();
			if (sources.value.length === 0) {
				return;
			}
			cleanupRef.value = await initializeVideo(list.value[0]);
		},
		{ immediate: true, deep: true },
	);

	return {
		videoKey,
		list,
		current,
		changeQuality,
	};
};
