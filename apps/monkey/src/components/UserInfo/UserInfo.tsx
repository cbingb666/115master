import { Icon } from '@iconify/vue'
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { useUserAqStore } from '@/store/userAq'

/**
 * 用户信息组件
 */
export const UserInfo = defineComponent({
  name: 'UserInfo',
  setup: () => {
    const userInfo = useUserAqStore()
    const imageError = ref(false)
    const showDropdown = ref(false)

    function handleImageError() {
      imageError.value = true
    }

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

    return () => {
      // 加载状态
      if (userInfo.state?.state !== true || !userInfo.state.data) {
        return (
          <div class="text-base-content/70 flex items-center gap-2 px-4 py-2 text-sm">
            <div class="loading loading-spinner loading-sm" />
            <span class="hidden sm:inline">加载中...</span>
          </div>
        )
      }

      const data = userInfo.state.data

      return (
        <div
          class="hover:bg-base-200/50 relative flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2 transition-colors sm:cursor-default"
          data-user-dropdown
          onClick={toggleDropdown}
        >
          {/* 用户头像（始终显示） */}
          <div class="shrink-0">
            {data.face?.face_l && !imageError.value
              ? (
                  <img
                    src={data.face.face_l}
                    alt={data.uname || '用户头像'}
                    class="border-base-300 h-8 w-8 rounded-full border object-cover"
                    onError={handleImageError}
                  />
                )
              : (
                  <div class="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                    {data.uname?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
          </div>

          {/* 桌面端用户信息（直接显示） */}
          <div class="hidden min-w-0 flex-col sm:flex">
            <div class="text-base-content max-w-24 truncate text-sm font-medium">
              {data.uname || '未知用户'}
            </div>
            {data.vip?.is_vip && (
              <div class="text-base-content/70 flex items-center gap-1 text-xs">
                <Icon icon="material-symbols:stars-rounded" class="text-yellow-500" />
                {data.vip.desc || 'VIP用户'}
              </div>
            )}
          </div>

          {/* 移动端下拉菜单 */}
          {showDropdown.value && (
            <div
              class="animate-in slide-in-from-top-2 absolute top-full right-0 z-50 mt-2 duration-200 sm:hidden"
              onClick={(e: Event) => e.stopPropagation()}
            >
              <div class="border-base-300 bg-base-100 min-w-64 rounded-lg border p-4 shadow-lg backdrop-blur-sm">
                {/* 用户信息 */}
                <div class="border-base-300 mb-3 flex flex-col gap-1 border-b pb-3">
                  <div class="text-base-content text-base font-semibold">
                    {data.uname || '未知用户'}
                  </div>
                  {data.vip?.is_vip && (
                    <div class="text-base-content/70 flex items-center gap-1 text-sm">
                      <Icon icon="material-symbols:stars-rounded" class="text-yellow-500" />
                      {data.vip.desc || 'VIP用户'}
                    </div>
                  )}
                </div>

                {/* 额外信息 */}
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between text-sm">
                    <span>用户ID：</span>
                    <span>{data.uid}</span>
                  </div>
                  {data.vip?.is_vip && data.vip?.expire_str && (
                    <div class="flex items-center justify-between text-sm">
                      <span>会员到期：</span>
                      <span>{data.vip.expire_str}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }
  },
})

export default UserInfo
