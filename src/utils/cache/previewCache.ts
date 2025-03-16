import { CacheCore } from "./core/index";

type PreviewCacheValue = Blob[];

const PREVIEW_CACHE_KEY = "preview_cache";
class PreviewCache extends CacheCore<PreviewCacheValue> {
	constructor() {
		super({
			storeName: PREVIEW_CACHE_KEY,
		});
	}
}

export const previewCache = new PreviewCache();
