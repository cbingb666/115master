/**
 * 115 页面标题修改
 * @description 修改页面标题为当前目录路径
 */
export class PageTitleMod {
	private mutationObserver!: MutationObserver;

	constructor() {
		this.init();
	}

	updateTitle() {
		const pathDom = document.querySelectorAll(
			".list-topheader .top-file-path .file-path a",
		);

		const paths = Array.from(pathDom)
			.map((item) => item.getAttribute("titletext") ?? "")
			.filter((item) => item !== "");
		const title = paths?.reverse().join(" < ") ?? "";
		if (top?.document && title !== "") {
			top.document.title = title;
		}
	}

	private init() {
		setTimeout(() => {
			this.updateTitle();
		}, 0);
		this.mutationObserver = new MutationObserver(() => {
			this.updateTitle();
		});
		this.mutationObserver.observe(
			document.querySelector(".list-topheader .top-file-path .file-path")!,
			{
				childList: true,
				subtree: true,
			},
		);
	}

	public destroy() {
		this.mutationObserver.disconnect();
	}
}
