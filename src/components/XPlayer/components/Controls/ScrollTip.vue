<template>
	<div class="scroll-tip" :class="{ 'show': isVisible }">
		<div class="scroll-tip-content">
            <span>往下滚动有惊喜</span>
			<span class="icon">👇</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import { usePlayerContext } from "../../hooks/usePlayer";

const { fullscreen } = usePlayerContext();
const isVisible = ref(false);
const timer = ref<number | null>(null);

// 监听全屏变化
watch(
	() => fullscreen.isFullscreen.value,
	(newVal) => {
		if (newVal) {
			isVisible.value = true;
			timer.value = window.setTimeout(() => {
				isVisible.value = false;
			}, 2000);
		} else {
			isVisible.value = false;
			if (timer.value) {
				window.clearTimeout(timer.value);
				timer.value = null;
			}
		}
	},
);

onUnmounted(() => {
	if (timer.value) {
		window.clearTimeout(timer.value);
		timer.value = null;
	}
});
</script>

<style scoped>
.scroll-tip {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, 0);
    z-index: 3;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.scroll-tip.show {
    opacity: 1;
    visibility: visible;
}

.scroll-tip-content {
    display: flex;
    align-items: center;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
}

.scroll-tip-content span {
    margin: 4px 0;
}

.icon {
    font-size: 24px;
    animation: bounce 1s infinite;
}

@keyframes bounce {
    0%, 100% {
        transform: translateY(-1px);
    }
    50% {
        transform: translateY(1px);
    }
}
</style>