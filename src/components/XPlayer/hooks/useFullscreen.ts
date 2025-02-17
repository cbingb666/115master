import { ref } from "vue";

export function useFullscreen() {
	const isFullscreen = ref(false);

	// 监听全屏变化
	const handleFullscreenChange = () => {
		isFullscreen.value = !!document.fullscreenElement;
	};

	// 添加全屏变化监听
	document.addEventListener("fullscreenchange", handleFullscreenChange);
	document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
	document.addEventListener("mozfullscreenchange", handleFullscreenChange);
	document.addEventListener("MSFullscreenChange", handleFullscreenChange);

	// 清理函数
	const cleanup = () => {
		document.removeEventListener("fullscreenchange", handleFullscreenChange);
		document.removeEventListener(
			"webkitfullscreenchange",
			handleFullscreenChange,
		);
		document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
		document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
	};

	return {
		isFullscreen,
		cleanup,
	};
}
