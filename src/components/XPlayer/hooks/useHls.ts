import Hls from "hls.js";
import { onUnmounted } from "vue";

interface HLSConfig {
	autoStartLoad?: boolean;
	startPosition?: number;
	debug?: boolean;
	[key: string]: unknown;
}

export function useHls(videoElement: HTMLVideoElement, config: HLSConfig = {}) {
	let hls: Hls | null = null;
	const isSupported = Hls.isSupported();

	const initHls = (url: string) => {
		if (!isSupported) {
			console.warn("HLS is not supported in this browser");
			return false;
		}

		cleanup();

		hls = new Hls({
			autoStartLoad: true,
			startPosition: -1,
			debug: false,
			...config,
		});

		hls.loadSource(url);
		hls.attachMedia(videoElement);
		hls.on(Hls.Events.ERROR, (event, data) => {
			console.error("HLS error", event, data);
		});
		return true;
	};

	const cleanup = () => {
		if (hls) {
			hls.destroy();
			hls = null;
		}
	};

	onUnmounted(cleanup);

	return {
		hls,
		isSupported,
		initHls,
		cleanup,
	};
}
