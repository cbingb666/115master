<template>
	<div class="page-container">
		<div class="page-body">
			<div class="page-main">
				<XPlayer
					ref="xplayerRef"
					class="video-player"
					:sources="DataVideoSources.list"
					:subtitles="DataSubtitles.state"
					:onThumbnailRequest="DataThumbnails.onThumbnailRequest"
					:loadingSubtitles="DataSubtitles.isLoading"
					:onSubtitleChange="handleSubtitleChange"
				/>
				<div class="page-flow">
					<FileInfo :fileInfo="DataFileInfo" />
					<div class="local-player">
						<button v-if="isMac" class="page-local-play" @click="handleLocalPlay('iina')">IINA Beta</button>
					</div>
					<MovieInfo 
						:movieInfos="DataMovieInfo"
					/>
					<div class="page-footer">
						<Footer></Footer>
					</div>
				</div>
			</div>
			<div class="page-sider">
				<Playlist class="page-sider-playlist"
					:pickCode="params.pickCode.value"
					:playlist="DataPlaylist"
					@play="handlePlay"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useTitle } from "@vueuse/core";
import { nextTick, onMounted, ref } from "vue";
import type XPlayerInstance from "../../components/XPlayer/index.vue";
import XPlayer from "../../components/XPlayer/index.vue";
import type { Subtitle } from "../../components/XPlayer/types";
import { useParamsVideoPage } from "../../hooks/useParams";
import type { Entity } from "../../utils/drive115";
import Drive115Instance from "../../utils/drive115";
import drive115 from "../../utils/drive115";
import { getAvNumber } from "../../utils/getNumber";
import { isMac } from "../../utils/platform";
import { goToPlayer } from "../../utils/route";
import { subtitlePreference } from "../../utils/subtitlePreference";
import { webLinkIINA, webLinkShortcutsMpv } from "../../utils/weblink";
import FileInfo from "./components/FileInfo/index.vue";
import Footer from "./components/Footer/index.vue";
import MovieInfo from "./components/MovieInfo/index.vue";
import Playlist from "./components/Playlist/index.vue";
import { useDataFileInfo } from "./data/useDataFileInfo";
import { useDataMovieInfo } from "./data/useDataMovieInfo";
import { useDataPlaylist } from "./data/useDataPlaylist";
import { useDataSubtitles } from "./data/useSubtitlesData";
import { useDataThumbnails } from "./data/useThumbnails";
import { useDataVideoSources } from "./data/useVideoSource";

const xplayerRef = ref<InstanceType<typeof XPlayerInstance>>();
const params = useParamsVideoPage();
const DataVideoSources = useDataVideoSources();
const DataThumbnails = useDataThumbnails();
const DataSubtitles = useDataSubtitles();
const DataMovieInfo = useDataMovieInfo();
const DataFileInfo = useDataFileInfo();
const DataPlaylist = useDataPlaylist();

// 处理字幕变化
const handleSubtitleChange = async (subtitle: Subtitle | null) => {
	// 保存字幕选择
	await subtitlePreference.savePreference(
		params.pickCode.value,
		subtitle || null,
	);
};

const handleLocalPlay = async (player: "mpv" | "iina") => {
	const { url } = await drive115.getFileDownloadUrl(params.pickCode.value);
	switch (player) {
		case "mpv":
			open(webLinkShortcutsMpv(url));
			break;
		case "iina":
			xplayerRef.value?.interruptSource();
			setTimeout(() => {
				open(webLinkIINA(url));
			}, 300);
			break;
	}
};

useTitle(params.title.value || "");

const handlePlay = async (item: Entity.PlaylistItem) => {
	goToPlayer({
		cid: params.cid.value,
		pickCode: item.pc,
		title: item.n,
		size: item.s,
		avNumber: getAvNumber(item.n),
	});
	params.getParams();
	DataThumbnails.clear();
	DataVideoSources.cleanup();
	DataSubtitles.execute(0, params.pickCode.value, null);
	DataMovieInfo.value.javDBState.execute(0, null);
	DataMovieInfo.value.javBusState.execute(0, null);
	await nextTick();
	await loadData(false);
};

// 加载数据
const loadData = async (isFirst = true) => {
	DataVideoSources.fetch(params.pickCode.value).then(() => {
		DataThumbnails.initialize(DataVideoSources.list.value);
	});

	Drive115Instance.fakeVodAuthPickcode(params.pickCode.value).then(() => {
		DataFileInfo.execute(0, params.pickCode.value);
		isFirst && DataPlaylist.execute(0, params.cid.value, params.pickCode.value);
	});

	if (params.avNumber.value) {
		DataMovieInfo.value.javDBState.execute(0, params.avNumber.value);
		DataMovieInfo.value.javBusState.execute(0, params.avNumber.value);
		DataSubtitles.execute(0, params.pickCode.value, params.avNumber.value);
	}
};

// 设置标题
useTitle(params.title.value || "");

// 挂载
onMounted(async () => {
	await loadData();
});
</script>

<style>

/* 全局滚动条样式 */
::-webkit-scrollbar {
	width: 8px;
	height: 8px;
	/* display: none !important; */
}

::-webkit-scrollbar-track {
	background: transparent;
}

::-webkit-scrollbar-thumb {
	background: rgba(255, 255, 255, 0.3);
	border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 255, 255, 0.3);
}

/* 隐藏滚动条 */
:fullscreen ::-webkit-scrollbar {
	width: 0 !important;
	height: 0 !important;
	display: none !important
}
</style>

<style scoped>
.page-container {
	padding: 36px 0 56px;
	background: rgb(15,15,15);
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	color: #fff;
	align-items: center;
	--video-player-height: calc(100vh - 36px - 24px * 2 - 28px);
	--page-main-width-a: calc(16 / 9 * (100vh - 36px - 24px * 2 - 28px));
	--page-main-width-b: calc(100vw - 380px - 24px - 36px);
	--page-main-width: min(var(--page-main-width-a), var(--page-main-width-b));
	--video-player-width: var(--page-main-width);
}

.page-local-play {
	display: inline-flex;
	background: #000;
	color: #fff;
	padding: 10px 20px;
	border-radius: 16px;
	cursor: pointer;
}

.page-body {
	display: flex;
	gap: 24px;
}

.page-main {
	display: flex;
	flex-direction: column;
	width: var(--page-main-width);
	gap: 24px;
}

.page-flow {
	display: flex;
	flex-direction: column;
	gap: 24px;
	min-height: 720px;
}

.video-player {
	aspect-ratio: 16 / 9;
	width: var(--video-player-width);
	height: auto;
	border-radius: 16px;
	overflow: hidden;
}

.page-sider-playlist {
	width: 380px;
	height: calc(100vh - 36px - 24px );
	flex: 1;
}

:fullscreen .page-container {
	padding: 0 0 56px;
}

:fullscreen .page-main {
	width: auto;
}

:fullscreen .page-header {
	display: none;
}

:fullscreen .page-flow {
	padding: 0 calc(86px + 380px + 24px) 56px 86px;
	box-sizing: border-box;
}

:fullscreen .page-sider {
	position: absolute;
	top: calc(100vh + 48px + 28px);
	right: 86px;
}

:fullscreen .page-sider-playlist {
	height: 720px;
}

:fullscreen .video-player {
	width: 100vw;
	height: 100vh;
	max-height: none;
	border-radius: 0;
}

</style>
