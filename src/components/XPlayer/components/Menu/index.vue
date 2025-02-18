<template>
	<Popup
		:visible="visible"
		:x="menuPosition.x"
		:y="menuPosition.y"
		@click.stop
		@mouseenter="handleMouseEnter"
		@mouseleave="handleMouseLeave"
		@update:visible="$emit('update:visible', $event)"
	>
		<div class="x-menu" ref="menuRef">
			<slot></slot>
		</div>
	</Popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Popup from "../Popup/index.vue";

interface Props {
	visible: boolean;
	triggerRef?: HTMLElement;
	placement?: "top" | "bottom";
	offset?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	(e: "mouseenter"): void;
	(e: "mouseleave"): void;
	(e: "update:visible", value: boolean): void;
}>();

const menuRef = ref<HTMLElement>();
const forceUpdate = ref(0);

const menuPosition = computed(() => {
	forceUpdate.value; // 用于强制更新位置

	if (!props.triggerRef || !menuRef.value) return { x: 0, y: 0 };

	// 获取触发元素和菜单的尺寸
	const triggerRect = props.triggerRef.getBoundingClientRect();
	const menuRect = menuRef.value.getBoundingClientRect();

	// 获取播放器容器
	const playerContainer = props.triggerRef.closest(".x-player");
	if (!playerContainer) return { x: 0, y: 0 };

	const playerRect = playerContainer.getBoundingClientRect();

	// 计算触发元素相对于播放器的位置
	const triggerLeft = triggerRect.left - playerRect.left;
	const triggerTop = triggerRect.top - playerRect.top;
	const triggerBottom = triggerRect.bottom - playerRect.top;

	// 计算可用空间
	const spaceBelow = playerRect.height - triggerBottom;
	const spaceAbove = triggerTop;

	// 默认偏移量
	const offset = props.offset ?? 8;

	// 确定垂直位置
	let y: number;
	if (
		props.placement === "top" ||
		(props.placement !== "bottom" &&
			spaceBelow < menuRect.height &&
			spaceAbove >= menuRect.height)
	) {
		y = triggerTop - menuRect.height - offset;
	} else {
		y = triggerBottom + offset;
	}

	// 确保菜单不会超出播放器右侧边界
	const x = Math.min(triggerLeft, playerRect.width - menuRect.width - 16);

	return { x, y };
});

// 监听全屏状态变化
watch(
	() => props.visible,
	(visible) => {
		if (visible) {
			// 给浏览器一点时间来完成 DOM 更新
			setTimeout(() => {
				forceUpdate.value++;
			}, 0);
		}
	},
);

const handleMouseEnter = () => emit("mouseenter");
const handleMouseLeave = () => emit("mouseleave");
</script>

<style scoped>
.x-menu {
	min-width: 200px;
	padding: 8px;
	background: rgba(28, 28, 28, 0.95);
	backdrop-filter: blur(20px);
	border-radius: 8px;
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