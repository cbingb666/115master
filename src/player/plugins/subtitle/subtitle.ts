import { PlayerPlugin } from "..";
import type { Player } from "../..";
import type { PlayingVideoInfo } from "../../../types/player";
import type { ProcessedSubtitle } from "../../../utils/subtitlecat";
import { iconSubtitle } from "../../icons/icons";

type SubtitleState = {
	playingVideoInfo?: PlayingVideoInfo;
	subtitles: ProcessedSubtitle[];
	index: number;
};

/**
 * 字幕插件
 */
export class Subtitle extends PlayerPlugin<SubtitleState> {
	static pluginName = "subtitle";

	constructor(player: Player) {
		super(Subtitle.pluginName, player, {
			playingVideoInfo: undefined,
			subtitles: [],
			index: 0,
		});
	}

	mount() {
		this.registerControlBarButton({
			className: "dplayer-quality-icon subtitle-button",
			buttonHTML: `
            ${iconSubtitle}
            <div class="subtitle-menu"></div>
            `,
		});
		this.state && this.addSubtitleTracks(this.state.subtitles);
	}

	onStateChange() {
		this.state && this.addSubtitleTracks(this.state.subtitles);
	}

	destroy(): void {
		throw new Error("Method not implemented.");
	}

	// 添加字幕轨道
	private addSubtitleTracks(subtitles: ProcessedSubtitle[]) {
		if (!this.player) return;

		const video = this.player.video;
		video.querySelectorAll("track").forEach((track) => {
			track.remove();
		});

		subtitles.forEach((sub, index) => {
			const track = document.createElement("track");
			track.kind = "subtitles";
			track.label = `【${sub.targetLanguage}】${sub.title}`;
			track.srclang = "zh";
			track.src = sub.url;
			track.default = index === this.state.index;
			video.appendChild(track);
		});

		if (video.textTracks.length > 0) {
			video.textTracks[this.state.index].mode = "showing";
			this.player.notice(
				`✅ 字幕加载完成，共 ${video.textTracks.length} 条`,
				2000,
				0.8,
			);
		}
		this.updateMenu(video.textTracks, this.state.index);
	}

	// 更新字幕菜单
	private updateMenu(tracks: TextTrackList, index: number) {
		const menu = document.querySelector(".subtitle-menu");
		if (!menu) return;

		menu.innerHTML = this.renderMenuHTML(tracks, index);
		this.setupMenuEvents(menu);
	}

	// 设置字幕菜单事件
	private setupMenuEvents(menu: Element) {
		menu.querySelectorAll(".subtitle-menu-item").forEach((item: Element) => {
			item.addEventListener("click", this.handleSubtitleClick.bind(this));
		});
	}

	handleSubtitleClick(e: Event) {
		const index = Number.parseInt(
			(e.currentTarget as HTMLElement).dataset.index ?? "-1",
		);
		const tracks = this.player.video.textTracks;
		this.state.index = index;
		for (let i = 0; i < tracks.length; i++) {
			tracks[i].mode = i === index ? "showing" : "hidden";
		}
		this.updateMenu(tracks, index);

		if (index === -1) {
			this.player!.notice("已关闭字幕", 3000, 0.8);
			return;
		}
		this.player!.notice(`✅ 已切换字幕: ${tracks[index].label}`, 2000, 0.8);
	}

	// 渲染字幕菜单HTML
	private renderMenuHTML(tracks: TextTrackList, index: number): string {
		const menuItems = [
			`
            <div class="subtitle-menu-item ${index === -1 ? "active" : ""}" data-index="-1">
                关闭字幕
            </div>
        `,
		];

		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i];
			menuItems.push(`
                <div class="subtitle-menu-item ${
									track.mode === "showing" ? "active" : ""
								}" data-index="${i}">
                    ${track.label}
                </div>
            `);
		}

		return menuItems.join("");
	}
}
