<template>
	<div class="subtitle-button">
		<button
			ref="buttonRef"
			class="control-button"
			@click="toggleMenu"
			:title="'字幕'"
		>
			<svg class="subtitle-icon" viewBox="0 0 24 24" width="24" height="24">
				<path fill="currentColor" d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M4,18V6h16v12H4z M6,10h2v2H6V10z M6,14h8v2H6V14z M16,14h2v2h-2V14z M10,10h8v2h-8V10z"/>
			</svg>
		</button>
		<Menu
			v-model:visible="menuVisible"
			:triggerRef="buttonRef"
			placement="top"
			@update:visible="handleMenuVisibleChange"
		>
			<div
				class="menu-item"
				:class="{ active: currentSubtitle === null }"
				@click="handleSubtitleSelect(null)"
			>
				关闭字幕
			</div>
			<div
				v-for="subtitle in subtitles"
				:key="subtitle.url"
				class="menu-item"
				:class="{ active: currentSubtitle?.url === subtitle.url }"
				@click="handleSubtitleSelect(subtitle)"
			>
				{{ subtitle.label }}
			</div>
		</Menu>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Subtitle } from "../../types";
import Menu from "../Menu/index.vue";

interface Props {
	subtitles?: Subtitle[];
	currentSubtitle: Subtitle | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	(e: "change", subtitle: Subtitle | null): void;
	(e: "menu-visible-change", visible: boolean): void;
}>();

const menuVisible = ref(false);
const buttonRef = ref<HTMLElement>();

const toggleMenu = () => {
	menuVisible.value = !menuVisible.value;
	emit("menu-visible-change", menuVisible.value);
};

const handleMenuVisibleChange = (visible: boolean) => {
	menuVisible.value = visible;
	emit("menu-visible-change", visible);
};

const handleSubtitleSelect = (subtitle: Subtitle | null) => {
	emit("change", subtitle);
	menuVisible.value = false;
	emit("menu-visible-change", false);
};
</script>

<style scoped>
.subtitle-button {
	position: relative;
	display: inline-block;
}

.control-button {
	background: none;
	border: none;
	color: #fff;
	cursor: pointer;
	padding: 8px;
	transition: all 0.2s;
}

.control-button:hover {
	opacity: 0.8;
}

.subtitle-icon {
	width: 24px;
	height: 24px;
}
</style> 