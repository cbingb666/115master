<template>
	<div class="movie-info">
		<div class="movie-info-main">
			<div class="movie-info-source-switch">
				<div 
					class="movie-info-source-switch-item" 
					:class="{ active: activeSource === 'JavDB' }"
					@click="activeSource = 'JavDB'"
				>
					<span class="movie-info-source-switch-item-text">JavDB</span>
				</div>
				<div 
					class="movie-info-source-switch-item" 
					:class="{ active: activeSource === 'JavBus' }"
					@click="activeSource = 'JavBus'"
				>
					<span class="movie-info-source-switch-item-text">JavBus</span>
				</div>
			</div>

			<template v-if="movieInfo">
				<div class="movie-info-header" :key="activeSource">
					<div class="movie-info-header-title">
						<span class="movie-info-header-title-text">
							{{ movieInfo[activeSource]?.title }}
						</span>
					</div>

					<div class="movie-info-header-file">
						<span class="movie-info-header-file-text">
							{{ fileInfo?.file_name }}
							<span class="movie-info-header-file-text-size">
								{{ formatFileSize(Number(fileInfo?.file_size)) }}
							</span>
						</span>
					</div>

					<div class="movie-info-header-actors">
						<div class="movie-info-header-actors-item" v-for="actor in movieInfo[activeSource]?.actors" :key="actor.name">
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
				<div class="movie-info-content" v-if="movieInfo[activeSource]" :key="activeSource">
					<div class="movie-info-content-item" v-if="movieInfo[activeSource]?.avNumber">
						<span class="movie-info-content-item-label">
							番号：
						</span>
						<span class="movie-info-content-item-value">
							<a :href="movieInfo[activeSource]?.url" target="_blank">
								{{ movieInfo[activeSource]?.avNumber }}
							</a>
						</span>
					</div>

					<div class="movie-info-content-item" v-if="movieInfo[activeSource]?.date">
						<span class="movie-info-content-item-label">
							日期：
						</span>
						<span class="movie-info-content-item-value">
							{{ formatDate(movieInfo[activeSource]?.date) }}
						</span>
					</div>

					<div class="movie-info-content-item" v-if="movieInfo[activeSource]?.duration">
						<span class="movie-info-content-item-label">
							时长：
						</span>
						<span class="movie-info-content-item-value">
							{{ formatDuration(movieInfo[activeSource]?.duration) }}
						</span>
					</div>

					<div class="movie-info-content-item" v-if="movieInfo[activeSource]?.director">
						<span class="movie-info-content-item-label">
							导演：
						</span>
						<span class="movie-info-content-item-value">
							<a v-for="director in movieInfo[activeSource]?.director" :key="director.name" :href="director.url" target="_blank">
								{{ director.name }}
							</a>
						</span>
					</div>

					<div class="movie-info-content-item" v-if="movieInfo[activeSource]?.studio">
						<span class="movie-info-content-item-label">
							片商：
						</span>
						<span class="movie-info-content-item-value">
							<a v-for="studio in movieInfo[activeSource]?.studio" :key="studio.name" :href="studio.url" target="_blank">
								{{ studio.name }}
							</a>
						</span>
					</div>

					<div class="movie-info-content-item" v-if="movieInfo[activeSource]?.series">
						<span class="movie-info-content-item-label">
							系列：
						</span>
						<span class="movie-info-content-item-value">
							<a v-for="serie in movieInfo[activeSource]?.series" :key="serie.name" :href="serie.url" target="_blank">
								{{ serie.name }}
							</a>
						</span>
					</div>

					<div class="movie-info-content-item" v-if="movieInfo[activeSource]?.category">
						<span class="movie-info-content-item-label">
							类别：
						</span>
						<span class="movie-info-content-item-value">
							<a v-for="category in movieInfo[activeSource]?.category" :key="category.name" :href="category.url" target="_blank">
								{{ category.name }}
							</a>
						</span>
					</div>
				</div>
			</template>

			<template v-else>
				<div class="movie-info-header">
					<!-- 标题骨架屏 -->
					<div class="movie-info-header-title">
						<Skeleton width="80%" height="24px" />
					</div>

					<!-- 文件名骨架屏 -->
					<div class="movie-info-header-file">
						<Skeleton width="60%" height="16px" />
					</div>

					<!-- 演员列表骨架屏 -->
					<div class="movie-info-header-actors">
						<div class="movie-info-header-actors-item" v-for="i in 1" :key="i">
							<div class="movie-info-header-actors-item-content">
								<div class="movie-info-header-actors-item-avatar">
									<Skeleton circle width="40px" height="40px" />
								</div>
								<Skeleton width="60px" height="14px" />
							</div>
						</div>
					</div>
				</div>

				<div class="movie-info-content">
					<!-- 基本信息骨架屏 -->
					<div class="movie-info-content-basic">
						<div class="movie-info-content-basic-item" v-for="i in 3" :key="i">
							<Skeleton width="120px" height="16px" />
						</div>
					</div>

					<!-- 其他信息骨架屏 -->
					<div class="movie-info-content-item" v-for="i in 4" :key="i">
						<Skeleton width="200px" height="16px" />
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import Skeleton from "../../../../components/Skeleton/index.vue";
import type { FilesInfo } from "../../../../utils/drive115/api/webApi/res";
import {
	formatDate,
	formatDuration,
	formatFileSize,
} from "../../../../utils/format";
import type { MovieInfo } from "../../data/useDataMovieInfo";

// 默认头像（灰色的人形轮廓）
const DEFAULT_AVATAR =
	"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTQuMmMtMi41IDAtNC43MS0xLjI4LTYtMy4yMi4wMy0xLjk5IDQtMy4wOCA2LTMuMDggMS45OSAwIDUuOTcgMS4wOSA2IDMuMDgtMS4yOSAxLjk0LTMuNSAzLjIyLTYgMy4yMnoiLz48L3N2Zz4=";

const props = defineProps<{
	movieInfo: MovieInfo;
	fileInfo: FilesInfo;
}>();

const activeSource = ref<"JavDB" | "JavBus">("JavDB");
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
	padding-right: 120px;
}

.movie-info-content {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.movie-info-header {
	margin-bottom: 24px;
    padding-right: 100px;
}

.movie-info-header-title {
	font-size: 20px;
	font-weight: bold;
	margin-bottom: 4px;
	word-wrap: break-word;
	word-break: break-all;
	color: #f1f1f1;
}

.movie-info-header-file {
	display: flex;
	gap: 8px;
	font-size: 14px;
}

.movie-info-header-file-text {
	color: #f1f1f1;
}

.movie-info-header-file-text-size {
	color: #999;
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
	width: 40px;
	height: 40px;
}

.movie-info-header-actors-item img {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid #f1f1f1;
}

.movie-info-header-actors-item-name {
	font-size: 14px;
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
	gap: 8px;
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

.movie-info-content-enter-active,
.movie-info-content-leave-active {
	transition: opacity 0.3s ease;
}

.movie-info-content-enter-from,
.movie-info-content-leave-to {
	opacity: 0;
}

.movie-info-content-enter-to,
.movie-info-content-leave-from {
	opacity: 1;
}

.movie-info-content-basic {
	display: flex;
	gap: 24px;
	margin-bottom: 12px;
}

.movie-info-content-basic-item {
	display: flex;
	gap: 8px;
	font-size: 14px;
}
</style>
