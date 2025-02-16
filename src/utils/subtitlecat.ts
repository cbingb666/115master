import { GM_xmlhttpRequest } from "$";
import { AppLogger } from "./logger";
import { vttToBlobUrl } from "./subtitle";
import { convertSrtToVtt } from "./subtitle";

interface SubtitleSearchResult {
	title: string;
	href: string;
	downloads: number;
	comment: 1 | -1 | 0;
	originLanguage: string;
	targetLanguage: string;
}

export interface ProcessedSubtitle {
	title: string;
	url: string;
	downloads: number;
	comment: 1 | -1 | 0;
	originLanguage: string;
	targetLanguage: string;
	vvtText: string;
}

export class SubtitleCat {
	private domain = "https://subtitlecat.com";
	logger = new AppLogger("Utils SubtitleCat");

	getSubtitleText(url: string): Promise<string> {
		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				url: url,
				method: "GET",
				onload: (response) => {
					resolve(response.responseText);
				},
				onerror: (error) => {
					reject(error);
				},
			});
		});
	}

	fetchSubtitleUrl(url: string, language: string): Promise<string | undefined> {
		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				url,
				method: "GET",
				onload: async (response) => {
					const parser = new DOMParser();
					const doc = parser.parseFromString(response.response, "text/html");
					const subtitleUrl = doc
						.querySelector(`#download_${language}`)
						?.getAttribute("href");

					resolve(subtitleUrl || undefined);
				},
				onerror: (error) => {
					reject(error);
				},
			});
		});
	}

	private parseSubtitleRow(
		row: Element,
		language: string,
	): SubtitleSearchResult {
		const firstTd = row.querySelector("td:first-child");
		const link = firstTd?.querySelector("a");
		const title = link?.textContent || "";
		const href = link?.getAttribute("href") || "";

		// 从第一个td提取原始语言
		const langMatch = firstTd?.textContent?.match(/translated from (\w+)/);
		const originLanguage = langMatch ? langMatch[1] : "";

		// 提取评价
		const hasThumbsDown =
			row.querySelector("td:nth-child(2) .fa-thumbs-down") !== null;
		const hasThumbsUp =
			row.querySelector("td:nth-child(2) .fa-thumbs-up") !== null;
		const comment = hasThumbsDown
			? (-1 as const)
			: hasThumbsUp
			  ? (1 as const)
			  : (0 as const);

		// 提取下载次数
		const downloadsText =
			row.querySelector("td:nth-child(3)")?.textContent || "";
		const downloadsMatch = downloadsText.match(/\d+/);
		const downloads = downloadsMatch ? parseInt(downloadsMatch[0]) : 0;

		return {
			title,
			href,
			downloads,
			comment,
			originLanguage,
			targetLanguage: language,
		};
	}

	private async processSubtitleItem(
		item: SubtitleSearchResult,
	): Promise<ProcessedSubtitle | undefined> {
		const url = await this.fetchSubtitleUrl(
			`${this.domain}/${item.href}`,
			item.targetLanguage,
		);
		if (!url) return undefined;

		const subtitleText = await this.getSubtitleText(this.domain + url);
		const vttText = convertSrtToVtt(subtitleText);
		const blobUrl = vttToBlobUrl(vttText);

		return {
			...item,
			url: blobUrl!,
			vvtText: vttText,
		};
	}

	private sortResults(results: ProcessedSubtitle[]): ProcessedSubtitle[] {
		return results.sort((a, b) => {
			if (b.comment !== a.comment) {
				return b.comment - a.comment;
			}
			return b.downloads - a.downloads;
		});
	}

	async fetchSubtitle(
		keyword: string,
		language: string,
	): Promise<ProcessedSubtitle[]> {
		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				url: `${this.domain}/index.php?search=${keyword}`,
				method: "GET",
				onload: async (response) => {
					try {
						const parser = new DOMParser();
						const doc = parser.parseFromString(response.response, "text/html");
						const rows = Array.from(
							doc.querySelectorAll(".sub-table tbody tr"),
						).slice(0, 5);

						this.logger.log("fetchSubtitle", `找到${rows.length}个疑似结果`);

						// 解析搜索结果并过滤
						const searchResults = rows
							.map((row) => this.parseSubtitleRow(row, language))
							.filter((item) => {
								// 使用更宽松的匹配条件
								const match = item.title
									.toLowerCase()
									.includes(keyword.toLowerCase());
								this.logger.log(
									"fetchSubtitle",
									`${item.title} ${match ? "匹配" : "不匹配"}`,
								);
								return match;
							});

						// 处理每个字幕项
						const processedResults = await Promise.all(
							searchResults.map(async (item) => {
								const result = await this.processSubtitleItem(item);
								this.logger.log(
									`转换字幕 ${item.title}`,
									result ? "成功" : "失败",
								);
								return result;
							}),
						);

						// 过滤掉未成功处理的项并排序
						const finalResults = this.sortResults(
							processedResults.filter(
								(item): item is ProcessedSubtitle => item !== undefined,
							),
						);

						this.logger.log("最终结果", finalResults);

						resolve(finalResults);
					} catch (error) {
						console.error("处理过程中出错:", error);
						reject(error);
					}
				},
				onerror: (error) => {
					console.error("请求失败:", error);
					reject(error);
				},
			});
		});
	}
}

export const subtitlecat = new SubtitleCat();
