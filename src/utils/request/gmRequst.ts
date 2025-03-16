import { GM_info, GM_xmlhttpRequest } from "$";
import { GMRequestCache } from "../cache/gmRequestCache";
import { IRequest, type RequestOptions, type ResponseType } from "./types";

const isChrome = GM_info.userAgentData.brands.some(
	(brand) => brand.brand === "Google Chrome",
);

const DEFAULT_OPTIONS: RequestOptions = {
	cacheStatus: [200],
	cache: "no-cache",
};

// GM实现
export class GMRequest extends IRequest {
	options: RequestOptions = {};
	private cache: GMRequestCache;

	constructor(options: RequestOptions = {}, cacheName = "gm-request-cache") {
		super();
		this.options = {
			...DEFAULT_OPTIONS,
			...options,
		};
		this.cache = new GMRequestCache(cacheName);
	}

	async request(
		url: string,
		_options: RequestOptions = {},
	): Promise<ResponseType> {
		const options = { ...this.options, ..._options };
		const urlRe = new URL(url);
		if (options.params) {
			Object.entries(options.params).forEach(([key, value]) => {
				urlRe.searchParams.set(key, value.toString());
			});
		}

		// 谷歌浏览器才允许修改重定向行为，其他浏览器默认跟随重定向
		// 否则会造成并发请求中 404 请求，也会导致其他的请求被 canceled
		const redirect = isChrome ? options.redirect || "manual" : "follow";

		const requestUrl = urlRe.href;

		// 检查是否启用缓存
		const useCache = options.cache !== "no-cache";

		// 如果启用缓存，尝试从缓存中获取响应
		if (useCache) {
			const cachedResponse = await this.cache.get(requestUrl, options);
			if (cachedResponse) {
				return cachedResponse;
			}
		}

		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				method: options.method || "GET",
				url: requestUrl,
				headers: Object.fromEntries(Object.entries(options.headers || {})),
				data: options.body as BodyInit,
				timeout: options.timeout || 5000,
				responseType: options.responseType,
				nocache: !useCache,
				redirect,
				onload: async (rawResponse) => {
					// 解析响应头
					const headers = this.parseResponseHeaders(
						rawResponse.responseHeaders,
					);

					// 创建Headers对象
					const responseHeaders = new Headers();
					Object.entries(headers).forEach(([key, value]) => {
						responseHeaders.append(key, value);
					});

					const response = new Response(rawResponse.response, {
						status: rawResponse.status,
						statusText: rawResponse.statusText,
						headers: responseHeaders,
					});

					// 如果启用缓存，将响应存入缓存
					if (useCache) {
						await this.cache.set(requestUrl, response.clone(), options);
					}

					resolve(response);
				},
				onerror: (e) => {
					// @ts-ignore
					reject(new Error("请求失败", { cause: e.error }));
				},
				ontimeout: () => {
					reject(new Error("请求超时"));
				},
			});
		});
	}

	get(url: string, options?: RequestOptions): Promise<ResponseType> {
		return this.request(url, { ...options, method: "GET" });
	}

	post(
		url: string,
		data?: BodyInit | null,
		options?: RequestOptions,
	): Promise<ResponseType> {
		return this.request(url, { ...options, method: "POST", body: data });
	}

	/**
	 * 清除指定 URL 的缓存
	 * @param url 请求 URL
	 * @param options 请求选项
	 */
	public async clearCache(
		url: string,
		options?: RequestOptions,
	): Promise<void> {
		await this.cache.remove(url, options);
	}

	/**
	 * 清除所有缓存
	 */
	public async clearAllCache(): Promise<void> {
		await this.cache.clear();
	}

	/**
	 * 获取缓存管理器
	 * @returns 缓存管理器实例
	 */
	public getCache(): GMRequestCache {
		return this.cache;
	}

	private parseResponseHeaders(headerStr: string): Record<string, string> {
		const headers: Record<string, string> = {};
		if (!headerStr) return headers;

		const headerPairs = headerStr.split("\n");
		for (let i = 0; i < headerPairs.length; i++) {
			const headerPair = headerPairs[i].trim();
			if (headerPair) {
				const index = headerPair.indexOf(":");
				if (index > 0) {
					const key = headerPair.substring(0, index).trim();
					const val = headerPair.substring(index + 1).trim();
					headers[key.toLowerCase()] = val;
				}
			}
		}
		return headers;
	}
}

export const GMRequestInstance = new GMRequest();
