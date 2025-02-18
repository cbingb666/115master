<template>
	<Transition name="fade">
		<div 
			v-if="visible"
			class="play-animation"
		>
			<div class="play-animation-icon">
				<div class="icon-wrapper">
					<svg 
						v-if="state.isPlaying.value" 
						class="icon" 
						viewBox="0 0 24 24"
					>
						<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
					</svg>
					<svg 
						v-else 
						class="icon" 
						viewBox="0 0 24 24"
					>
						<path d="M8 5v14l11-7z"/>
					</svg>
				</div>
			</div>
		</div>
	</Transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { usePlayerContext } from "../../hooks/useVideoPlayerContext";

const { state } = usePlayerContext();
const visible = ref(false);
const timer = ref<number | null>(null);

// 监听播放状态变化
watch(
	() => state.isPlaying.value,
	() => {
		// 显示动画
		visible.value = true;

		// 清除之前的定时器
		if (timer.value) {
			clearTimeout(timer.value);
		}

		// 设置新的定时器，800ms 后隐藏动画
		timer.value = window.setTimeout(() => {
			visible.value = false;
		}, 800);
	},
);
</script>

<style scoped>
.play-animation {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 10;
	pointer-events: none;
}

.play-animation-icon {
	width: 80px;
	height: 80px;
	background-color: rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon-wrapper {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.icon {
	width: 100%;
	height: 100%;
	fill: #fff;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translate(-50%, -50%) scale(0.8);
}

.fade-enter-to,
.fade-leave-from {
	opacity: 1;
	transform: translate(-50%, -50%) scale(1);
}
</style> 