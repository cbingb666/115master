<template>
	<div class="loading-container">
		<div class="loading-backdrop"></div>
		<div class="loading-effect">
			<div class="loader">
				<div class="loader-ring outer"></div>
				<div class="loader-ring inner"></div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.loading-container {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;
}

.loading-backdrop {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(15, 15, 15, 0.8);
}

.loading-effect {
	position: relative;
	z-index: 2;
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
}

.loader {
	position: relative;
	width: 48px;
	height: 48px;
	animation: scale-in 0.3s ease-out  both;
}

.loader-ring {
	position: absolute;
	border-radius: 50%;
	border: 2px solid transparent;
}

.outer {
	width: 100%;
	height: 100%;
	border-top-color: rgba(255, 255, 255, 0.8);
	border-right-color: rgba(255, 255, 255, 0.6);
	animation: spin 1.5s linear infinite;
	box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.inner {
	width: 70%;
	height: 70%;
	top: 15%;
	left: 15%;
	border-bottom-color: rgba(255, 255, 255, 0.8);
	border-left-color: rgba(255, 255, 255, 0.6);
	animation: spin-reverse 1s linear infinite;
	box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

@keyframes spin-reverse {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(-360deg);
	}
}

@keyframes scale-in {
	0% {
		transform: scale(0.5);
		opacity: 0;
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes fade-in {
	0% {
		opacity: 0;
		backdrop-filter: blur(0);
	}
	100% {
		opacity: 1;
		backdrop-filter: blur(20px) saturate(180%);
	}
}
</style> 