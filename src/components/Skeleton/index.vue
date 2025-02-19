<template>
    <div 
        class="skeleton" 
        :class="{
            circle,
            'skeleton-animated': animated
        }"
        :style="{
            width,
            height,
            borderRadius
        }"
    >
        <slot></slot>
    </div>
</template>

<script lang="ts" setup>
withDefaults(
	defineProps<{
		width?: string;
		height?: string;
		circle?: boolean;
		borderRadius?: string;
		animated?: boolean;
	}>(),
	{
		width: "100%",
		height: "16px",
		circle: false,
		borderRadius: "4px",
		animated: true,
	},
);
</script>

<style scoped>
.skeleton {
    display: inline-block;
    position: relative;
    overflow: hidden;
    vertical-align: middle;
    background: rgba(255, 255, 255, 0.1);
}

.skeleton.circle {
    border-radius: 50% !important;
}

.skeleton-animated::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0) 100%
    );
    animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}
</style> 