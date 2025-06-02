<template>
	<div :class="styles.container.main">
		<!-- Drawer 容器 -->
		<div :class="styles.drawer.main">
			<!-- Drawer toggle checkbox -->
			<input 
				id="playlist-drawer" 
				type="checkbox" 
				:class="styles.drawer.toggle"
				:checked="preferences.showPlaylist"
				@change="togglePlaylist"
			/>
			
			<!-- Drawer content (主内容区域) -->
			<div :class="styles.drawer.content">
				<div :class="styles.container.pageMain"
					
				>
					<div :class="[
						styles.player.container,
						preferences.showPlaylist && styles.player.containerFold,
					]">
						<!-- 视频播放器 -->
						<XPlayer
							ref="xplayerRef"
							:class="[styles.player.video]"
							:style="{
								aspectRatio,
							}"
							v-model:showPlaylist="preferences.showPlaylist"
							v-model:volume="preferences.volume"
							v-model:muted="preferences.muted"
							v-model:playbackRate="preferences.playbackRate"
							v-model:autoLoadThumbnails="preferences.autoLoadThumbnails"
							v-model:disabledHDR="preferences.disabledHDR"
							v-model:thumbnailsSamplingInterval="preferences.thumbnailsSamplingInterval"
							v-model:autoPlay="preferences.autoPlay"
							:sources="DataVideoSources.list"
							:subtitles="DataSubtitles.state"
							:lastTime="DataHistory.lastTime.value"
							:subtitlesLoading="DataSubtitles.isLoading"
							:subtitlesReady="DataSubtitles.isReady"
							:onThumbnailRequest="DataThumbnails.onThumbnailRequest"
							:onSubtitleChange="handleSubtitleChange"
							:onTimeupdate="handleTimeupdate"
							:onSeeking="DataHistory.handleSeek"
							:onSeeked="DataHistory.handleSeek"
							:onCanplay="handleStartAutoBuffer"
						>
							<template #header-left>
								<HeaderInfo 
									:fileInfo="DataFileInfo" 
								/>
							</template>
							<template #controls-right>
								<!-- 播放列表切换按钮 -->
								<label
									for="playlist-drawer"
									:class="[
										styles.controls.btn.root,
										preferences.showPlaylist && 'btn-active btn-primary',
									]" 
									data-tip="播放列表(B)"
								>
									<Icon :icon="ICON_PLAYLIST" :class="[styles.controls.btn.icon]"></Icon>
								</label>
								
								<!-- 收藏按钮 -->
								<button
									v-if="DataFileInfo.isReady"
									:class="[styles.controls.btn.root, 'swap swap-rotate', {
										'swap-active': !DataMark.isMark.value,
									}]"
									data-tip="收藏"
									@click="handleMark"
								>
									<Icon
										:class="[
											styles.controls.btn.icon,
											'swap-off',
										]"
										:icon="ICON_STAR_FILL"
									/>
									<Icon
										:class="[
											styles.controls.btn.icon,
											'swap-on',
										]"
										:icon="ICON_STAR"
									/>
								</button>

								<!-- IINA 播放按钮 -->
								<button 
									v-if="isMac && DataFileInfo.isReady" 
									:class="styles.controls.btn.root"
									data-tip="IINA"
									@click="handleLocalPlay('iina')"
								>
									<img
										:class="styles.controls.iinaIcon"
										:src="iinaIcon"
										alt="IINA"
									/>
								</button>
							</template>
							<template #about-content>
								<About />
							</template>
						</XPlayer>
					</div>
				</div>
				
				<!-- 页面下方内容 -->
				<div v-if="PLUS_VERSION" :class="styles.container.pageFlow">
					<!-- 电影信息 -->
					<MovieInfo 
						:movieInfos="DataMovieInfo"
					/>
				</div>
			</div>
			
			<!-- Drawer side (播放列表侧边栏) -->
			<div :class="styles.drawer.side">
				<!-- Drawer overlay -->
				<label 
					for="playlist-drawer" 
					aria-label="close sidebar" 
					:class="styles.drawer.overlay"
				></label>
				
				<!-- 播放列表内容 -->
				<Playlist
					:class="styles.playlist"
					:pickCode="params.pickCode.value"
					:playlist="DataPlaylist"
					:visible="preferences.showPlaylist"
					@play="handleChangeVideo"
					@close="handleClosePlaylist"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useTitle } from "@vueuse/core";
import { computed, nextTick, onMounted, ref, shallowRef } from "vue";
import iinaIcon from "../../assets/icons/iina-icon.png";
import type XPlayerInstance from "../../components/XPlayer/index.vue";
import XPlayer from "../../components/XPlayer/index.vue";
import { controlRightStyles } from "../../components/XPlayer/styles/common";
import type { Subtitle } from "../../components/XPlayer/types";
import { PLUS_VERSION } from "../../constants";
import { useParamsVideoPage } from "../../hooks/useParams";
import { ICON_PLAYLIST, ICON_STAR, ICON_STAR_FILL } from "../../icons";
import { subtitlePreference } from "../../utils/cache/subtitlePreference";
import type { Entity } from "../../utils/drive115";
import { drive115 } from "../../utils/drive115";
import { getAvNumber } from "../../utils/getNumber";
import { isMac } from "../../utils/platform";
import { goToPlayer } from "../../utils/route";
import { webLinkIINA, webLinkShortcutsMpv } from "../../utils/weblink";
import About from "./components/About/index.vue";
import HeaderInfo from "./components/HeaderInfo/index.vue";
import MovieInfo from "./components/MovieInfo/index.vue";
import Playlist from "./components/Playlist/index.vue";
import { useDataFileInfo } from "./data/useDataFileInfo";
import { useDataHistory } from "./data/useDataHistory";
import { useMark } from "./data/useDataMark";
import { useDataMovieInfo } from "./data/useDataMovieInfo";
import { useDataPlaylist } from "./data/useDataPlaylist";
import { usePreferences } from "./data/usePreferences";
import { useDataSubtitles } from "./data/useSubtitlesData";
import { useDataThumbnails } from "./data/useThumbnails";
import { useDataVideoSources } from "./data/useVideoSource";

const styles = {
	// 容器样式
	container: {
		main: [
			"flex flex-col items-center",
			"min-h-screen gap-5",
			"bg-base-100 text-gray-100",
			"sm:[--app-xplayer-ratio:0.3] md:[--app-xplayer-ratio:0.518] lg:[--app-xplayer-ratio:0.618] 2xl:[--app-xplayer-ratio:0.718]",
			"[--app-playlist-ratio:calc(1-var(--app-xplayer-ratio))]",
			"[--app-xplayer-width:calc(100%*var(--app-xplayer-ratio))]",
			"[--app-playlist-width:calc(100%*var(--app-playlist-ratio))]",
		],
		showPlaylist: "show-playlist",
		pageMain: ["relative w-full h-screen overflow-hidden"],
		pageFlow: "flex flex-col gap-8 px-6 xl:px-36 py-8 w-full",
	},
	// 抽屉样式
	drawer: {
		main: "drawer drawer-end",
		content: "drawer-content",
		side: "drawer-side",
		overlay: "drawer-overlay",
		toggle: "drawer-toggle",
	},
	// 播放器样式
	player: {
		container:
			"relative w-full h-screen flex items-center justify-center transition-all duration-200 ease-in-out transform-gpu",
		containerFold: "w-(--app-xplayer-width)!",
		video: "absolute m-auto w-full h-full overflow-hidden",
	},
	// 播放列表样式
	playlist: "w-(--app-playlist-width)!",
	// 控制样式
	controls: {
		btn: controlRightStyles.btn,
		iinaIcon: "size-8 grayscale invert contrast-200",
	},
};

// 播放器 Ref
const xplayerRef = ref<InstanceType<typeof XPlayerInstance>>();
// 偏好设置
const preferences = usePreferences();
// 参数
const params = useParamsVideoPage();
// 视频源
const DataVideoSources = useDataVideoSources();
// 缩略图
const DataThumbnails = useDataThumbnails(preferences);
// 字幕
const DataSubtitles = useDataSubtitles();
// 番号信息
const DataMovieInfo = useDataMovieInfo();
// 文件信息
const DataFileInfo = useDataFileInfo();
// 播放列表
const DataPlaylist = useDataPlaylist();
// 历史记录
const DataHistory = useDataHistory();
// 收藏
const DataMark = useMark(DataFileInfo);
// 是否正在切换视频
const changeing = shallowRef(false);
// 视频尺寸
const videoSize = computed(() => {
	return {
		width: Number(DataFileInfo.state?.width) ?? 1920,
		height: Number(DataFileInfo.state?.height) ?? 1080,
	};
});
// 视频比例
const videoRatio = computed(() => {
	return videoSize.value.width / videoSize.value.height;
});
// 播放器比例
const aspectRatio = computed(() => {
	if (videoRatio.value < 1) {
		return "1/1";
	}

	if (videoRatio.value > 1.78) {
		return "16/10";
	}

	return `${videoSize.value.width} / ${videoSize.value.height}`;
});

// 处理字幕变化
const handleSubtitleChange = async (subtitle: Subtitle | null) => {
	// 保存字幕选择
	await subtitlePreference.savePreference(
		params.pickCode.value ?? "",
		subtitle || null,
	);
};

// 本地播放
const handleLocalPlay = async (player: LocalPlayer) => {
	if (!params.pickCode.value) {
		throw new Error("pickCode is required");
	}
	const download = await drive115.getFileDownloadUrl(params.pickCode.value);
	switch (player) {
		case "mpv":
			open(webLinkShortcutsMpv(download));
			break;
		case "iina":
			xplayerRef.value?.interruptSource();
			setTimeout(() => {
				open(webLinkIINA(download));
			}, 300);
			break;
	}
};

// 播放器列表切换
const handleChangeVideo = async (item: Entity.PlaylistItem) => {
	try {
		changeing.value = true;
		if (!params.cid.value) {
			throw new Error("cid is required");
		}
		goToPlayer({
			cid: params.cid.value,
			pickCode: item.pc,
		});
		params.getParams();
		DataVideoSources.clear();
		DataThumbnails.clear();
		DataHistory.clear();
		DataSubtitles.execute(0, params.pickCode.value, null);
		if (PLUS_VERSION) {
			DataMovieInfo.javDBState.execute(0);
			DataMovieInfo.javBusState.execute(0);
		}
		await nextTick();
		await loadData(false);
	} finally {
		changeing.value = false;
	}
};

// 开始自动缓冲缩略图
const handleStartAutoBuffer = () => {
	DataThumbnails.autoBuffer();
};

// 处理时间更新
const handleTimeupdate = (time: number) => {
	if (changeing.value) {
		return;
	}
	if (!DataHistory.isinit.value) {
		return;
	}
	if (time <= 0) {
		return;
	}
	DataHistory.handleTimeupdate(time);
	if (!params.pickCode.value) {
		throw new Error("pickCode is required");
	}
	DataPlaylist.updateItemTime(params.pickCode.value, time);
};

// 关闭播放列表
const handleClosePlaylist = () => {
	preferences.value.showPlaylist = false;
};

// 切换播放列表
const togglePlaylist = () => {
	preferences.value.showPlaylist = !preferences.value.showPlaylist;
};

// 加载数据
const loadData = async (isFirst = true) => {
	if (!params.pickCode.value) {
		throw new Error("pickCode is required");
	}
	if (!params.cid.value) {
		throw new Error("cid is required");
	}
	try {
		await DataHistory.fetch(params.pickCode.value);
	} catch (error) {
		console.error(error);
	}
	// 加载视频源
	DataVideoSources.fetch(params.pickCode.value).then(() => {
		// 初始化缩略图
		DataThumbnails.initialize(
			DataVideoSources.list.value,
			preferences.value.thumbnailsSamplingInterval,
		);
	});

	// 加载文件信息
	DataFileInfo.execute(0, params.pickCode.value).then((res) => {
		const avNumber = getAvNumber(res.file_name);
		// 设置标题
		useTitle(DataFileInfo.state.file_name || "");
		// 加载番号信息
		if (avNumber) {
			DataMovieInfo.javDBState.execute(0, avNumber);
			DataMovieInfo.javBusState.execute(0, avNumber);
		}
		// 加载字幕
		DataSubtitles.execute(0, params.pickCode.value, avNumber);
	});

	// 加载播放列表
	isFirst && DataPlaylist.execute(0, params.cid.value);
};

// 挂载
onMounted(async () => {
	await loadData();
});

// 处理收藏
const handleMark = async () => {
	// 切换星标
	await DataMark.toggleMark();
	// 更新播放列表项星标
	DataPlaylist.updateItemMark(
		DataFileInfo.state.pick_code,
		!!DataMark.isMark.value,
	);
};
</script>