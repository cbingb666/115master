<template>
	<div>
		<XPlayer 
			:sources="DataVideoSources.list"
			:onThumbnailRequest="DataThumbnails.getThumbnailAtTime"
			:subtitles="subtitleList"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import XPlayer from "../../components/XPlayer/index.vue";
import { useParamsVideoPage } from "../../hooks/useParams";
import { useDataSubtitles } from "./data/useSubtitlesData";
import { useDataThumbnails } from "./data/useThumbnails";
import { useDataVideoSources } from "./data/useVideoSource";

const { pickCode, avNumber } = useParamsVideoPage();
const DataVideoSources = useDataVideoSources();
const DataThumbnails = useDataThumbnails();
const DataSubtitles = useDataSubtitles();

const subtitleList = computed(() =>
	DataSubtitles.subtitles.value.map((subtitle, index) => ({
		url: subtitle.url,
		label: subtitle.title,
		srclang: subtitle.targetLanguage,
		kind: "subtitles" as const,
		default: index === 0,
	})),
);

onMounted(async () => {
	await DataVideoSources.fetch(pickCode.value);
	await DataSubtitles.fetch(avNumber.value);
	await DataThumbnails.initialize(DataVideoSources.list.value);
});

onUnmounted(() => {
	DataThumbnails.cleanup();
});
</script>

