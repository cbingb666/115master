<template>
	<svg class="loading-bar" viewBox="0 0 100 2" preserveAspectRatio="none">
		<line 
			x1="0" 
			y1="1" 
			x2="100" 
			y2="1" 
			stroke="#666" 
			stroke-width="2"
			stroke-linecap="round"
		/>
		<line 
			x1="0" 
			y1="1" 
			x2="100" 
			y2="1" 
			stroke="#fff" 
			stroke-width="2"
			stroke-linecap="round"
			class="loading-progress"
		/>
	</svg>
</template>

<style scoped>
.loading-bar {
	width: 100%;
	height: 100%;
}

.loading-progress {
	stroke-dasharray: 100;
	stroke-dashoffset: 100;
	animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
	0% {
		stroke-dashoffset: 100;
	}
	50% {
		stroke-dashoffset: -100;
	}
	100% {
		stroke-dashoffset: -300;
	}
}
</style> 