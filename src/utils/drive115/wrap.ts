import type { WebApi } from "./api";
import { type DownloadResult, Drive115Core } from "./core";

// 115驱动的包装
export class Drive115Wrap extends Drive115Core {
	// 获取文件列表
	public async getFiles(params: WebApi.Req.GetFiles) {
		try {
			const response = await this.webApiGetFiles(params);
			if (response.state) {
				return response.data;
			}
			throw new Error("webapiFiles 获取播放列表失败");
		} catch (error) {
			const response = await this.ApsGetNatsortFiles(params);
			if (response.state) {
				return response.data;
			}
			throw new Error(`获取播放列表失败: ${JSON.stringify(response)}`);
		}
	}

	// 获取播放列表
	public async getPlaylist(cid: string, offset = 0) {
		const params: WebApi.Req.GetFiles = {
			aid: 1,
			cid: cid,
			offset: offset,
			limit: 1150,
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

		return this.getFiles(params);
	}

	// 获取 m3u8 列表
	public async getM3u8(pickcode: string) {
		const url = this.getM3u8Url(pickcode);
		const m3u8List = await this.getM3u8Info(url, pickcode);
		return m3u8List;
	}

	// 获取下载地址
	public async getFileDownloadUrl(pickcode: string): Promise<DownloadResult> {
		try {
			return await this.ProPostAppChromeDownurl(pickcode);
		} catch (error) {
			console.warn("第一种获取下载链接失败", error);
			const res = await this.webApiFilesDownload(pickcode);
			return res;
		}
	}
}
