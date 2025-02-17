<template>
	<div>
		<XPlayer :sources="videoSources.list"/>
	</div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import XPlayer from "../../components/XPlayer/index.vue";
import { useParamsVideoPage } from "../../hooks/useParams";
import { useFetchVideoSources } from "./data/useVideoSource";
const { pickCode, avNumber } = useParamsVideoPage();

const videoSources = useFetchVideoSources();

onMounted(async () => {
	await videoSources.fetch(pickCode.value);
	console.log(videoSources.list.value);
});
</script>

