import { DialogHost, OverlayHost } from '@115master/ui'
import { defineComponent, KeepAlive, onErrorCaptured } from 'vue'
import { RouterView } from 'vue-router'
import { appDialog } from '@/app/dialog'
import {
  GlassDistortionFilter,
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

    return () => (
      <OverlayHost>
        <DndRoot>
          <GlassDistortionFilter></GlassDistortionFilter>
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
      </OverlayHost>
    )
  },
})

export default App
