<template>
	<div class="playlist">
		<div class="playlist-item" v-for="item in props.playlist" :key="item.pc"
            :class="{ active: item.pc === props.pickCode }"
            @click="handlePlay(item)"
        >
			<div class="playlist-item-title">
				{{ item.n }} {{ formatFileSize(item.size) }}
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Entity } from "../../../../utils/drive115";
import { formatFileSize } from "../../../../utils/format";

const props = defineProps<{
	playlist: Entity.PlaylistItem[];
	pickCode: string | null;
}>();

const emit = defineEmits<(e: "play", item: Entity.PlaylistItem) => void>();

const handlePlay = (item: Entity.PlaylistItem) => {
	if (item.pc === props.pickCode) {
		return;
	}
	emit("play", item);
};
</script>

<style scoped>
.playlist {
	width: 100%;
	height: 100%;
	background-color: rgba(255, 255, 255, 0.05);
	color: #fff;
	overflow-y: auto;
	padding: 16px;
    box-sizing: border-box;
    border-radius: 16px;
    position: relative;
    z-index: 1;
}

.playlist-item {
	padding: 12px;
	border-radius: 8px;
	transition: background-color 0.2s ease;
	cursor: pointer;
}

.playlist-item:hover {
	background-color: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
	background-color: rgba(255, 255, 255, 0.2);
}

.playlist-item-title {
	font-size: 14px;
	font-weight: 500;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 自定义滚动条样式 */
.playlist::-webkit-scrollbar {
	width: 6px;
}

.playlist::-webkit-scrollbar-track {
	background: transparent;
}

.playlist::-webkit-scrollbar-thumb {
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: 3px;
}

.playlist::-webkit-scrollbar-thumb:hover {
	background-color: rgba(255, 255, 255, 0.3);
}
</style>