<template>
	<div class="volume-control">
		<button class="volume-control-button" @click="actions.toggleMute">
			<span class="material-symbols-rounded">
				{{ state.isMuted.value ? "volume_off" : "volume_up" }}
			</span>
		</button>
		<div class="volume-slider">
			<div class="volume-slider-track">
				<div 
					class="volume-slider-fill"
					:style="{ width: `${state.volume.value}%` }"
				></div>
				<input
					type="range"
					min="0"
					max="100"
					:value="state.volume.value"
					@input="handleVolumeChange"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { usePlayerContext } from "../../hooks/useVideoPlayerContext";

const { state, actions } = usePlayerContext();

const handleVolumeChange = (event: Event) => {
	const value = Number((event.target as HTMLInputElement).value);
	actions.setVolume(value);
};
</script>

<style scoped>
.volume-control {
	display: flex;
	align-items: center;
	gap: 8px;
}

.volume-control-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	padding: 4px;
	border: none;
	background: transparent;
	cursor: pointer;
	color: white;
}

.volume-control-button:hover {
	opacity: 0.8;
}

.volume-slider {
	width: 80px;
	display: flex;
	align-items: center;
}

.volume-slider-track {
	position: relative;
	width: 100%;
	height: var(--x-player-volume-control-height);
}

.volume-slider-fill {
	position: absolute;
	height: 100%;
	background-color: var(--x-player-volume-control-fill-color);
	border-radius: calc(var(--x-player-volume-control-height) / 2);
	pointer-events: none;
}

.volume-slider input[type="range"] {
	position: absolute;
	width: 100%;
	height: 100%;
	background: var(--x-player-volume-control-track-color);
	border-radius: calc(var(--x-player-volume-control-height) / 2);
	outline: none;
	cursor: pointer;
	margin: 0;
	padding: 0;
}

.volume-slider input[type="range"]::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: var(--x-player-volume-control-thumb-size);
	height: var(--x-player-volume-control-thumb-size);
	border-radius: 50%;
	background: var(--x-player-volume-control-thumb-color);
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;
	z-index: 1;
}

.volume-slider input[type="range"]::-webkit-slider-thumb:hover {
	transform: scale(1.2);
}

.volume-slider input[type="range"]::-moz-range-thumb {
	width: var(--x-player-volume-control-thumb-size);
	height: var(--x-player-volume-control-thumb-size);
	border: none;
	border-radius: 50%;
	background: var(--x-player-volume-control-thumb-color);
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;
	z-index: 1;
}

.volume-slider input[type="range"]::-moz-range-thumb:hover {
	transform: scale(1.2);
}

.volume-slider input[type="range"]::-ms-thumb {
	width: var(--x-player-volume-control-thumb-size);
	height: var(--x-player-volume-control-thumb-size);
	border-radius: 50%;
	background: var(--x-player-volume-control-thumb-color);
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;
	z-index: 1;
}

.volume-slider input[type="range"]::-ms-thumb:hover {
	transform: scale(1.2);
}

.material-symbols-rounded {
	font-size: 24px;
}
</style> 