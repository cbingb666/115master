<template>
  <div :class="styles.container.main">
    <div :class="styles.container.content">
      <!-- 源切换 Tab -->
      <div :class="styles.tabs.container">
        <a
          :class="[
            styles.tabs.item,
            activeSource === 'javDBState' ? styles.tabs.active : '',
          ]"
          @click="activeSource = 'javDBState'"
        >
          JavDB
        </a>
        <a
          :class="[
            styles.tabs.item,
            activeSource === 'javBusState' ? styles.tabs.active : '',
          ]"
          @click="activeSource = 'javBusState'"
        >
          JavBus
        </a>
      </div>

      <template v-if="movieInfo.error.value">
        <LoadingError
          :class="styles.states.error"
          :message="movieInfo.error.value"
        />
      </template>

      <!-- 加载中 -->
      <template v-else-if="movieInfo.isLoading.value">
        <div :class="styles.header.container">
          <div :class="styles.header.title">
            <div :class="styles.skeleton.title" />
          </div>
        </div>
        <div :class="styles.actors.container">
          <div v-for="i in 1" :key="i" :class="styles.actors.item">
            <div :class="styles.actors.content">
              <div :class="styles.skeleton.avatar" />
              <div :class="styles.skeleton.name" />
            </div>
          </div>
        </div>
        <div :class="styles.content.container">
          <div v-for="i in 7" :key="i" :class="styles.content.item">
            <div :class="styles.skeleton.contentLine" />
          </div>
        </div>
      </template>

      <template v-else-if="!movieInfo.state.value">
        <Empty
          :class="styles.states.empty"
          description="暂无影片信息，可能番号无法识别"
          size="2xl"
        />
      </template>

      <template v-else>
        <!-- header -->
        <div :key="activeSource" :class="styles.header.container">
          <!-- 标题 -->
          <div :class="styles.header.title">
            <span :class="styles.header.titleText">
              {{ movieInfo.state.value?.title }}
            </span>
          </div>
        </div>

        <!-- 演员列表 -->
        <div :class="styles.actors.container">
          <div v-for="actor in movieInfo.state.value?.actors" :key="actor.name" :class="styles.actors.item">
            <a
              v-if="actor.url"
              :class="styles.actors.content"
              :href="actor.url"
              target="_blank"
            >
              <div :class="styles.actors.avatarWrapper">
                <div :class="styles.actors.avatarContainer">
                  <img :src="actor.face || DEFAULT_AVATAR" :alt="actor.name" :class="styles.actors.avatarImage">
                </div>
                <span
                  v-if="actor.sex !== undefined"
                  :class="[
                    styles.actors.sexBadge.base,
                    actor.sex === 1 ? styles.actors.sexBadge.female : styles.actors.sexBadge.male,
                  ]"
                >
                  {{ actor.sex === 1 ? '♀' : '♂' }}
                </span>
              </div>
              <span :class="styles.actors.name">
                {{ actor.name }}
              </span>
            </a>
            <div
              v-else
              :class="styles.actors.content"
            >
              <div :class="styles.actors.avatarWrapper">
                <div :class="styles.actors.avatarContainer">
                  <img :src="actor.face || DEFAULT_AVATAR" :alt="actor.name" :class="styles.actors.avatarImage">
                </div>
                <span
                  v-if="actor.sex !== undefined"
                  :class="[
                    styles.actors.sexBadge.base,
                    actor.sex === 1 ? styles.actors.sexBadge.female : styles.actors.sexBadge.male,
                  ]"
                >
                  {{ actor.sex === 1 ? '♀' : '♂' }}
                </span>
              </div>
              <span :class="styles.actors.name">
                {{ actor.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- content -->
        <div :class="styles.content.container">
          <div :class="styles.content.item">
            <span :class="styles.content.label">
              番号
            </span>
            <span :class="styles.content.value">
              <a :href="movieInfo.state.value?.detailUrl" target="_blank" :class="styles.content.link">
                {{ movieInfo.state.value?.avNumber ?? '-' }}
              </a>
              <CopyButton
                v-if="movieInfo.state.value?.avNumber"
                :text="movieInfo.state.value?.avNumber"
              />
            </span>
          </div>

          <div :class="styles.content.item">
            <span :class="styles.content.label">
              日期
            </span>
            <span :class="styles.content.value">
              {{ formatDate(movieInfo.state.value?.date) ?? '-' }}
            </span>
          </div>

          <div :class="styles.content.item">
            <span :class="styles.content.label">
              时长
            </span>
            <span :class="styles.content.value">
              {{ formatDuration(movieInfo.state.value?.duration) ?? '-' }}
            </span>
          </div>

          <div :class="styles.content.item">
            <span :class="styles.content.label">
              导演
            </span>
            <span v-if="!movieInfo.state.value?.director" :class="styles.content.value">-</span>
            <span v-else :class="styles.content.value">
              <a v-for="director in movieInfo.state.value?.director" :key="director.name" :href="director.url" target="_blank" :class="styles.content.link">
                {{ director.name }}
              </a>
            </span>
          </div>

          <div :class="styles.content.item">
            <span :class="styles.content.label">
              片商
            </span>
            <span v-if="!movieInfo.state.value?.studio" :class="styles.content.value">-</span>
            <span v-else :class="styles.content.value">
              <a v-for="studio in movieInfo.state.value?.studio" :key="studio.name" :href="studio.url" target="_blank" :class="styles.content.link">
                {{ studio.name }}
              </a>
            </span>
          </div>

          <div :class="styles.content.item">
            <span :class="styles.content.label">
              系列
            </span>
            <span v-if="!movieInfo.state.value?.series" :class="styles.content.value">-</span>
            <span v-else :class="styles.content.value">
              <a v-for="serie in movieInfo.state.value?.series" :key="serie.name" :href="serie.url" target="_blank" :class="styles.content.badge">
                {{ serie.name }}
              </a>
            </span>
          </div>

          <div :class="styles.content.item">
            <span :class="styles.content.label">
              类别
            </span>
            <span v-if="!movieInfo.state.value?.category" :class="styles.content.value">-</span>
            <span v-else :class="styles.content.value">
              <a v-for="category in movieInfo.state.value?.category" :key="category.name" :href="category.url" target="_blank" :class="styles.content.badge">
                {{ category.name }}
              </a>
            </span>
          </div>
        </div>

        <!-- 缩略图 -->
        <div ref="movieInfoThumb" :class="styles.thumbnails.container">
          <a
            v-for="(item) in movieInfo.state.value?.preview"
            :key="item.thumbnail"
            :class="styles.thumbnails.item"
            :href="item.raw"
            target="_blank"
          >
            <img :src="item.raw" alt="thumb" loading="lazy" :class="styles.thumbnails.image">
          </a>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { useDataMovieInfo } from '../../data/useDataMovieInfo'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import { computed, nextTick, ref, watch } from 'vue'
import Empty from '../../../../components/empty/Empty.vue'
import LoadingError from '../../../../components/LoadingError/index.vue'
import { formatDate, formatDuration } from '../../../../utils/format'
import CopyButton from './components/CopyButton.vue'
import 'photoswipe/style.css'

const props = defineProps<{
  movieInfos: ReturnType<typeof useDataMovieInfo>
}>()

const styles = {
  // 容器样式
  container: {
    main: 'relative flex flex-col',
    content: 'flex flex-col gap-8',
  },
  // Tab 样式
  tabs: {
    container: 'tabs tabs-border absolute top-0 right-0',
    item: 'tab',
    active: 'tab-active',
  },
  // Skeleton
  skeleton: {
    title: 'skeleton h-14 w-4/5',
    avatar: 'skeleton w-15 h-15 rounded-full shrink-0',
    name: 'skeleton h-4 w-20',
    contentLine: 'skeleton h-4 w-xs',
  },
  // 状态样式
  states: {
    error: 'my-20 mx-auto',
    empty: 'my-20 mx-auto',
  },
  // 头部样式
  header: {
    container: 'mb-6',
    title: 'text-xl font-bold break-words break-all text-base-content pr-36',
    titleText: '',
  },
  // 演员
  actors: {
    container: 'flex flex-wrap gap-2',
    item: 'relative w-fit',
    content: 'flex items-center gap-3 no-underline w-full',
    avatarWrapper: 'avatar relative',
    avatarContainer: 'w-18 rounded-full',
    avatarImage: 'rounded-full',
    name: 'text-base text-base-content pr-2',
    sexBadge: {
      base: 'absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs rotate-45',
      female: 'bg-pink-400/80',
      male: 'bg-primary/80',
    },
  },
  // 内容样式
  content: {
    container: 'flex flex-col gap-3',
    item: 'flex gap-2 text-sm',
    label: 'text-base-content/50 min-w-10',
    value: 'flex flex-wrap gap-2 items-center',
    link: 'link',
    badge: 'badge badge-neutral rounded-full',
  },
  // 缩略图样式
  thumbnails: {
    container:
      'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-9 gap-3',
    item: 'aspect-square overflow-hidden hover:opacity-80',
    image: 'size-full object-cover',
  },
}

const movieInfoThumb = ref<HTMLElement | null>(null)
const lightbox = ref<PhotoSwipeLightbox | null>(null)
const activeSource = ref<'javDBState' | 'javBusState'>('javDBState')

/** 默认头像（灰色的人形轮廓） */
const DEFAULT_AVATAR
  = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTQuMmMtMi41IDAtNC43MS0xLjI4LTYtMy4yMi4wMy0xLjk5IDQtMy4wOCA2LTMuMDggMS45OSAwIDUuOTcgMS4wOSA2IDMuMDgtMS4yOSAxLjk0LTMuNSAzLjIyLTYgMy4yMnoiLz48L3N2Zz4='

const movieInfo = computed(() => {
  return props.movieInfos[activeSource.value]
})

watch(movieInfoThumb, async () => {
  if (!movieInfoThumb.value)
    return
  lightbox.value?.destroy()
  await nextTick()
  lightbox.value = new PhotoSwipeLightbox({
    gallery: movieInfoThumb.value,
    children: 'a',
    pswpModule: () => import('photoswipe'),
    mouseMovePan: true,
    initialZoomLevel: 'fit',
    wheelToZoom: true,
  })
  lightbox.value.init()
  lightbox.value.addFilter('domItemData', (itemData, element) => {
    itemData.width = element.querySelector('img')?.naturalWidth
    itemData.height = element.querySelector('img')?.naturalHeight
    return itemData
  })
})
</script>
