<template>
	<div class="comments">
		<div class="comments-header">
			<h3 class="comments-title">评论</h3>
		</div>
		<div class="comments-list" v-if="comments?.length">
			<div class="comments-item" v-for="comment in comments" :key="comment.time">
				<div class="comments-item-header">
					<div class="comments-item-user">
						<img 
							v-if="comment.avatar" 
							:src="comment.avatar" 
							:alt="comment.name"
							class="comments-item-avatar"
						>
						<div v-else class="comments-item-avatar comments-item-avatar-default">
							{{ comment.name?.[0]?.toUpperCase() || '?' }}
						</div>
						<span class="comments-item-name">{{ comment.name || '匿名用户' }}</span>
					</div>
					<div class="comments-item-meta">
						<div class="comments-item-score">
							<span 
								v-for="i in 5" 
								:key="i" 
								class="comments-item-score-star"
								:class="{ active: i <= comment.score }"
							>★</span>
						</div>
						<span class="comments-item-time">{{ formatDate(comment.time) }}</span>
					</div>
				</div>
				<div class="comments-item-content">{{ comment.content }}</div>
				<div class="comments-item-footer">
					<div class="comments-item-likes">
						<span class="comments-item-likes-icon">👍</span>
						<span class="comments-item-likes-count">{{ comment.likeCount }}</span>
					</div>
				</div>
			</div>
		</div>
		<div class="comments-empty" v-else>
            👨‍💻 开发中，敬请期待！
		</div>
	</div>
</template>

<script setup lang="ts">
import { formatDate } from "../../../../utils/format";

type Comment = {
	content: string;
	name: string;
	avatar?: string;
	score: number;
	time: number;
	likeCount: number;
};

defineProps<{
	comments?: Comment[];
}>();
</script>

<style scoped>
.comments {
	display: flex;
	flex-direction: column;
	gap: 16px;
	color: #e1e1e1;
}

.comments-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.comments-title {
	font-size: 18px;
	font-weight: 500;
	color: #f1f1f1;
	margin: 0;
}

.comments-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.comments-item {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background-color: rgba(255, 255, 255, 0.05);
	border-radius: 8px;
}

.comments-item-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.comments-item-user {
	display: flex;
	align-items: center;
	gap: 8px;
}

.comments-item-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	object-fit: cover;
}

.comments-item-avatar-default {
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #60a5fa;
	color: #fff;
	font-weight: 500;
	font-size: 16px;
}

.comments-item-name {
	font-size: 14px;
	color: #f1f1f1;
}

.comments-item-meta {
	display: flex;
	align-items: center;
	gap: 12px;
}

.comments-item-score {
	display: flex;
	gap: 2px;
}

.comments-item-score-star {
	color: #666;
	font-size: 14px;
}

.comments-item-score-star.active {
	color: #fbbf24;
}

.comments-item-time {
	font-size: 12px;
	color: #999;
}

.comments-item-content {
	font-size: 14px;
	line-height: 1.6;
	color: #e1e1e1;
	white-space: pre-wrap;
	word-break: break-all;
}

.comments-item-footer {
	display: flex;
	justify-content: flex-end;
}

.comments-item-likes {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	color: #999;
}

.comments-item-likes-icon {
	font-size: 14px;
}

.comments-empty {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 32px;
	color: #999;
	font-size: 14px;
	background-color: rgba(255, 255, 255, 0.05);
	border-radius: 8px;
}
</style>