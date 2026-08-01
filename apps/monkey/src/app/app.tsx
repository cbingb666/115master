import { DialogHost, OverlayHost, Watermark } from '@115master/ui'
import { GM_info } from 'vite-plugin-monkey/dist/client'
import { defineComponent, KeepAlive, onErrorCaptured } from 'vue'
import { RouterView } from 'vue-router'
import { appDialog } from '@/app/dialog'
import {
  GlobalSearchModal,
  ToastContainer,
  useSponsorBoot,
} from '@/components'
import { DndRoot } from '@/components/Dnd'
import { appLogger } from '@/utils/logger'

const Boot = defineComponent({
  setup() {
    useSponsorBoot()
    return () => null
  },
})

const App = defineComponent({
  name: 'App',
  setup() {
    onErrorCaptured((err, instance, info) => {
      appLogger.error('Vue error captured:', err, instance, info)
      return false
    })

    return () => {
      const content = (
        <DndRoot>
          <DialogHost service={appDialog}>
            <Boot />
            <ToastContainer>
              <GlobalSearchModal />
              <RouterView>
                {{
                  default: ({ Component, route }: any) => {
                    if (!Component)
                      return null
                    if (route.meta?.keepAlive)
                      return <KeepAlive><Component key={route.name as string} /></KeepAlive>
                    return <Component />
                  },
                }}
              </RouterView>
            </ToastContainer>
          </DialogHost>
        </DndRoot>
      )

      return (
        <OverlayHost>
          {content}
          {import.meta.env.DEV && (
            <Watermark
              content={GM_info.script.name}
              class="ui-z-watermark pointer-events-none fixed inset-0"
            />
          )}
        </OverlayHost>
      )
    }
  },
})

export default App
