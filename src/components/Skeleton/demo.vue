<template>
    <div class="skeleton-demo">
        <!-- 头像骨架屏 -->
        <Skeleton circle width="40px" height="40px" />

        <!-- 标题骨架屏 -->
        <Skeleton width="70%" height="24px" />

        <!-- 段落骨架屏 -->
        <div class="skeleton-demo-paragraph">
            <Skeleton width="100%" height="16px" />
            <Skeleton width="90%" height="16px" />
            <Skeleton width="80%" height="16px" />
        </div>

        <!-- 列表项骨架屏 -->
        <div class="skeleton-demo-list">
            <div class="skeleton-demo-list-item" v-for="i in 3" :key="i">
                <Skeleton circle width="32px" height="32px" />
                <div class="skeleton-demo-list-item-content">
                    <Skeleton width="120px" height="16px" />
                    <Skeleton width="200px" height="14px" />
                </div>
            </div>
        </div>

        <!-- 卡片骨架屏 -->
        <div class="skeleton-demo-card">
            <Skeleton width="100%" height="160px" />
            <div class="skeleton-demo-card-content">
                <Skeleton width="60%" height="20px" />
                <Skeleton width="40%" height="16px" />
                <Skeleton width="80%" height="16px" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import Skeleton from "./index.vue";
</script>

<style scoped>
.skeleton-demo {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    max-width: 600px;
}

.skeleton-demo-paragraph {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.skeleton-demo-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.skeleton-demo-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.skeleton-demo-list-item-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.skeleton-demo-card {
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
}

.skeleton-demo-card-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
</style> 