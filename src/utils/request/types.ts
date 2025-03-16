export type RequestOptions = RequestInit & {
	responseType?:
		| "text"
		| "json"
		| "arraybuffer"
		| "blob"
		| "document"
		| "stream";
	timeout?: number;
	params?: Record<string, string | number | boolean>;
	cache?: "force-cache" | "no-cache";
	cacheTime?: number;
	cacheKey?: string;
	cacheStatus?: number[];
};

export type ResponseType = Response;

// 请求接口
export abstract class IRequest {
	abstract get(url: string, options?: RequestOptions): Promise<ResponseType>;
	abstract post(
		url: string,
		data?: unknown,
		options?: RequestOptions,
	): Promise<ResponseType>;
	abstract request(
		url: string,
		options?: RequestOptions,
	): Promise<ResponseType>;
}
