import { GM_openInTab } from "$";
import { VOD_URL_115 } from "../constants/115";
import type { PlayingVideoInfo } from "../types/player";
import { getAvNumber } from "../utils/getNumber";
import { AppLogger } from "../utils/logger";
import { goToPlayer } from "../utils/route";

class HomePage {
	logger: AppLogger;

	constructor() {
		this.logger = new AppLogger("HomePage");
		this.init();
	}

	init() {
		this.logger.log("init");
		this.addFileListItemHouverMenu();
	}

	addFileListItemHouverMenu() {
		document.addEventListener("mouseover", (event) => {
			const target = event.target as HTMLElement;
			const listItem = target.closest('li[file_type="1"]');
			if (!listItem || !this.isValidFileListItem(listItem as HTMLElement))
				return;

			if (listItem.getAttribute("paly_button") === "1") return;
			listItem.setAttribute("paly_button", "1");

			const buttons = [
				{
					class: "115-player",
					title: "使用115播放视频",
					text: "🏁115播放",
				},
			];

			const fileOpr = listItem.querySelector(".file-opr");
			if (!fileOpr) return;

			const openVideo = (event: Event) => {
				const mouseEvent = event as MouseEvent;
				mouseEvent.preventDefault();
				mouseEvent.stopPropagation();
				mouseEvent.stopImmediatePropagation();
				const playingVideoInfo: PlayingVideoInfo = {
					pickCode: listItem.getAttribute("pick_code")!,
					title: listItem.getAttribute("title")!,
					avNumber: getAvNumber(listItem.getAttribute("title")!) || undefined,
					cid: listItem.getAttribute("cid")!,
					size: Number.parseInt(listItem.getAttribute("file_size")!),
				};

				this.logger.log("即将播放", playingVideoInfo);

				goToPlayer(playingVideoInfo, true);
			};

			listItem.addEventListener("dblclick", openVideo);
			listItem
				.querySelector(".file-name")
				?.addEventListener("click", openVideo);

			buttons.forEach((button) => {
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
				fileOpr.prepend(link);

				link.addEventListener("mousedown", (e) => {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();

					GM_openInTab(
						new URL(
							`/?pickcode=${listItem.getAttribute("pick_code")}&share_id=0`,
							VOD_URL_115,
						).href,
						{
							active: true,
						},
					);
				});
			});
		});
	}

	private isValidFileListItem(element: HTMLElement): boolean {
		return element.matches(
			'li[file_type="1"]:has(.duration):not([file_mode="4"],[paly_button="1"])',
		);
	}
}

export default HomePage;
