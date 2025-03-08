<template>
    <div class="ext-info " ref="extInfoRef">
        <div class="ext-info-container" >
            <div class="ext-info-error" v-if="extInfo.error.value">
                <LoadingError :message="`获取番号 [${props.avNumber}] 失败`" detail="可能由于网络原因，请检查是否科学网络" />
            </div>
             <!-- loading骨架 -->
            <template v-else-if="extInfo.isLoading.value || (!extInfo.isLoading.value && !extInfo.isReady.value)">
                <div class="ext-info-cover">
                    <Skeleton height="100%" width="100%" mode="light" />
                </div>
                <div class="ext-info-main">
                    <div class="ext-info-header">
                        <Skeleton height="24px" width="80%" mode="light" />
                    </div>
                    <div class="ext-info-content">
                        <div class="ext-info-content__group">
                            <div class="ext-info-item" v-for="i in Array.from({ length: 4}, (_, i) => i)" :key="i">
                                <Skeleton height="24px" :width="`${200 + Math.random() * 200}px`" mode="light" />
                            </div>
                        </div>
                    </div>
                    
                </div>
            </template>
              <!-- 空 -->
            <div class="ext-info-empty" v-else-if="!extInfo.state.value" >
                <Empty style="padding: 0;" :description="`未找到番号 [${props.avNumber}] 信息`" />
            </div>

            <!-- 内容 -->
            <template v-else-if="extInfo.state.value">
                <div class="ext-info-cover">
                    <a href="javascript:void(0)" :alt="extInfo.state.value?.title">
                        <Image skeleton-mode="light" :src="extInfo.state.value?.cover?.url" :alt="extInfo.state.value?.title" :referer="extInfo.state.value?.cover?.referer" />
                    </a>
                </div>
                <div class="ext-info-main">
                    <div class="ext-info-title">
                        <a :href="extInfo.state.value?.detailUrl" target="_blank" :alt="extInfo.state.value?.title">
                            {{ extInfo.state.value?.title }}
                        </a>
                    </div>
                    
                    <div class="ext-info-content">
                        <div class="ext-info-content__group">
                            <div class="ext-info-item">
                                <span class="ext-info-item-label">番号</span>
                                <span class="ext-info-item-value" v-if="extInfo.state.value?.avNumber">
                                    <a :href="extInfo.state.value?.detailUrl" target="_blank" :alt="extInfo.state.value?.title">
                                        {{ extInfo.state.value?.avNumber }}
                                    </a>
                                </span>
                                <span class="ext-info-item-value" v-else>-</span>
                            </div>

                            <div class="ext-info-item">
                                <span class="ext-info-item-label">日期</span>
                                <span class="ext-info-item-value" v-if="extInfo.state.value?.date">
                                    {{ formatDate(extInfo.state.value?.date) }}
                                </span>
                                <span class="ext-info-item-value" v-else>-</span>
                            </div>

                            <div class="ext-info-item">
                                <span class="ext-info-item-label">时长</span>
                                <span class="ext-info-item-value" v-if="extInfo.state.value?.duration">
                                    {{ formatDuration(extInfo.state.value?.duration) }}
                                </span>
                                <span class="ext-info-item-value" v-else>-</span>
                            </div>

                            <div class="ext-info-item">
                                <span class="ext-info-item-label">来源</span>
                                <a class="ext-info-item-value" :href="extInfo.state.value?.baseUrl" target="_blank">
                                    {{ extInfo.state.value?.source }}
                                </a>
                            </div>
                        </div>

                        <div class="ext-info-content__group">
                            <div class="ext-info-item">
                                <span class="ext-info-item-label">演员</span>
                                <span class="ext-info-item-value" v-if="extInfo.state.value?.actors">
                                    <a v-for="actor in extInfo.state.value?.actors" 
                                        :href="actor.url" 
                                        target="_blank"
                                        :alt="actor.name"
                                        :key="actor.url"
                                        >
                                        {{ actor.name }}
                                    </a>
                                </span>
                                <span class="ext-info-item-value" v-else>-</span>
                            </div>

                            <div class="ext-info-item">
                                <span class="ext-info-item-label">导演</span>
                                <span class="ext-info-item-value" v-if="extInfo.state.value?.director">
                                    <a v-for="director in extInfo.state.value?.director" 
                                        :href="director.url" 
                                        target="_blank" 
                                        :alt="director.name"
                                        :key="director.url"
                                        >
                                        {{ director.name }}
                                    </a>
                                </span>
                                <span class="ext-info-item-value" v-else>-</span>
                            </div>

                            <div class="ext-info-item" v-if="extInfo.state.value?.category">
                                <span class="ext-info-item-label">分类</span>
                                <span class="ext-info-item-value" v-if="extInfo.state.value?.category">
                                    <a v-for="category in extInfo.state.value?.category" 
                                        :href="category.url" 
                                        target="_blank" 
                                        :alt="category.name"
                                        :key="category.url"
                                        >
                                        {{ category.name }}
                                    </a>
                                </span>
                                <span class="ext-info-item-value" v-else>-</span>
                            </div>
                        </div>
                    </div>

                   
                </div>
                <div class="ext-info-av-number">
                    {{ props.avNumber }}
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAsyncState, useElementVisibility } from "@vueuse/core";
import { onMounted, ref, watch } from "vue";
import Image from "../../../../components/Image/index.vue";
import LoadingError from "../../../../components/LoadingError/index.vue";
import Skeleton from "../../../../components/Skeleton/index.vue";
import Empty from "../../../../components/empty/Empty.vue";
import { formatDate, formatDuration } from "../../../../utils/format";
import { Jav, JavBus, JavDB } from "../../../../utils/jav";
import { MissAV } from "../../../../utils/jav/missAV";
import { GMRequest } from "../../../../utils/request/gmRequst";

const javBus = new JavBus(new GMRequest());
const javDB = new JavDB(new GMRequest());
const missAV = new MissAV(new GMRequest());

const props = defineProps<{
	avNumber: string;
}>();

const extInfoRef = ref<HTMLElement>();
const extInfoRefVisible = useElementVisibility(extInfoRef, {
	once: true,
});

watch(extInfoRefVisible, (visible) => {
	if (visible) {
		extInfo.execute(0);
	}
});

const extInfo = useAsyncState(
	async () => {
		try {
			return await javBus.getInfoByAvNumber(props.avNumber);
		} catch (error) {
			try {
				return await javDB.getInfoByAvNumber(props.avNumber);
			} catch (error) {
				try {
					return await missAV.getInfoByAvNumber(props.avNumber);
				} catch (error) {
					if (error instanceof Jav.NotFound) {
						return undefined;
					}
					throw error;
				}
			}
		}
	},
	null,
	{
		immediate: false,
	},
);
onMounted(async () => {});
</script>

<style scoped>

.ext-info {
    width: 100%;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    padding-left: 34px;
    padding-right: 74px;

    .ext-info-container {
        position: relative;
        min-height: 212px;
        background-color: #f8f8fa;
        gap: 24px;
        display: flex;
        padding: 16px;
        border-radius: 16px;
        box-sizing: border-box;
    }

    .ext-info-cover {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 267.65px;
        height: 180px;
        overflow: hidden;
        border-radius: 12px;
        box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.1);
        a {
            display: block;
            width: 100%;
            height: 100%;
        }
        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
    .ext-info-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .ext-info-content {
        display: flex;
        flex: 1;
        align-items: flex-start;
    }
    .ext-info-content__group {
        display: flex;
        flex-direction: column;
        row-gap: 12px;
        &:first-of-type {
            min-width: 160px;
        }
    }
    .ext-info-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        .ext-info-item-label {
            width: 32px;
            color: #999;
        }
        .ext-info-item-value {
            display: flex;
            flex: 1;
            column-gap: 8px;
            flex-wrap: wrap;
        }
    }
    .ext-info-title {
        font-size: 18px;
        font-weight: 600;

        a {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }
    .ext-info-av-number {
        position: absolute;
        right: 16px;
        bottom: 8px;
        font-size: 12px;
        color: #999;
        opacity: 0.3;
    }
    .ext-info-error {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
    }
    .ext-info-empty {
       display: flex;
       align-items: center;
       justify-content: center;
       flex: 1;
    }
}
</style>
