import { defineComponent, KeepAlive, onErrorCaptured } from 'vue'
import { RouterView } from 'vue-router'
import {
  DialogContainer,
  GlassDistortionFilter,
  ToastContainer,
} from '@/components'
import { appLogger } from '@/utils/logger'

const App = defineComponent({
  name: 'App',
  setup() {
    onErrorCaptured((err, instance, info) => {
      appLogger.error('Vue error captured:', err, instance, info)
      return false
    })
    return () => (
      <>
        <GlassDistortionFilter></GlassDistortionFilter>
        <DialogContainer>
          <ToastContainer>
            <RouterView>
              {{
                default: ({ Component, route }: any) => (
                  <>
                    <KeepAlive>
                      {
                        route.meta?.keepAlive && (
                          <Component key={route.name as string} />
                        )
                      }
                    </KeepAlive>
                    {
                      !route.meta?.keepAlive && (
                        <Component />
                      )
                    }
                  </>
                ),
              }}
            </RouterView>
          </ToastContainer>
        </DialogContainer>
      </>
    )
  },
})

export default App
