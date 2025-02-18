<template>
	<div 
		ref="buttonRef"
		class="quality-button"
		@click="toggleMenu"
	>
		<span>{{ currentQuality }}</span>
		
		<Menu
			:visible="showMenu"
			:triggerRef="buttonRef"
			placement="top"
			@update:visible="handleMenuVisibleChange"
		>
			<div
				v-for="source in sources"
				:key="source.quality"
				class="menu-item"
				:class="{ active: source.quality === currentSource?.quality }"
				@click="handleQualityChange(source)"
			>
				{{ getDisplayQuality(source) }}
			</div>
		</Menu>

	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePlayerContext } from "../../hooks/useVideoPlayerContext";
import type { VideoSource } from "../../types";
import Menu from "../Menu/index.vue";

interface Props {
	sources: VideoSource[];
	currentSource?: VideoSource;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	(e: "change", source: VideoSource): void;
	(e: "menu-visible-change", visible: boolean): void;
}>();

const showMenu = ref(false);
const buttonRef = ref<HTMLElement>();
const { state } = usePlayerContext();

// 监听全屏状态变化，确保菜单位置正确
watch(
	() => state.isFullscreen.value,
	() => {
		if (showMenu.value) {
			showMenu.value = false;
			emit("menu-visible-change", false);
		}
	},
);

const currentQuality = computed(() => {
	if (!props.currentSource) return "自动";
	const quality =
		props.currentSource.displayQuality || props.currentSource.quality;
	return typeof quality === "number" ? `${quality}P` : quality;
});

const toggleMenu = () => {
	showMenu.value = !showMenu.value;
	emit("menu-visible-change", showMenu.value);
};

const handleMenuVisibleChange = (visible: boolean) => {
	showMenu.value = visible;
	emit("menu-visible-change", visible);
};

const getQualityLabel = (quality: number) => {
	switch (quality) {
		case 9999:
			return "原画";
		case 2160:
			return "4K";
		case 1080:
			return "超清";
		case 720:
			return "高清";
		case 480:
			return "标清";
		case 360:
			return "流畅";
		default:
			return "";
	}
};

const getDisplayQuality = (source: VideoSource) => {
	const quality = source.displayQuality || source.quality;
	return typeof quality === "number" ? `${quality}P` : quality;
};

const getLabel = (source: VideoSource) => {
	return source.label || getQualityLabel(source.quality);
};

const handleQualityChange = (source: VideoSource) => {
	emit("change", source);
	showMenu.value = false;
	emit("menu-visible-change", false);
};
</script>

<style scoped>
.quality-button {
	position: relative;
	padding: 6px 12px;
	color: #fff;
	cursor: pointer;
	border-radius: 6px;
	transition: all 0.2s;
	font-size: 14px;
	display: flex;
	align-items: center;
	gap: 4px;
	user-select: none;
}

.quality-button:hover {
	background: rgba(255, 255, 255, 0.15);
}

.tooltip {
	padding: 6px 12px;
	color: #fff;
	font-size: 12px;
	white-space: nowrap;
	background: rgba(28, 28, 28, 0.95);
	backdrop-filter: blur(20px);
	border-radius: 6px;
}

:deep(.menu-item) {
	position: relative;
	padding: 8px 12px;
	color: #fff;
	cursor: pointer;
	transition: all 0.2s;
	font-size: 14px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 6px;
	margin: 2px 0;
}

:deep(.menu-item:hover) {
	background: rgba(255, 255, 255, 0.1);
}

:deep(.menu-item.active) {
	color: var(--x-player-color-primary, #007aff);
	background: rgba(0, 122, 255, 0.1);
}

:deep(.menu-item.active::after) {
	content: "";
	position: absolute;
	right: 12px;
	width: 16px;
	height: 16px;
	background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23007aff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>');
	background-size: contain;
	background-repeat: no-repeat;
	background-position: center;
}
</style> 