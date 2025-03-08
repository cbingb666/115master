<template>

	
	<div class="movie-info">
		<div class="movie-info-main">
			<div class="movie-info-source-switch">
				<div 
					class="movie-info-source-switch-item" 
					:class="{ active: activeSource === 'javDBState' }"
					@click="activeSource = 'javDBState'"
				>
					<span class="movie-info-source-switch-item-text">JavDB</span>
				</div>
				<div 
					class="movie-info-source-switch-item" 
					:class="{ active: activeSource === 'javBusState' }"
					@click="activeSource = 'javBusState'"
				>
					<span class="movie-info-source-switch-item-text">JavBus</span>
				</div>
			</div>

			<template v-if="movieInfo.error.value">
				<LoadingError 
					style="margin: 80px auto 40px"
					message="获取影片信息失败，可能由于网络异常或者您没有科学上网"
					:detail="movieInfo.error.value.toString()"
				/>
			</template>

			<template v-else-if="movieInfo.isLoading.value">
				<div class="movie-info-header">
					<div class="movie-info-header-title">
						<Skeleton width="80%" height="56px" />
					</div>
				</div>
				<div class="movie-info-header-actors">
					<div class="movie-info-header-actors-item" v-for="i in 1" :key="i">
						<div class="movie-info-header-actors-item-content">
							<div class="movie-info-header-actors-item-avatar">
								<Skeleton circle width="60px" height="60px" />
							</div>
							<Skeleton width="100px" height="22.5px" />
						</div>
					</div>
				</div>
				<div class="movie-info-content" style="margin-top: 24px">
					<div class="movie-info-content-item" v-for="i in 7" :key="i">
						<Skeleton :width="`${80 + Math.random() * 80}px`" height="20px" />
					</div>
				</div>
			</template>

			<template v-else-if="!movieInfo.state.value">
				<Empty 
					style="margin: 80px auto 40px"
					description="暂无影片信息，可能番号无法识别" 
					:image-size="200"
				/>
			</template>
			
			<template v-else>
				<!-- header -->
				<div class="movie-info-header" :key="activeSource">
					<!-- 标题 -->
					<div class="movie-info-header-title">
						<span class="movie-info-header-title-text">
							{{ movieInfo.state.value?.title }}
						</span>
					</div>
					<!-- 演员列表 -->
					<div class="movie-info-header-actors">
						<div class="movie-info-header-actors-item" v-for="actor in movieInfo.state.value?.actors" :key="actor.name">
							<a 
								class="movie-info-header-actors-item-content"
								:href="actor.url" 
								target="_blank"
								v-if="actor.url"
							>
								<div class="movie-info-header-actors-item-avatar">
									<img :src="actor.face || DEFAULT_AVATAR" :alt="actor.name">
									<span 
										v-if="actor.sex !== undefined"
										class="movie-info-header-actors-item-sex" 
										:class="{ female: actor.sex === 1, male: actor.sex === 0 }"
									>
										{{ actor.sex === 1 ? '♀' : '♂' }}
									</span>
								</div>
								<span class="movie-info-header-actors-item-name">
									{{ actor.name }}
								</span>
							</a>
							<div 
								class="movie-info-header-actors-item-content"
								v-else
							>
								<div class="movie-info-header-actors-item-avatar">
									<img :src="actor.face || DEFAULT_AVATAR" :alt="actor.name">
									<span 
										v-if="actor.sex !== undefined"
										class="movie-info-header-actors-item-sex" 
										:class="{ female: actor.sex === 1, male: actor.sex === 0 }"
									>
										{{ actor.sex === 1 ? '♀' : '♂' }}
									</span>
								</div>
								<span class="movie-info-header-actors-item-name">
									{{ actor.name }}
								</span>
							</div>
						</div>
					</div>
				</div>

				<!-- content -->	
				<div class="movie-info-content">
					<div class="movie-info-content-item">
						<span class="movie-info-content-item-label">
							番号：
						</span>
						<span class="movie-info-content-item-value">
							<a :href="movieInfo.state.value?.detailUrl" target="_blank">
								{{ movieInfo.state.value?.avNumber ?? '-' }}
							</a>
							<CopyButton 
								v-if="movieInfo.state.value?.avNumber" 
								:text="movieInfo.state.value?.avNumber"
							/>
						</span>
					</div>

					<div class="movie-info-content-item">
						<span class="movie-info-content-item-label">
							日期：
						</span>
						<span class="movie-info-content-item-value">
							{{ formatDate(movieInfo.state.value?.date) ?? '-' }}
						</span>
					</div>

					<div class="movie-info-content-item">
						<span class="movie-info-content-item-label">
							时长：
						</span>
						<span class="movie-info-content-item-value">
							{{ formatDuration(movieInfo.state.value?.duration) ?? '-' }}
						</span>
					</div>

					<div class="movie-info-content-item">
						<span class="movie-info-content-item-label">
							导演：
						</span>
						<span class="movie-info-content-item-value" v-if="!movieInfo.state.value?.director">-</span>
						<span class="movie-info-content-item-value" v-else>
							<a v-for="director in movieInfo.state.value?.director" :key="director.name" :href="director.url" target="_blank">
								{{ director.name }}
							</a>
						</span>
					</div>

					<div class="movie-info-content-item">
						<span class="movie-info-content-item-label">
							片商：
						</span>
						<span class="movie-info-content-item-value" v-if="!movieInfo.state.value?.studio">-</span>
						<span class="movie-info-content-item-value" v-else>
							<a v-for="studio in movieInfo.state.value?.studio" :key="studio.name" :href="studio.url" target="_blank">
								{{ studio.name }}
							</a>
						</span>
					</div>

					<div class="movie-info-content-item">
						<span class="movie-info-content-item-label">
							系列：
						</span>
						<span class="movie-info-content-item-value" v-if="!movieInfo.state.value?.series">-</span>
						<span class="movie-info-content-item-value" v-else>
							<a v-for="serie in movieInfo.state.value?.series" :key="serie.name" :href="serie.url" target="_blank">
								{{ serie.name }}
							</a>
						</span>
					</div>

					<div class="movie-info-content-item">
						<span class="movie-info-content-item-label">
							类别：
						</span>
						<span class="movie-info-content-item-value" v-if="!movieInfo.state.value?.category">-</span>
						<span class="movie-info-content-item-value" v-else>
							<a v-for="category in movieInfo.state.value?.category" :key="category.name" :href="category.url" target="_blank">
								{{ category.name }}
							</a>
						</span>
					</div>
				</div>


				<!-- 缩略图 -->
				<div class="movie-info-thumb" ref="movieInfoThumb">
					<a 
						class="movie-info-thumb-item" 
						v-for="(item, index) in movieInfo.state.value?.preview" 
						:key="item.thumbnail"
						:href="item.raw"
						target="_blank"
					>
						<img :src="item.raw" alt="thumb" />
					</a>
				</div>
			</template>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { UseAsyncStateReturn } from "@vueuse/core";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import { computed, nextTick, ref, watch } from "vue";
import LoadingError from "../../../../components/LoadingError/index.vue";
import Skeleton from "../../../../components/Skeleton/index.vue";
import Empty from "../../../../components/empty/Empty.vue";
import { formatDate, formatDuration } from "../../../../utils/format";
import type { JavInfo } from "../../../../utils/jav/jav";
import "photoswipe/style.css";
import CopyButton from "./components/CopyButton.vue";

const props = defineProps<{
	movieInfos: {
		javDBState: UseAsyncStateReturn<JavInfo, [string], true>;
		javBusState: UseAsyncStateReturn<JavInfo, [string], true>;
	};
}>();

const movieInfoThumb = ref<HTMLElement | null>(null);
const lightbox = ref<PhotoSwipeLightbox | null>(null);
const activeSource = ref<"javDBState" | "javBusState">("javDBState");

// 默认头像（灰色的人形轮廓）
const DEFAULT_AVATAR =
	"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTQuMmMtMi41IDAtNC43MS0xLjI4LTYtMy4yMi4wMy0xLjk5IDQtMy4wOCA2LTMuMDggMS45OSAwIDUuOTcgMS4wOSA2IDMuMDgtMS4yOSAxLjk0LTMuNSAzLjIyLTYgMy4yMnoiLz48L3N2Zz4=";

const movieInfo = computed<UseAsyncStateReturn<JavInfo, [string], false>>(
	() => {
		return props.movieInfos[activeSource.value];
	},
);

watch(movieInfoThumb, async () => {
	if (!movieInfoThumb.value) return;
	lightbox.value?.destroy();
	await nextTick();
	lightbox.value = new PhotoSwipeLightbox({
		gallery: movieInfoThumb.value,
		children: ".movie-info-thumb-item",
		pswpModule: () => import("photoswipe"),
		mouseMovePan: true,
		initialZoomLevel: "fit",
		wheelToZoom: true,
	});
	lightbox.value.init();
	lightbox.value.addFilter("domItemData", (itemData, element) => {
		itemData.width = element.querySelector("img")?.naturalWidth;
		itemData.height = element.querySelector("img")?.naturalHeight;
		return itemData;
	});
});
</script>

<style scoped>
.movie-info {
	position: relative;
	display: flex;
	flex-direction: column;
}

.movie-info-main {
	position: relative;
	z-index: 1;
	color: #e1e1e1;
	margin-top: 24px;
}

.movie-info-content {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.movie-info-header {
	margin-bottom: 24px;
}

.movie-info-header-title {
	font-size: 20px;
	font-weight: bold;
	margin-bottom: 4px;
	word-wrap: break-word;
	word-break: break-all;
	color: #f1f1f1;
    padding-right: 140px;
}


.movie-info-content-item {
	display: flex;
	gap: 8px;
	font-size: 14px;
}

.movie-info-content-item-label {
	color: #999;
	min-width: 40px;
}

.movie-info-content-item-value {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}

.movie-info-content-item-value a {
	color: #60a5fa;
	text-decoration: none;
	transition: color 0.2s ease;
}

.movie-info-content-item-value a:hover {
	color: #3b82f6;
}

.movie-info-header-actors {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 16px;
}

.movie-info-header-actors-item {
	position: relative;
	padding: 4px;
	border-radius: 8px;
	width: fit-content;
}

.movie-info-header-actors-item-avatar {
	position: relative;
	width: 60px;
	height: 60px;
}

.movie-info-header-actors-item img {
	width: 60px;
	height: 60px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid #f1f1f1;
	box-sizing: border-box;
}

.movie-info-header-actors-item-name {
	font-size: 16px;
	color: #f1f1f1;
	padding-right: 8px;
}

.movie-info-header-actors-item-sex {
	position: absolute;
	top: -2px;
	right: -2px;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(0, 0, 0, 0.6);
	color: #fff;
	font-size: 12px;
}

.movie-info-header-actors-item-sex.female {
	background-color: rgba(244, 114, 182, 0.8);
}

.movie-info-header-actors-item-sex.male {
	background-color: rgba(59, 130, 246, 0.8);
}

.movie-info-header-actors-item-content {
	display: flex;
	align-items: center;
	gap: 12px;
	text-decoration: none;
	width: 100%;
}

.movie-info-source-switch {
	position: absolute;
	top: 0;
	right: 0;
	display: flex;
	gap: 8px;
	z-index: 2;
}

.movie-info-source-switch-item {
	padding: 6px 12px;
	border-radius: 4px;
	background: rgba(0, 0, 0, 0.5);
	cursor: pointer;
	transition: all 0.2s ease;
}

.movie-info-source-switch-item:hover {
	background: rgba(0, 0, 0, 0.7);
}

.movie-info-source-switch-item.active {
	background: #60a5fa;
}

.movie-info-source-switch-item-text {
	font-size: 12px;
	color: #fff;
}

.movie-info-thumb {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-top: 24px;
}

.movie-info-thumb-item {
	width: calc(12.5% - 12px);
	aspect-ratio: 1 / 1;
	border-radius: 5px;
	overflow: hidden;
	cursor: pointer;
	transition: opacity 0.2s;
	display: block;  /* 因为现在是 <a> 标签 */
	text-decoration: none;
}

.movie-info-thumb-item:hover {
	opacity: 0.8;
}

.movie-info-thumb-item img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
</style>
