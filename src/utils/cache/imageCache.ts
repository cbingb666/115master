import { CacheCore } from "./core/index";

const PREVIEW_CACHE_KEY = "image_cache";
class ImageCache extends CacheCore<Blob> {
	constructor() {
		super({
			storeName: PREVIEW_CACHE_KEY,
		});
	}
}

export const imageCache = new ImageCache();
