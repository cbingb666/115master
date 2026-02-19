import { defineComponent, KeepAlive } from 'vue'
import { RouterView } from 'vue-router'
import {
  DialogContainer,
  GlassDistortionFilter,
  ToastContainer,
} from '@/components'

const App = defineComponent({
  name: 'App',
  setup() {
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
