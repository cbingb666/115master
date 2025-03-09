import { type App, createApp } from "vue";
import { ActressFaceDB } from "../../../utils/actressFaceDB";
import { getAvNumber } from "../../../utils/getNumber";
import { AppLogger } from "../../../utils/logger";
import ExtInfo from "../components/ExtInfo/index.vue";
import ExtPreview from "../components/ExtPreview/index.vue";
import "./index.css";

enum FileType {
	folder = "0",
	file = "1",
}

enum IvType {
	playable = "1",
	unplayable = "0",
}

interface FileItemAttributes {
	c: string;
	iv: IvType;
	vdi: string;
	title: string;
	hdf: string;
	file_type: FileType;
	pick_code: string;
	is_share: string;
	is_top: string;
	area_id: string;
	p_id: string;
	cate_id: string;
	cate_name: string;
	score: string;
	has_desc: string;
	fl_encode: string;
	fuuid: string;
	shared: string;
	has_pass: string;
	issct: string;
}

class FileItem {
	private vueApp: App | null = null;
	private initedActressInfo = false;
	private $fileNameDom: HTMLElement | null = null;
	private $fileNameWrapDom: HTMLElement | null = null;
	private $fileNameATagDom: HTMLAnchorElement | null = null;

	constructor(
		private readonly $item: HTMLElement,
		private readonly actressFaceDB: ActressFaceDB,
	) {
		this.getDoms();
	}

	private get attributes(): FileItemAttributes {
		return Object.fromEntries(
			Array.from(this.$item.attributes).map((attr) => [attr.name, attr.value]),
		) as unknown as FileItemAttributes;
	}

	private get avNumber(): string | null {
		return getAvNumber(this.attributes.title);
	}

	private getDoms() {
		this.$fileNameDom = this.$item.querySelector(".file-name") as HTMLElement;
		this.$fileNameWrapDom = this.$item.querySelector(
			".file-name-wrap",
		) as HTMLElement;
		this.$fileNameATagDom = this.$fileNameDom.querySelector(
			"a",
		) as HTMLAnchorElement;
	}

	// 加载扩展信息
	private async loadExtInfo() {
		if (
			this.attributes.iv !== IvType.playable &&
			this.attributes.file_type !== FileType.folder
		) {
			return;
		}

		if (this.$item.classList.contains("with-ext-info")) {
			return;
		}

		if (this.avNumber) {
			this.$item.classList.add("with-ext-info");
			const extInfoDom = document.createElement("div");
			this.$item.append(extInfoDom);
			extInfoDom.className = "ext-info-root";
			const app = createApp(ExtInfo, {
				avNumber: this.avNumber,
			});
			app.mount(extInfoDom);
			this.vueApp = app;
		}
	}

	// 加载演员信息
	private async loadActressInfo() {
		if (this.initedActressInfo === true) {
			return;
		}
		this.initedActressInfo = true;
		const actress = await this.actressFaceDB.findActress(
			this.attributes.title.trim(),
		);
		if (this.$item.classList.contains("with-actress-info")) {
			return;
		}
		if (actress) {
			this.$item.classList.add("with-actress-info");
			const actressDom = document.createElement("img");
			actressDom.src = actress.url;
			actressDom.className = "actress-info-img";
			this.$fileNameWrapDom?.prepend(actressDom);
		}
	}

	// 加载预览视频
	private async loadPreview() {
		if (this.avNumber) {
			return;
		}

		if (this.attributes.file_type === FileType.folder) {
			return;
		}

		if (this.attributes.iv !== IvType.playable) {
			return;
		}

		if (this.attributes.vdi === "0") {
			return;
		}

		if (this.$item.classList.contains("with-ext-preview")) {
			return;
		}

		this.$item.classList.add("with-ext-preview");
		const previewDom = document.createElement("div");
		previewDom.className = "ext-preview-root";
		this.$item.append(previewDom);
		const app = createApp(ExtPreview, {
			pickCode: this.attributes.pick_code,
		});
		app.mount(previewDom);
		this.vueApp = app;
	}

	// 修改文件夹 a 标签链接（支持鼠标中键新标签打开）
	private async ModFolderATagLink() {
		if (this.attributes.file_type !== FileType.folder) {
			return;
		}

		if (this.$fileNameATagDom?.href.includes("javascript:;")) {
			this.$fileNameATagDom.href = `/?cid=${this.attributes.cate_id}&offset=0&tab=&mode=wangpan`;
		}
	}

	public async load() {
		this.loadExtInfo();
		this.loadActressInfo();
		this.loadPreview();
		this.ModFolderATagLink();
	}

	public destroy(): void {
		this.vueApp?.unmount();
	}
}

class FileListMod {
	private readonly logger: AppLogger;
	private $list!: HTMLElement | null;
	private $items!: NodeListOf<HTMLElement> | null;
	private items: FileItem[] = [];
	private offChangePage: (() => void) | null = null;
	private actressFaceDB: ActressFaceDB | null = null;
	constructor() {
		this.logger = new AppLogger("FileStyle");
		this.init();
	}

	private getOriginDom() {
		this.$list = document.querySelector(".list-contents") ?? null;
		this.$items = this.$list?.querySelectorAll("li") ?? null;
	}

	private async init(): Promise<void> {
		this.logger.log("init");
		this.actressFaceDB = new ActressFaceDB();
		this.actressFaceDB.init();
		this.getOriginDom();

		if (this.$list && this.$items) {
			this.loadExtInfo();
		} else {
			await this.waitListLoaded();
			this.loadExtInfo();
		}
		this.loadExtInfo();
		this.offChangePage = this.onChangePage(async () => {
			this.destroyItems();
			await this.waitListLoaded();
			this.loadExtInfo();
		});
	}

	private waitListLoaded(): Promise<void> {
		return new Promise((resolve) => {
			let observerContent: MutationObserver | null = null;
			observerContent = new MutationObserver(() => {
				observerContent?.disconnect();
				resolve();
			});
			observerContent.observe(document, {
				subtree: true,
				childList: true,
				characterData: true,
			});
		});
	}

	private loadExtInfo() {
		this.getOriginDom();
		if (this.$list && this.$items) {
			this.$items.forEach((item) => {
				const fileItem = new FileItem(item, this.actressFaceDB!);
				fileItem.load();
				this.items.push(fileItem);
			});
		}
	}

	private onChangePage(
		callback: (originUrl: string, currentUrl: string) => void,
	) {
		let lastUrl = window.parent.location.href;
		const observerUrl = new MutationObserver(() => {
			const url = window.parent.location.href;
			if (url !== lastUrl) {
				lastUrl = url;
				callback(lastUrl, url);
			}
		});

		observerUrl.observe(document, {
			subtree: true,
			childList: true,
			characterData: true,
		});

		return () => {
			observerUrl.disconnect();
		};
	}

	private destroyItems(): void {
		if (this.items.length === 0) {
			return;
		}
		this.items.forEach((item) => {
			item.destroy();
		});
		this.items = [];
	}

	public destroy(): void {
		this.logger.log("destroy");
		this.destroyItems();
		this.offChangePage?.();
	}
}

export default FileListMod;
