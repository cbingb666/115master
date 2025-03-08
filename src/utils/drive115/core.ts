import { GM_openInTab } from "$";
import {
	NORMAL_URL_115,
	PRO_API_URL_115,
	VOD_HOST_155,
	VOD_URL_115,
	WEB_API_URL_115,
} from "../../constants/115";
import { qualityCodeMap } from "../../constants/quality";
import { USER_AGENT_115 } from "../../constants/useragent";
import type { M3u8Item } from "../../types/player";
import { AppLogger } from "../logger";
import type { IRequest } from "../request/types";
import type { NormalApi, ProApi, VodApi, WebApi } from "./api";
import { Crypto115 } from "./crypto";

export interface DownloadResult {
	url: string;
	fileToken?: string;
}

// TODO: 超时登录错误 errNo 990001
// TODO: 验证账号弹窗被拦截 911
export class Drive115Core {
	private logger = new AppLogger("Drive115Core");

	private crypto115: Crypto115;
	private BASE_URL = NORMAL_URL_115;
	private WEB_API_URL = WEB_API_URL_115;
	private PRO_API_URL = PRO_API_URL_115;
	private VOD_URL_115 = VOD_URL_115;

	constructor(protected iRequest: IRequest) {
		this.crypto115 = new Crypto115();
	}

	private verify() {
		const time = new Date().getTime();
		const w = 335;
		const h = 500;
		const t = (window.screen.availHeight - h) / 2;
		const l = (window.screen.availWidth - w) / 2;
		const link = `https://captchaapi.115.com/?ac=security_code&type=web&cb=Close911_${time}`;
		const isConfirm = confirm("立即打开验证账号弹窗？");
		if (isConfirm) {
			let blocked = false;
			try {
				const WindowProxy = window.open(
					link,
					"请验证账号",
					`height=${h},width=${w},top=${t},left=${l},toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no`,
				);
				if (WindowProxy == null) {
					blocked = true;
				}
			} catch (e) {
				blocked = true;
			}
			if (blocked) {
				alert("验证弹窗已被拦截，请允许本页面弹出式窗口！");
			}
		}
	}

	private verifyVod(pickcode: string) {
		alert("你已经高频操作了!\n先去通过一下人机验证再回来刷新页面哦~");
		GM_openInTab(new URL(`?pickcode=${pickcode}`, this.VOD_URL_115).href, {
			active: true,
		});
	}

	async fakeVodAuthPickcode(pickcode: string) {
		await this.iRequest.get<WebApi.Res.FilesDownload>(
			new URL(`?pickcode=${pickcode}`, this.VOD_URL_115).href,
			{
				headers: {
					"User-Agent": USER_AGENT_115,
				},
				responseType: "document",
				redirect: "follow",
			},
		);
	}

	// 获取原文件地址
	private async getDownloadUrlByNormal(
		pickcode: string,
	): Promise<DownloadResult> {
		const response = await this.iRequest.get<WebApi.Res.FilesDownload>(
			new URL(`/files/download?pickcode=${pickcode}`, this.WEB_API_URL).href,
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			},
		);

		if (response.data.errNo === 990001) {
			alert("登录已过期，请重新登录");
		}

		if (!response.data.state || !response.data.file_url) {
			throw new Error(
				`服务器返回数据格式错误: ${JSON.stringify(response.data)}`,
			);
		}

		return {
			url: response.data.file_url,
		};
	}

	// 获取原文件地址
	private async getDownloadUrlByPro(pickcode: string): Promise<DownloadResult> {
		const tm = Math.floor(Date.now() / 1000).toString();
		const src = JSON.stringify({ pickcode });
		const encoded = this.crypto115.m115_encode(src, tm);

		const data = `data=${encodeURIComponent(encoded.data)}`;
		this.logger.log("发送加密数据:", data);

		const response = await this.iRequest.post<ProApi.Res.FilesAppChromeDownurl>(
			new URL(`/app/chrome/downurl?t=${tm}`, this.PRO_API_URL).href,
			data,
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"User-Agent": USER_AGENT_115,
				},
			},
		);

		const responseData = response.data;
		this.logger.log("Pro方式响应:", responseData);

		if (!responseData.state) {
			throw new Error(`获取下载地址失败: ${JSON.stringify(responseData)}`);
		}

		const result = JSON.parse(
			this.crypto115.m115_decode(responseData.data, encoded.key),
		);
		const downloadInfo = Object.values(result)[0] as { url: { url: string } };

		// 从响应头中获取 fileToken
		const fileToken = response.headers["set-cookie"]?.split(";")[0];

		return {
			url: downloadInfo.url.url,
			fileToken: fileToken,
		};
	}

	// 获取原文件地址
	async getFileDownloadUrl(pickcode: string): Promise<DownloadResult> {
		try {
			return await this.getDownloadUrlByPro(pickcode);
		} catch (error) {
			console.warn("第一种获取下载链接失败", error);
			this.logger.log("开始使用第二种方式获取下载链接", error);
			const res = await this.getDownloadUrlByNormal(pickcode);
			return res;
		}
	}

	// 获取原文件地址
	async getOriginFileUrl(
		pickcode: string,
		fileId: string,
	): Promise<DownloadResult> {
		const response = await this.iRequest.get<WebApi.Res.FilesAppChromeDown>(
			new URL(
				`/app/chrome/down?method=get_file_url&pickcode=${pickcode}`,
				this.PRO_API_URL,
			).href,
			{
				headers: {
					"Content-Type": "application/json",
					"User-Agent": USER_AGENT_115,
				},
			},
		);

		const res = response.data;
		if (res.state) {
			const url = res.data[fileId].url.url;
			return { url };
		}
		throw new Error(`获取原文件地址失败: ${JSON.stringify(res)}`);
	}

	// 获取 m3u8 根 url
	private getM3u8RootUrl(pickcode: string): string {
		return new URL(`/api/video/m3u8/${pickcode}.m3u8`, this.BASE_URL).href;
	}

	// 解析 m3u8 列表
	private async parseM3u8Url(
		url: string,
		pickcode: string,
	): Promise<M3u8Item[]> {
		const response = await this.iRequest.get<NormalApi.Res.VideoM3u8>(url, {
			headers: {
				"Content-Type": "application/json",
				"User-Agent": USER_AGENT_115,
			},
		});

		if (response.data?.state === false) {
			if (response.data.code === 911) {
				this.verifyVod(pickcode);
			}
			throw new Error(`获取m3u8文件失败: ${response.data.error}`);
		}

		const htmlText = response.data;

		const lines = htmlText.split("\n");
		const m3u8List: M3u8Item[] = [];

		htmlText.split("\n").forEach((line, index) => {
			if (line.includes('NAME="')) {
				const extXStreamInf = line.match(/#EXT-X-STREAM-INF/);
				if (extXStreamInf) {
					const name = line.match(/NAME="([^"]*)"/)?.[1] ?? "";
					const url = lines[index + 1]?.trim();
					m3u8List.push({
						name,
						quality:
							qualityCodeMap[name as unknown as keyof typeof qualityCodeMap],
						url,
					});
				}
			}
		});

		// 按照 UD HD BD 排序
		m3u8List.sort((a, b) => b.quality - a.quality);
		this.logger.log("m3u8List result", m3u8List);
		return m3u8List;
	}

	// 获取 m3u8 列表
	public async getM3u8(pickcode: string) {
		const url = this.getM3u8RootUrl(pickcode);
		const m3u8List = await this.parseM3u8Url(url, pickcode);
		return m3u8List;
	}

	// 获取播放列表
	private async apsNatsortFiles(params: VodApi.Req.VodApiFilesReq) {
		const response = await this.iRequest.get<VodApi.Res.VodApiFiles>(
			new URL("/aps/natsort/files.php", this.VOD_URL_115).href,
			{
				params,
				headers: {
					"Content-Type": "application/json",
					"User-Agent": USER_AGENT_115,
					host: VOD_HOST_155,
					referer: `${this.VOD_URL_115}/?pickcode=${params.pickcode}&share_id=0`,
				},
			},
		);

		return response;
	}

	// 获取播放列表
	private async webapiFiles(params: VodApi.Req.VodApiFilesReq) {
		const response = await this.iRequest.get<VodApi.Res.VodApiFiles>(
			new URL("/webapi/files", this.VOD_URL_115).href,
			{
				params,
				headers: {
					"Content-Type": "application/json",
					"User-Agent": USER_AGENT_115,
					referer: `${this.VOD_URL_115}/?pickcode=${params.pickcode}&share_id=0`,
					host: VOD_HOST_155,
				},
			},
		);

		return response;
	}

	// 获取播放列表
	public async getPlaylist(cid: string, pickcode: string, offset = 0) {
		const obj: VodApi.Req.VodApiFilesReq = {
			pickcode,
			aid: 1,
			cid: cid,
			offset: offset,
			limit: 115,
			show_dir: 0,
			nf: "",
			qid: 0,
			type: 4,
			source: "",
			format: "json",
			star: "",
			is_q: "",
			is_share: "",
			r_all: 1,
			o: "file_name",
			asc: 1,
			cur: 1,
			natsort: 1,
		};

		try {
			const response = await this.webapiFiles(obj);
			if (response.data.state) {
				return response.data;
			}
			throw new Error("webapiFiles 获取播放列表失败");
		} catch (error) {
			this.logger.log("获取webapiFiles失败，尝试使用apsNatsortFiles获取");
			const response = await this.apsNatsortFiles(obj);

			if (response.data?.state) {
				return response.data;
			}
			throw new Error(`获取播放列表失败: ${JSON.stringify(response)}`);
		}
	}

	// 获取文件信息
	public async getFileInfo(params: WebApi.Req.FilesInfoReq) {
		const response = await this.iRequest.get<WebApi.Res.FilesInfo>(
			new URL("/webapi/files/video", this.VOD_URL_115).href,
			{
				params,
				headers: {
					"Content-Type": "application/json",
					"User-Agent": USER_AGENT_115,
					referer: `${this.VOD_URL_115}/?pickcode=${params.pickcode}&share_id=0`,
					host: VOD_HOST_155,
				},
			},
		);

		return response.data;
	}
}
