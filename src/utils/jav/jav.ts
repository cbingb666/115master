import type { IRequest } from "../request/types";

export enum JAV_SOURCE {
	JAVBUS = "JavBus",
	JAVDB = "JavDB",
}

// 导演
type Director = {
	// 名称
	name: string;
	// 链接
	url?: string;
};

// 演员
type Actor = {
	// 名称
	name: string;
	// 链接
	url?: string;
	// 性别
	sex?: 0 | 1;
	// face
	face?: string;
};

// 类别
type Category = {
	// 名称
	name: string;
	// 链接
	url?: string;
};

// 系列
type Series = {
	// 名称
	name: string;
	// 链接
	url?: string;
};

// 片商
type Studio = {
	// 名称
	name: string;
	// 链接
	url?: string;
};

// 发行商
type Publisher = {
	// 名称
	name: string;
	// 链接
	url?: string;
};

// 预览图
type Preview = {
	// 链接
	raw?: string;
	// 缩略图
	thumbnail?: string;
};

type Comment = {
	// 内容
	content: string;
	// 名称
	name: string;
	// 头像
	avatar?: string;
	// 评分
	score: number;
	// 时间
	time: number;
	// 点赞数
	likeCount: number;
};

// 番号信息
export type JavInfo = {
	// 来源
	source: JAV_SOURCE;
	// 链接
	url: string;
	// 番号
	avNumber?: string;
	// 标题
	title?: string;
	// 日期
	date?: number;
	// 时长
	duration?: number;
	// 导演
	director?: Director[];
	// 演员
	actors?: Actor[];
	// 片商
	studio?: Studio[];
	// 发行商
	publisher?: Publisher[];
	// 封面
	cover?: string;
	// 预览图
	preview?: Preview[];
	// 系列
	series?: Series[];
	// 类别
	category?: Category[];
	// 评分
	score?: number;
	// 评价人数
	scoreCount?: number;
	// 观看人数
	viewCount?: number;
	// 下载人数
	downloadCount?: number;
	// 评论
	comments?: Comment[];
};

// 修改 Jav 抽象类
abstract class Jav {
	constructor(protected iRequest: IRequest) {}

	// 基础 URL
	abstract baseUrl: string;
	// 链接
	abstract url: string;
	// 来源
	abstract source: JAV_SOURCE;
	// 通过番号获取番号信息
	abstract getInfoByAvNumber(avNumber: string): Promise<JavInfo>;
	// 解析番号
	abstract parseAvNumber(dom: Document): string | undefined;
	// 解析标题
	abstract parseTitle(dom: Document): string | undefined;
	// 解析日期
	abstract parseDate(dom: Document): number | undefined;
	// 解析时长
	abstract parseDuration(dom: Document): number | undefined;
	// 解析导演
	abstract parseDirector(dom: Document): Director[] | undefined;
	// 解析演员
	abstract parseActor(dom: Document): Actor[] | undefined;
	// 解析片商
	abstract parseStudio(dom: Document): Studio[] | undefined;
	// 解析发行商
	abstract parsePublisher(dom: Document): Publisher[] | undefined;
	// 解析封面
	abstract parseCover(dom: Document): string | undefined;
	// 解析预览图
	abstract parsePreview(dom: Document): Preview[] | undefined;
	// 解析系列
	abstract parseSeries(dom: Document): Series[] | undefined;
	// 解析类别
	abstract parseCategory(dom: Document): Category[] | undefined;
	// 解析评分
	parseScore?(dom: Document): number | undefined;
	// 解析评分人数
	parseScoreCount?(dom: Document): number | undefined;
	// 解析观看人数
	parseViewCount?(dom: Document): number | undefined;
	// 解析下载人数
	parseDownloadCount?(dom: Document): number | undefined;
	// 解析评论
	parseComments?(dom: Document): Comment[] | undefined;
	// 解析番号信息
	async parseInfo(html: string): Promise<JavInfo> {
		let dom = new DOMParser().parseFromString(html, "text/html");
		dom = await this.parseInfoBefore(dom);
		const info = {
			source: this.source,
			url: this.url,
			avNumber: this.parseAvNumber(dom),
			title: this.parseTitle(dom),
			date: this.parseDate(dom),
			duration: this.parseDuration(dom),
			director: this.parseDirector(dom),
			actors: this.parseActor(dom),
			studio: this.parseStudio(dom),
			publisher: this.parsePublisher(dom),
			cover: this.parseCover(dom),
			preview: this.parsePreview(dom),
			series: this.parseSeries(dom),
			category: this.parseCategory(dom),
			score: this.parseScore?.(dom),
			scoreCount: this.parseScoreCount?.(dom),
			viewCount: this.parseViewCount?.(dom),
			downloadCount: this.parseDownloadCount?.(dom),
			comments: this.parseComments?.(dom),
		};
		return this.parseInfoAfter(info);
	}

	// 解析番号信息后
	async parseInfoBefore(dom: Document) {
		return dom;
	}
	// 解析番号信息后
	async parseInfoAfter(info: JavInfo) {
		return Promise.resolve(info);
	}
}

// 将 GM 相关代码移到单独的文件中
export type {
	Director,
	Actor,
	Category,
	Series,
	Studio,
	Publisher,
	JavInfo as AvInfo,
};

export { Jav };
