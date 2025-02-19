import dayjs from "dayjs";
import { imageUrl2BlobUrlOfCors } from "../download";
import { JAV_SOURCE, Jav, type JavInfo } from "./jav";

// 修改 Javbus 类
export class JavBus extends Jav {
	source = JAV_SOURCE.JAVBUS;
	baseUrl = "https://www.javbus.com";
	url = "";
	labels: { [k: string]: Element | undefined } = {};

	async getInfoByAvNumber(avNumber: string): Promise<JavInfo> {
		const url = new URL(avNumber, this.baseUrl).href;
		this.url = url;
		const html = await this.iRequest.get<string>(url);
		return await this.parseInfo(html.data);
	}

	async parseInfoBefore(dom: Document): Promise<Document> {
		const errorPage = dom.querySelector(".error-page");
		if (errorPage) {
			throw new Error("Not Found AvNumber PageUrl");
		}

		const labels = this.getLabels(dom);
		this.labels = labels;
		return dom;
	}

	async parseInfoAfter(info: JavInfo): Promise<JavInfo> {
		return {
			...info,
			title: info.title
				?.replace(new RegExp(`^${info.avNumber}`, "i"), "")
				.trim(),
			cover: info.cover
				? await imageUrl2BlobUrlOfCors(info.cover, this.url)
				: "",
		};
	}

	getLabels(dom: Document) {
		const headers = dom.querySelectorAll(
			".container .movie .info p > span.header, .container .movie .info p.header",
		);
		return Object.fromEntries(
			Array.from(headers).map((i) => [
				i.textContent?.replace(":", "").trim(),
				i,
			]),
		);
	}

	parseAvNumber() {
		return this.labels["識別碼"]?.nextElementSibling?.textContent?.trim() ?? "";
	}

	parseTitle(dom: Document) {
		const title = dom.querySelector(".container h3")?.textContent?.trim();
		return title;
	}

	parseDate() {
		const date = this.labels["發行日期"]?.parentElement?.textContent;
		return date
			? dayjs(date.trim().replace(/[^\d-]/g, "")).valueOf()
			: undefined;
	}

	parseDuration() {
		const duration = this.labels["長度"]?.parentElement?.textContent;
		return duration ? Number(duration.trim().replace(/[^\d]/g, "")) : undefined;
	}

	parseDirector() {
		const directors = this.labels["導演"]?.parentElement?.querySelectorAll("a");
		return directors?.length
			? Array.from(directors).map((i) => ({
					name: i.textContent!,
					url: i.getAttribute("href") ?? undefined,
				}))
			: undefined;
	}

	parseActor() {
		const actors =
			this.labels["演員"]?.parentElement?.nextElementSibling?.querySelectorAll(
				"li",
			);
		return actors?.length
			? Array.from(actors).map((i) => {
					const a = i.querySelector("a");
					const img = i.querySelector("img");

					// TODO 暂时无法加载头像，需要专门写个支持油猴跨域加载的图片组件来加载
					// const faceHref = img?.getAttribute("src");
					// const face = faceHref
					// 	? new URL(faceHref, this.baseUrl).href
					// 	: undefined;
					return {
						name: img?.getAttribute("title") ?? "",
						url: a?.getAttribute("href") ?? undefined,
						sex: undefined,
						face: "",
					};
				})
			: undefined;
	}

	parseStudio() {
		const studios = this.labels["製作商"]?.parentElement?.querySelectorAll("a");
		return studios?.length
			? Array.from(studios).map((i) => ({
					name: i.textContent!,
					url: i.getAttribute("href") ?? undefined,
				}))
			: undefined;
	}

	parsePublisher() {
		const publishers =
			this.labels["發行商"]?.parentElement?.querySelectorAll("a");
		return publishers?.length
			? Array.from(publishers).map((i) => ({
					name: i.textContent!,
					url: i.getAttribute("href") ?? undefined,
				}))
			: undefined;
	}

	parseCover(dom: Document) {
		const cover = dom
			.querySelector(".container .bigImage img")
			?.getAttribute("src");
		return cover ? new URL(cover, this.baseUrl).href : undefined;
	}

	parsePreview(dom: Document) {
		const previews = dom.querySelectorAll("#sample-waterfall a");
		return previews.length
			? Array.from(previews)
					.map((preview) => ({
						raw: preview.getAttribute("href") ?? undefined,
						thumbnail:
							preview.querySelector("img")?.getAttribute("src") ?? undefined,
					}))
					.filter((i) => !!i.raw || !!i.thumbnail)
					.map((i) => {
						return {
							raw: i.raw,
							thumbnail: i.thumbnail
								? new URL(i.thumbnail, this.baseUrl).href
								: undefined,
						};
					})
			: undefined;
	}

	parseSeries() {
		const series = this.labels["系列"]?.parentElement?.querySelectorAll("a");
		return series?.length
			? Array.from(series).map((i) => ({
					name: i.textContent!,
					url: i.getAttribute("href") ?? undefined,
				}))
			: undefined;
	}

	parseCategory() {
		const categories =
			this.labels["類別"]?.nextElementSibling?.querySelectorAll("a");
		return categories?.length
			? Array.from(categories).map((i) => ({
					name: i.textContent!,
					url: i.getAttribute("href") ?? undefined,
				}))
			: undefined;
	}

	parseComments() {
		return [];
	}
}
