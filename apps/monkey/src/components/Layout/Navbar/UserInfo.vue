<!-- 用户信息组件 -->
<template>
  <div v-if="userInfo.state?.state === true" :class="styles.container" data-user-dropdown @click="toggleDropdown">
    <!-- 用户头像（始终显示） -->
    <div :class="styles.avatar">
      <!-- 真实头像 -->
      <img
        v-if="userInfo.state.data.face?.face_l && !imageError"
        :src="userInfo.state.data.face.face_l"
        :alt="userInfo.state.data.uname || '用户头像'"
        :class="styles.avatarImage"
        @error="handleImageError"
      >
      <!-- 头像占位符 -->
      <div
        v-else
        :class="styles.avatarPlaceholder"
      >
        {{ userInfo.state.data.uname?.charAt(0)?.toUpperCase() || 'U' }}
      </div>
    </div>

    <!-- 桌面端用户信息（直接显示） -->
    <div :class="styles.desktopInfo">
      <div :class="styles.username">
        {{ userInfo.state.data.uname || '未知用户' }}
      </div>
      <div v-if="userInfo.state.data.vip?.is_vip" :class="styles.vip">
        <Icon icon="material-symbols:stars-rounded" class="text-yellow-500" />
        {{ userInfo.state.data.vip.desc || 'VIP用户' }}
      </div>
    </div>

    <!-- 移动端下拉菜单 -->
    <div v-if="showDropdown" :class="styles.dropdown" @click.stop>
      <div :class="styles.dropdownContent">
        <!-- 用户信息 -->
        <div :class="styles.dropdownHeader">
          <div :class="styles.dropdownUsername">
            {{ userInfo.state.data.uname || '未知用户' }}
          </div>
          <div v-if="userInfo.state.data.vip?.is_vip" :class="styles.dropdownVip">
            <Icon icon="material-symbols:stars-rounded" class="text-yellow-500" />
            {{ userInfo.state.data.vip.desc || 'VIP用户' }}
          </div>
        </div>

        <!-- 额外信息 -->
        <div :class="styles.dropdownInfo">
          <div :class="styles.dropdownInfoItem">
            <span>用户ID：</span>
            <span>{{ userInfo.state.data.uid }}</span>
          </div>
          <div v-if="userInfo.state.data.vip?.is_vip && userInfo.state.data.vip?.expire_str" :class="styles.dropdownInfoItem">
            <span>会员到期：</span>
            <span>{{ userInfo.state.data.vip.expire_str }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 加载状态 -->
  <div v-else :class="styles.loading">
    <div class="loading loading-spinner loading-sm" />
    <span :class="styles.loadingText">加载中...</span>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useUserAqStore } from '@/store/userAq'
import { clsx } from '@/utils/clsx'

const userInfo = useUserAqStore()
const imageError = ref(false)
const showDropdown = ref(false)

/** 处理头像加载错误 */
function handleImageError() {
  imageError.value = true
}

/** 切换下拉菜单（仅移动端） */
function toggleDropdown() {
  // 检查是否为移动端（屏幕宽度小于 640px，对应 sm 断点）
  if (window.innerWidth < 640) {
    showDropdown.value = !showDropdown.value
  }
}

/** 点击外部关闭下拉菜单 */
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('[data-user-dropdown]')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const styles = clsx({
  container: [
    'relative flex items-center gap-3 px-4 py-2',
    'rounded-lg',
    'hover:bg-base-200/50 transition-colors',
    'cursor-pointer',
    'sm:cursor-default', // 桌面端不需要指针样式
  ],
  avatar: [
    'flex-shrink-0',
  ],
  avatarImage: [
    'h-8 w-8',
    'rounded-full',
    'object-cover',
    'border-base-300 border',
  ],
  avatarPlaceholder: [
    'h-8 w-8',
    'rounded-full',
    'bg-primary/20 text-primary',
    'flex items-center justify-center',
    'text-sm font-semibold',
  ],
  desktopInfo: [
    'hidden flex-col sm:flex', // 移动端隐藏，桌面端显示
    'min-w-0', // 防止文字溢出
  ],
  username: [
    'text-base-content text-sm font-medium',
    'truncate', // 长用户名截断
    'max-w-24', // 限制最大宽度
  ],
  vip: [
    'flex items-center gap-1',
    'text-base-content/70 text-xs',
  ],
  dropdown: [
    'absolute top-full right-0 z-50 mt-2',
    'sm:hidden', // 桌面端隐藏
    'animate-in slide-in-from-top-2 duration-200',
  ],
  dropdownContent: [
    'bg-base-100 border-base-300 rounded-lg border shadow-lg',
    'min-w-64 p-4',
    'backdrop-blur-sm',
  ],
  dropdownHeader: [
    'mb-3 flex flex-col gap-1',
    'border-base-300 border-b pb-3',
  ],
  dropdownUsername: [
    'text-base-content text-base font-semibold',
  ],
  dropdownVip: [
    'flex items-center gap-1',
    'text-base-content/70 text-sm',
  ],
  dropdownInfo: [
    'flex flex-col gap-2',
  ],
  dropdownInfoItem: [
    'flex items-center justify-between',
    'text-sm',
  ],
  loading: [
    'flex items-center gap-2 px-4 py-2',
    'text-base-content/70 text-sm',
  ],
  loadingText: [
    'hidden sm:inline', // 移动端隐藏加载文字
  ],
})
</script>
