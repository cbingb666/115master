<template>
	<Teleport :to="portalContainer" :disabled="!portalContainer">
		<div 
			v-show="visible"
			class="x-popup"
			:style="style"
			@click.stop
		>
			<div class="x-popup-bg"></div>
			<div class="x-popup-content">
				<slot></slot>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";
import { usePortal } from "../../hooks/usePortal";

interface Props {
	visible: boolean;
	x?: number;
	y?: number;
}

const props = withDefaults(defineProps<Props>(), {
	x: 0,
	y: 0,
});

const emit = defineEmits<(e: "update:visible", value: boolean) => void>();

const { container } = usePortal();

const portalContainer = computed(() => container.value || "body");

const style = computed(() => ({
	left: `${props.x}px`,
	top: `${props.y}px`,
	position: container.value ? ("absolute" as const) : ("fixed" as const),
}));

// 处理点击外部
const handleClickOutside = (event: MouseEvent) => {
	if (props.visible) {
		emit("update:visible", false);
	}
};

// 监听点击事件
watch(
	() => props.visible,
	(visible) => {
		if (visible) {
			// 使用 nextTick 确保当前点击事件不会立即触发关闭
			setTimeout(() => {
				document.addEventListener("click", handleClickOutside);
			}, 0);
		} else {
			document.removeEventListener("click", handleClickOutside);
		}
	},
	{ immediate: true },
);

// 组件卸载时清理事件监听
onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.x-popup {
	z-index: 9999;
	border-radius: 8px;
	position: relative;
	overflow: hidden;
}

.x-popup-bg {
	position: absolute;
	inset: 0;
	background: rgba(28, 28, 28, 0.7);
	backdrop-filter: blur(20px) saturate(180%);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.x-popup-content {
	position: relative;
	z-index: 1;
}
</style> 