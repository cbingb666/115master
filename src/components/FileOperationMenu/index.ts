import { GM_openInTab } from "$";
import { VOD_URL_115 } from "../../constants/115";
import type { PlayingVideoInfo } from "../../types/player";
import { getAvNumber } from "../../utils/getNumber";
import { AppLogger } from "../../utils/logger";
import { goToPlayer } from "../../utils/route";
import "./styles.css";

interface ButtonConfig {
	class: string;
	title: string;
	text: string;
}

type ViewMode = "list" | "thumb";

export class FileOperationMenu {
	private readonly logger: AppLogger;
	private readonly ContentsMenubuttons: ButtonConfig[] = [
		{
			class: "115-player",
			title: "使用【115官方播放器】",
			text: "💩 官方播放",
		},
		{
			class: "master-player",
			title: "使用【Master播放器】",
			text: "▶️ Master 播放",
		},
	];

	constructor() {
		this.logger = new AppLogger("FileOperationMenu");
		this.init();
	}

	private init(): void {
		this.logger.log("init");
		this.addFileItemHoverMenu();
	}

	private addFileItemHoverMenu(): void {
		document.addEventListener("mouseover", this.handleMouseOver.bind(this));
	}

	private handleMouseOver(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		const listItem = target.closest(
			'.list-cell li[file_type="1"]',
		) as HTMLElement;

		const isNormalItem =
			!!target.parentElement?.parentElement?.classList.contains(
				"list-contents",
			);

		if (!listItem || !this.isValidFileItem(listItem)) return;
		if (listItem.getAttribute("paly_button") === "1") return;

		listItem.setAttribute("paly_button", "1");

		const fileOpr = this.getFileOperationElement(listItem);
		if (fileOpr && isNormalItem) {
			this.createButtons(fileOpr, listItem);
		}

		this.addVideoEventListeners(listItem, isNormalItem);
	}

	private getFileOperationElement(item: HTMLElement): Element | null {
		const listOpr = item.querySelector(".file-opr");
		if (listOpr) return listOpr;

		const thumbOpr = item.querySelector(".file-opt");
		return thumbOpr;
	}

	private isValidFileItem(element: HTMLElement): boolean {
		const baseCheck =
			element.getAttribute("file_type") === "1" &&
			element.getAttribute("file_mode") !== "4" &&
			element.getAttribute("paly_button") !== "1";

		const hasDuration = element.querySelector(".duration") !== null;

		return baseCheck && hasDuration;
	}

	private addVideoEventListeners(
		listItem: HTMLElement,
		isNormalItem: boolean,
	): void {
		const openVideo = this.createOpenVideoHandler(listItem);
		listItem.addEventListener("dblclick", openVideo);
		listItem.addEventListener("auxclick", (e: MouseEvent) => {
			if (e.button === 1) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				GM_openInTab(
					new URL(
						`/?pickcode=${listItem.getAttribute("pick_code")}&share_id=0`,
						VOD_URL_115,
					).href,
					{ active: true },
				);
			}
		});
		listItem
			.querySelector(".file-name")
			?.addEventListener("click", openVideo, true);
		listItem
			.querySelector(".file-thumb")
			?.addEventListener("click", openVideo, true);

		if (!isNormalItem) {
			const tooltip = document.createElement("div");
			tooltip.className = "video-operation-tooltip";
			tooltip.innerHTML = `
				<div>点击中键<br />官方播放</div>
			`;

			listItem.style.position = "relative";
			listItem.appendChild(tooltip);

			listItem.addEventListener("mouseenter", () => {
				tooltip.classList.add("show");
				setTimeout(() => {
					tooltip.style.opacity = "1";
				}, 0);
			});
			listItem.addEventListener("mouseleave", () => {
				tooltip.classList.remove("show");
				setTimeout(() => {
					tooltip.style.opacity = "0";
				}, 0);
			});
		}
	}

	private createOpenVideoHandler(
		listItem: HTMLElement,
	): (event: Event) => void {
		return (event: Event) => {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			const playingVideoInfo: PlayingVideoInfo = {
				pickCode: listItem.getAttribute("pick_code")!,
				title: listItem.getAttribute("title")!,
				avNumber: getAvNumber(listItem.getAttribute("title")!) || undefined,
				cid: listItem.getAttribute("cid")!,
				size: parseInt(listItem.getAttribute("file_size")!),
			};

			this.logger.log("即将播放", playingVideoInfo);
			goToPlayer(playingVideoInfo, true);
		};
	}

	private createButtons(fileOpr: Element, listItem: HTMLElement): void {
		this.ContentsMenubuttons.forEach((button) => {
			const link = this.createNormalItemButtonElement(button);
			fileOpr.prepend(link);
			this.addButtonClickHandler(link, listItem);
		});
	}

	private createNormalItemButtonElement(
		button: ButtonConfig,
	): HTMLAnchorElement {
		const link = document.createElement("a");
		link.href = "javascript:void(0)";
		link.className = button.class;
		link.title = button.title;
		link.style.cssText =
			"pointer-events: all; position: relative; z-index: 1000;";

		const span = document.createElement("span");
		span.textContent = button.text;
		span.style.pointerEvents = "none";
		link.appendChild(span);

		return link;
	}

	private addButtonClickHandler(
		link: HTMLAnchorElement,
		listItem: HTMLElement,
	): void {
		link.addEventListener("mousedown", (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();

			if (link.classList.contains("115-player")) {
				GM_openInTab(
					new URL(
						`/?pickcode=${listItem.getAttribute("pick_code")}&share_id=0`,
						VOD_URL_115,
					).href,
					{ active: true },
				);
			} else if (link.classList.contains("master-player")) {
				const playingVideoInfo: PlayingVideoInfo = {
					pickCode: listItem.getAttribute("pick_code")!,
					title: listItem.getAttribute("title")!,
					avNumber: getAvNumber(listItem.getAttribute("title")!) || undefined,
					cid: listItem.getAttribute("cid")!,
					size: parseInt(listItem.getAttribute("file_size")!),
				};
				goToPlayer(playingVideoInfo, true);
			}
		});
	}

	public destroy(): void {
		document.removeEventListener("mouseover", this.handleMouseOver.bind(this));
	}
}
