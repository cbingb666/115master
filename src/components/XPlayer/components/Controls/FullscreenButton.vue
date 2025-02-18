<template>
	<button @click="actions.toggleFullscreen">
		<span class="material-symbols-rounded">
			{{ state.isFullscreen.value ? "fullscreen_exit" : "fullscreen" }}
		</span>
	</button>
</template>

<script setup lang="ts">
import { usePlayerContext } from "../../hooks/useVideoPlayerContext";

const { state, actions } = usePlayerContext();
</script>