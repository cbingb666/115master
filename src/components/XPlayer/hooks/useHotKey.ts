import type { PlayerActions } from "./useVideoPlayerContext";

export function useHotKey(actions: PlayerActions) {
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
			// 空格键
			case "Space":
				event.preventDefault();
				actions.togglePlay();
				break;
			// 左箭头
			case "ArrowLeft":
				event.preventDefault();
				actions.skip(-5);
				break;
			// 右箭头
			case "ArrowRight":
				event.preventDefault();
				actions.skip(5);
				console.log("右箭头");
				break;
			// 上箭头
			case "ArrowUp":
				event.preventDefault();
				actions.adjustVolume(5);
				break;
			// 下箭头
			case "ArrowDown":
				event.preventDefault();
				actions.adjustVolume(-5);
				break;
		}
	};

	// 添加热键监听
	const setupHotKeys = () => {
		document.addEventListener("keydown", handleKeydown);
	};

	// 清理热键监听
	const cleanupHotKeys = () => {
		document.removeEventListener("keydown", handleKeydown);
	};

	return {
		setupHotKeys,
		cleanupHotKeys,
	};
}
