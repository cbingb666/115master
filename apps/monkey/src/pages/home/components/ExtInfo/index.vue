<template>
  <div ref="extInfoRef" :class="styles.container.main">
    <div :class="styles.container.content">
      <!-- 错误状态 -->
      <div v-if="extInfo.error.value" :class="styles.states.error">
        <LoadingError :message="extInfo.error.value" size="mini" />
      </div>

      <!-- 加载骨架 -->
      <template v-else-if="extInfo.isLoading.value || (!extInfo.isLoading.value && !extInfo.isReady.value)">
        <div class="skeleton h-full w-full" />
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
import {
  Empty,
  Image,
  LoadingError,
} from '@/components'
import { clsx } from '@/utils/clsx'
import { formatDate, formatDuration } from '@/utils/format'
import { Jav, JavBus, JavDB } from '@/utils/jav'
import { MissAV } from '@/utils/jav/missAV'

const props = defineProps<{
  avNumber: string
}>()
const javBus = new JavBus()
const javDB = new JavDB()
const missAV = new MissAV()

/** 样式常量定义 */
const styles = clsx({
  // 容器样式
  container: {
    main: 'h-24 w-full px-20',
    content: 'group relative flex h-full items-center gap-1',
  },
  // 状态样式
  states: {
    error: 'flex flex-1 items-center justify-center',
    empty: 'flex flex-1 items-center justify-center',
  },
  // 封面样式
  cover: {
    container: 'flex h-24 w-36 items-center justify-center',
    link: 'block h-full w-full',
  },
  // 主要内容样式
  main: {
    container: 'flex flex-1 flex-col gap-2',
  },
  // 标题样式
  title: {
    container: 'text-md ml-2 text-neutral-500',
    link: 'hover:text-primary line-clamp-1 transition-colors hover:underline',
  },
  // 内容样式
  content: {
    container: 'ml-2 flex flex-1 items-start gap-5',
    group: 'flex min-w-32 flex-col gap-0.5',
  },
  // 项目样式
  item: {
    container: 'flex items-start gap-2 text-xs',
    label: 'h-5 w-8 shrink-0 text-neutral-500',
    value: 'line-clamp-1 flex flex-1 flex-wrap gap-2 text-neutral-500',
    link: 'hover:text-primary transition-colors hover:underline',
    badge: 'rounded bg-neutral-100 px-1 py-[1px] text-xs hover:bg-neutral-100',
  },
  // 次要信息样式
  secondary: 'opacity-40',
  // 元信息样式
  meta: {
    avNumber: 'absolute right-4 bottom-2 text-xs text-neutral-300',
  },
})

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
