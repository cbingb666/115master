<template>
  <div ref="extInfoRef" :class="styles.container.main">
    <div :class="styles.container.content">
      <!-- 错误状态 -->
      <div v-if="extInfo.error.value" :class="styles.states.error">
        <LoadingError :message="extInfo.error.value" size="mini" />
      </div>

      <!-- 加载骨架 -->
      <template v-else-if="extInfo.isLoading.value || (!extInfo.isLoading.value && !extInfo.isReady.value)">
        <div class="skeleton w-full h-full" />
      </template>

      <!-- 空状态 -->
      <div v-else-if="!extInfo.state.value" :class="styles.states.empty">
        <Empty :description="`未找到番号 [${props.avNumber}] 信息`" size="sm" />
      </div>

      <!-- 内容 -->
      <template v-else-if="extInfo.state.value">
        <div :class="styles.cover.container">
          <a href="javascript:void(0)" :alt="extInfo.state.value?.title" :class="styles.cover.link">
            <Image
              skeleton-mode="light"
              :src="extInfo.state.value?.cover?.url ?? ''"
              :alt="extInfo.state.value?.title ?? ''"
              :referer="extInfo.state.value?.cover?.referer"
              cache
            />
          </a>
        </div>

        <div :class="styles.main.container">
          <div :class="styles.title.container">
            <a
              :href="extInfo.state.value?.detailUrl"
              target="_blank"
              :title="extInfo.state.value?.title"
              :alt="extInfo.state.value?.title"
              :class="styles.title.link"
            >
              {{ extInfo.state.value?.source }} {{ extInfo.state.value?.title }}
            </a>
          </div>

          <div :class="styles.content.container">
            <div :class="styles.content.group">
              <div :class="styles.item.container">
                <span :class="styles.item.label">番号</span>
                <span v-if="extInfo.state.value?.avNumber" :class="styles.item.value">
                  <a
                    :href="extInfo.state.value?.detailUrl"
                    target="_blank"
                    :alt="extInfo.state.value?.title"
                    :class="styles.item.link"
                  >
                    {{ extInfo.state.value?.avNumber }}
                  </a>
                </span>
                <span v-else :class="styles.item.value">-</span>
              </div>

              <div :class="[styles.item.container, styles.secondary]">
                <span :class="styles.item.label">日期</span>
                <span v-if="extInfo.state.value?.date" :class="styles.item.value">
                  {{ formatDate(extInfo.state.value?.date) }}
                </span>
                <span v-else :class="styles.item.value">-</span>
              </div>

              <div :class="[styles.item.container, styles.secondary]">
                <span :class="styles.item.label">时长</span>
                <span v-if="extInfo.state.value?.duration" :class="styles.item.value">
                  {{ formatDuration(extInfo.state.value?.duration) }}
                </span>
                <span v-else :class="styles.item.value">-</span>
              </div>
            </div>

            <div :class="styles.content.group">
              <div :class="styles.item.container">
                <span :class="styles.item.label">演员</span>
                <span v-if="extInfo.state.value?.actors" :class="styles.item.value">
                  <a
                    v-for="actor in extInfo.state.value?.actors"
                    :key="actor.url"
                    :href="actor.url"
                    target="_blank"
                    :alt="actor.name"
                    :class="styles.item.link"
                  >
                    {{ actor.name }}
                  </a>
                </span>
                <span v-else :class="styles.item.value">-</span>
              </div>

              <div :class="[styles.item.container, styles.secondary]">
                <span :class="styles.item.label">导演</span>
                <span v-if="extInfo.state.value?.director" :class="styles.item.value">
                  <a
                    v-for="director in extInfo.state.value?.director"
                    :key="director.url"
                    :href="director.url"
                    target="_blank"
                    :alt="director.name"
                    :class="styles.item.link"
                  >
                    {{ director.name }}
                  </a>
                </span>
                <span v-else :class="styles.item.value">-</span>
              </div>

              <div v-if="extInfo.state.value?.category" :class="[styles.item.container, styles.secondary]">
                <span :class="styles.item.label">分类</span>
                <span v-if="extInfo.state.value?.category" :class="styles.item.value">
                  <a
                    v-for="category in extInfo.state.value?.category"
                    :key="category.url"
                    :href="category.url"
                    target="_blank"
                    :alt="category.name"
                    :class="styles.item.badge"
                  >
                    {{ category.name }}
                  </a>
                </span>
                <span v-else :class="styles.item.value">-</span>
              </div>
            </div>
          </div>
        </div>

        <div :class="styles.meta.avNumber">
          {{ props.avNumber }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncState, useElementVisibility } from '@vueuse/core'
import { onMounted, ref, watch } from 'vue'
import Empty from '../../../../components/empty/Empty.vue'
import Image from '../../../../components/Image/index.vue'
import LoadingError from '../../../../components/LoadingError/index.vue'
import { formatDate, formatDuration } from '../../../../utils/format'
import { Jav, JavBus, JavDB } from '../../../../utils/jav'
import { MissAV } from '../../../../utils/jav/missAV'

const props = defineProps<{
  avNumber: string
}>()
const javBus = new JavBus()
const javDB = new JavDB()
const missAV = new MissAV()

/** 样式常量定义 */
const styles = {
  // 容器样式
  container: {
    main: 'w-full px-20 h-24',
    content: 'relative flex items-center gap-1 group h-full',
  },
  // 状态样式
  states: {
    error: 'flex items-center justify-center flex-1',
    empty: 'flex items-center justify-center flex-1',
  },
  // 封面样式
  cover: {
    container: 'flex items-center justify-center w-36 h-24',
    link: 'block w-full h-full',
  },
  // 主要内容样式
  main: {
    container: 'flex-1 flex flex-col gap-2',
  },
  // 标题样式
  title: {
    container: 'text-md text-neutral-500 ml-2',
    link: 'hover:underline line-clamp-1 hover:text-primary transition-colors',
  },
  // 内容样式
  content: {
    container: 'flex flex-1 items-start gap-5 ml-2',
    group: 'flex flex-col gap-0.5 min-w-32',
  },
  // 项目样式
  item: {
    container: 'flex items-start gap-2 text-xs',
    label: 'w-8 h-5 text-neutral-500 shrink-0',
    value: 'flex flex-1 gap-2 flex-wrap text-neutral-500 line-clamp-1',
    link: 'hover:text-primary transition-colors hover:underline',
    badge: 'bg-neutral-100 hover:bg-neutral-100 rounded px-1 py-[1px] text-xs',
  },
  // 次要信息样式
  secondary: 'opacity-40',
  // 元信息样式
  meta: {
    avNumber: 'absolute right-4 bottom-2 text-xs text-neutral-300',
  },
}

const extInfoRef = ref<HTMLElement>()
const extInfoRefVisible = useElementVisibility(extInfoRef, {
  once: true,
})

const extInfo = useAsyncState(
  async () => {
    const javs = [javBus, javDB, missAV]
    for (const jav of javs) {
      const info = await jav.getInfoByCache(props.avNumber)
      if (info) {
        return info
      }
    }

    for (const [index, jav] of Object.entries(javs)) {
      try {
        return await jav.getInfo(props.avNumber)
      }
      catch (error) {
        if (Number(index) === javs.length - 1) {
          if (error instanceof Jav.NotFound) {
            return null
          }
          throw error
        }
      }
    }
  },
  null,
  {
    immediate: false,
  },
)

watch(extInfoRefVisible, (visible) => {
  if (visible) {
    extInfo.execute(0)
  }
})

onMounted(async () => {})
</script>
