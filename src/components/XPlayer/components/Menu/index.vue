<template>
	<Popup
		:visible="visible"
		:x="x"
		:y="y"
		@click.stop
		@mouseenter="handleMouseEnter"
		@mouseleave="handleMouseLeave"
	>
		<div class="x-menu">
			<slot></slot>
		</div>
	</Popup>
</template>

<script setup lang="ts">
import Popup from "../Popup/index.vue";

interface Props {
	visible: boolean;
	x?: number;
	y?: number;
}

defineProps<Props>();
const emit = defineEmits<{
	(e: "mouseenter"): void;
	(e: "mouseleave"): void;
}>();

const handleMouseEnter = () => emit("mouseenter");
const handleMouseLeave = () => emit("mouseleave");
</script>

<style scoped>
.x-menu {
	position: absolute;
	min-width: 200px;
	background: rgba(28, 28, 28, 0.95);
	backdrop-filter: blur(20px);
	border-radius: 8px;
	padding: 6px;
	z-index: 1000;
}

:deep(.menu-item) {
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
	content: "✓";
	margin-left: 8px;
}
</style> 