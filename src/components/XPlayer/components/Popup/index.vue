<template>
	<Teleport to="body">
		<div 
			v-show="visible"
			class="x-popup"
			:style="style"
			@click.stop
		>
			<slot></slot>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
	visible: boolean;
	x?: number;
	y?: number;
}

const props = withDefaults(defineProps<Props>(), {
	x: 0,
	y: 0,
});

const style = computed(() => ({
	left: `${props.x}px`,
	top: `${props.y}px`,
}));
</script>

<style scoped>
.x-popup {
	position: fixed;
	z-index: 9999;
	background: rgba(28, 28, 28, 0.9);
	border-radius: 4px;
	padding: 8px 0;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}
</style> 