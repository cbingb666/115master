<template>
	<div class="speed-button">
		<button 
			class="control-button"
			@click="toggleSpeedMenu"
		>
			{{ state.playbackRate.value }}x
		</button>
		<Transition name="fade">
			<div 
				v-if="isMenuVisible"
				class="speed-menu"
				@mouseleave="hideMenu"
			>
				<div class="speed-menu-items">
					<button
						v-for="rate in playbackRates"
						:key="rate"
						class="speed-menu-item"
						:class="{ active: state.playbackRate.value === rate }"
						@click="handleSpeedChange(rate)"
					>
						{{ rate }}x
					</button>
				</div>
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { usePlayerContext } from "../../hooks/useVideoPlayerContext";

const { state, actions } = usePlayerContext();
const isMenuVisible = ref(false);

// 预设的倍速选项
const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// 切换菜单显示
const toggleSpeedMenu = () => {
	isMenuVisible.value = !isMenuVisible.value;
};

// 隐藏菜单
const hideMenu = () => {
	isMenuVisible.value = false;
};

// 处理倍速变化
const handleSpeedChange = (rate: number) => {
	actions.setPlaybackRate(rate);
	hideMenu();
};
</script>

<style scoped>
.speed-button {
	position: relative;
	margin-right: 8px;
}

.control-button {
	background: none;
	border: none;
	color: #fff;
	cursor: pointer;
	padding: 4px 8px;
	font-size: 13px;
	border-radius: 4px;
	transition: background-color 0.2s;
}

.control-button:hover {
	background-color: rgba(255, 255, 255, 0.1);
}

.speed-menu {
	position: absolute;
	bottom: 100%;
	right: 0;
	margin-bottom: 8px;
	background-color: rgba(28, 28, 28, 0.9);
	border-radius: 4px;
	padding: 8px 0;
	min-width: 120px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.speed-menu-items {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.speed-menu-item {
	background: none;
	border: none;
	color: #fff;
	cursor: pointer;
	padding: 6px 16px;
	text-align: left;
	font-size: 13px;
	transition: background-color 0.2s;
	width: 100%;
}

.speed-menu-item:hover {
	background-color: rgba(255, 255, 255, 0.1);
}

.speed-menu-item.active {
	color: var(--x-player-controller-progress-bar-color);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translateY(4px);
}

.fade-enter-to,
.fade-leave-from {
	opacity: 1;
	transform: translateY(0);
}
</style> 