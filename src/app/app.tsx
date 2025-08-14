import { defineComponent, KeepAlive } from 'vue'
import { RouterView } from 'vue-router'
import { DialogContainer, ToastContainer } from '@/components'

export default defineComponent({
  name: 'App',
  setup() {
    return () => (
      <>
        <svg style="display: none">
          <filter
            id="glass-distortion"
            filterUnits="objectBoundingBox"
            height="100%"
            width="100%"
            x="0%"
            y="0%"
          >
            <feTurbulence
              baseFrequency="0.01 0.01"
              numOctaves="1"
              result="turbulence"
              seed="5"
              type="fractalNoise"
            />
            <feComponentTransfer in="turbulence" result="mapped">
              <feFuncR
                amplitude="1"
                exponent="10"
                offset="0.5"
                type="gamma"
              />
              <feFuncG
                amplitude="0"
                exponent="1"
                offset="0"
                type="gamma"
              />
              <feFuncB
                amplitude="0"
                exponent="1"
                offset="0.5"
                type="gamma"
              />
            </feComponentTransfer>

            <feGaussianBlur
              in="turbulence"
              result="softMap"
              stdDeviation="3"
            />

            <feSpecularLighting
              in="softMap"
              lighting-color="white"
              result="specLight"
              specularConstant="1"
              specularExponent="100"
              surfaceScale="5"
            >
              <fePointLight
                x="-200"
                y="-200"
                z="300"
              />
            </feSpecularLighting>

            <feComposite
              in="specLight"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              operator="arithmetic"
              result="litImage"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="softMap"
              scale="150"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        <DialogContainer>
          <ToastContainer>
            <RouterView>
              {{
                default: ({ Component, route }: any) => (
                  <>
                    <KeepAlive>
                      {
                        route.meta?.keepAlive && (
                          <Component key={route.fullPath} />
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
