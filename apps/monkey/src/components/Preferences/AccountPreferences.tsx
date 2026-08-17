import { Button, Image } from '@115master/ui'
import { defineComponent, ref } from 'vue'
import { useAppDialog } from '@/app/dialog'
import { showLogin } from '@/app/login'
import { I, Icon } from '@/icons'
import { useUserAqStore } from '@/store/userAq'
import { drive115 } from '@/utils/drive115Instance'

const AccountPreferences = defineComponent({
  name: 'AccountPreferences',

  emits: {
    loggedOut: () => true,
  },

  setup(_, { emit }) {
    const dialog = useAppDialog()
    const user = useUserAqStore()
    const busy = ref(false)
    const error = ref('')

    async function logout() {
      const confirmed = await dialog.confirm({
        title: '退出登录',
        content: '确定要退出账号吗？',
        confirmText: '确定',
        cancelText: '取消',
      })

      if (!confirmed)
        return

      busy.value = true
      error.value = ''
      try {
        await drive115.auth.logout()
        emit('loggedOut')
        await showLogin('已退出登录，请重新登录。')
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause.message : '退出登录失败，请稍后重试'
      }
      finally {
        busy.value = false
      }
    }

    return () => {
      const data = user.state?.data

      if (!data) {
        return (
          <div class="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
            {user.isLoading
              ? (
                  <>
                    <span class="loading loading-spinner loading-md text-primary" />
                    <p class="text-base-content/60 text-sm">正在加载账号信息…</p>
                  </>
                )
              : (
                  <>
                    <Icon name={I.ERROR} class="text-error text-3xl" />
                    <p class="text-base-content/60 text-sm">
                      {user.error instanceof Error ? user.error.message : '账号信息加载失败'}
                    </p>
                    <Button size="sm" variant="soft" onClick={() => user.execute()}>重新加载</Button>
                  </>
                )}
          </div>
        )
      }

      const uid = String(data.uid)
      const name = data.uname?.trim()
      const displayName = name && name !== uid ? name : ''

      return (
        <div class="flex h-full flex-col gap-4" data-account-preferences>
          <section>
            <div class="flex items-center gap-3">
              <Image
                class="border-base-content/10 size-12 shrink-0 rounded-full border"
                src={data.face?.face_l || ''}
                alt={displayName || '115 用户头像'}
                fit="cover"
                fallback={(
                  <div class="bg-primary/15 text-primary flex size-full items-center justify-center text-lg font-semibold">
                    {displayName.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              />
              <div class="min-w-0">
                {displayName && <p class="text-base-content truncate font-medium">{displayName}</p>}
                <p class={['text-base-content/55 flex items-center gap-1 text-xs', displayName && 'mt-0.5']}>
                  {data.vip?.is_vip && <Icon name={I.STAR_RATING} class="text-warning" />}
                  {data.vip?.is_vip ? (data.vip.desc || 'VIP 用户') : '普通用户'}
                </p>
              </div>
            </div>

            <dl class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div class="bg-base-content/5 min-w-0 rounded-xl px-3 py-2.5">
                <dt class="text-base-content/55 text-xs">UID</dt>
                <dd class="text-base-content mt-1 truncate font-medium">{uid}</dd>
              </div>
              {data.vip?.is_vip && data.vip.expire_str && (
                <div class="bg-base-content/5 min-w-0 rounded-xl px-3 py-2.5">
                  <dt class="text-base-content/55 text-xs">会员到期</dt>
                  <dd class="text-base-content mt-1 truncate font-medium">{data.vip.expire_str}</dd>
                </div>
              )}
            </dl>
          </section>

          <section class="mt-auto flex pt-4 sm:justify-end">
            <Button
              class="w-full sm:w-auto"
              color="error"
              variant="soft"
              loading={busy.value}
              onClick={() => logout()}
            >
              <Icon name={I.LOGOUT} />
              退出登录
            </Button>
          </section>

          {error.value && (
            <div class="bg-error/10 text-error rounded-lg px-3 py-2 text-sm" role="alert">
              {error.value}
            </div>
          )}
        </div>
      )
    }
  },
})

export default AccountPreferences
