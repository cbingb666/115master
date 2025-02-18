<template>
	<button @click="actions.togglePlay">
		<span class="material-symbols-rounded">
			{{ state.isPlaying.value ? "pause" : "play_arrow" }}
		</span>
	</button>
</template>

<script setup lang="ts">
import { usePlayerContext } from "../../hooks/useVideoPlayerContext";

const { state, actions } = usePlayerContext();
</script> 