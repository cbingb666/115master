<template>
	<div class="page-container">
		<div class="page-body">
			<div class="page-main">
				<XPlayer
					class="video-player"
					:sources="DataVideoSources.list"
					:onThumbnailRequest="DataThumbnails.getThumbnailAtTime"
					:subtitles="DataSubtitles.subtitles.value"
				/>
				<div class="page-flow">
					<MovieInfo 
					:movieInfo="DataMovieInfo.movieInfo.value" 
					:fileInfo="DataFileInfo.fileInfo.value" 
				/>
					<Comments :comments="DataMovieInfo.movieInfo.value?.JavDB?.comments ?? []" />
				</div>

				<div class="page-footer">
					<Footer></Footer>
				</div>
			</div>
			<div class="page-sider">
				<Playlist class="page-sider-playlist" :pickCode="params.pickCode.value" :playlist="DataPlaylist.playlist.value" @play="handlePlay" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted } from "vue";
import XPlayer from "../../components/XPlayer/index.vue";
import { useParamsVideoPage } from "../../hooks/useParams";
import type { Entity } from "../../utils/drive115";
import { getAvNumber } from "../../utils/getNumber";
import { goToPlayer } from "../../utils/route";
import Comments from "./components/Comments/index.vue";
import Footer from "./components/Footer/index.vue";
import MovieInfo from "./components/MovieInfo/index.vue";
import Playlist from "./components/Playlist/index.vue";
import { useDataFileInfo } from "./data/useDataFileInfo";
import { useDataMovieInfo } from "./data/useDataMovieInfo";
import { useDataPlaylist } from "./data/useDataPlaylist";
import { useDataSubtitles } from "./data/useSubtitlesData";
import { useDataThumbnails } from "./data/useThumbnails";
import { useDataVideoSources } from "./data/useVideoSource";

const params = useParamsVideoPage();
const DataVideoSources = useDataVideoSources();
const DataThumbnails = useDataThumbnails();
const DataSubtitles = useDataSubtitles();
const DataMovieInfo = useDataMovieInfo();
const DataFileInfo = useDataFileInfo();
const DataPlaylist = useDataPlaylist();

const handlePlay = async (item: Entity.PlaylistItem) => {
	goToPlayer({
		cid: params.cid.value,
		pickCode: item.pc,
		title: item.n,
		size: item.size,
		avNumber: getAvNumber(item.n),
	});
	params.getParams();
	DataVideoSources.cleanup();
	DataThumbnails.cleanup();
	DataSubtitles.cleanup();
	DataMovieInfo.cleanup();
	DataFileInfo.cleanup();
	await nextTick();
	await loadData(false);
};

const loadData = async (isFirstLoad = true) => {
	await DataVideoSources.fetch(params.pickCode.value);
	Promise.all([
		DataFileInfo.fetch(params.pickCode.value),
		DataPlaylist.fetch({
			cid: params.cid.value,
			pickcode: params.pickCode.value,
		}),
		DataMovieInfo.fetch(params.avNumber.value),
		DataThumbnails.initialize(DataVideoSources.list.value),
		DataSubtitles.fetch(params.avNumber.value),
	]);
};

onMounted(async () => {
	await loadData();
});

onUnmounted(() => {
	DataVideoSources.cleanup();
	DataThumbnails.cleanup();
	DataSubtitles.cleanup();
	DataMovieInfo.cleanup();
	DataFileInfo.cleanup();
	DataPlaylist.cleanup();
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
	padding: 56px 86px 56px;
	background: rgb(15,15,15);
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	color: #fff;
}

.page-body {
	display: flex;
	gap: 24px;
}

.page-main {
	display: flex;
	flex-direction: column;
	width: 1280px;
	gap: 24px;
}



.page-flow {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.video-player {
	width: 1280px;
	height: 720px;
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 0 500px 100px rgba(125, 125, 125, 0.15);
}

.page-sider-playlist {
	width: 420px;
	height: 720px;
}

:fullscreen .page-container {
	padding: 0;
}

:fullscreen .page-flow {
	padding: 0 86px 56px;
	box-sizing: border-box;
}

:fullscreen .page-sider {
	margin-top: calc(100vh + 24px);
}

:fullscreen .video-player {
	width: 100vw;
	height: 100vh;
	border-radius: 0;
}
</style>
