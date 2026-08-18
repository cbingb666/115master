import { DialogHost, ModalHost, OverlayHost, Watermark } from '@115master/ui'
import { GM_info } from 'vite-plugin-monkey/dist/client'
import { defineComponent, onErrorCaptured } from 'vue'
import { RouterView } from 'vue-router'
import { appDialog } from '@/app/dialog'
import {
  GlobalSearchModal,
  ToastContainer,
  useSponsorBoot,
} from '@/components'
import { DndRoot } from '@/components/Dnd'
import { PreferencesDialog } from '@/components/Preferences'
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
              <PreferencesDialog />
              <RouterView />
            </ToastContainer>
          </DialogHost>
        </DndRoot>
      )

      return (
        <OverlayHost>
          <ModalHost>
            {content}
            {import.meta.env.DEV && (
              <Watermark
                content={GM_info.script.name}
                opacity={0.09}
                class="ui-z-watermark pointer-events-none fixed inset-0"
              />
            )}
          </ModalHost>
        </OverlayHost>
      )
    }
  },
})

export default App
