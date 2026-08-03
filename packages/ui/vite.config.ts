import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'

const root = resolve(__dirname, 'src')
const assets = [
  ['styles/index.css', 'styles/index.css'],
  ['styles/themes.css', 'styles/themes.css'],
  ['styles/tokens.css', 'styles/tokens.css'],
  ['styles/glass.css', 'styles/glass.css'],
  ['styles/drawer.css', 'styles/drawer.css'],
  ['styles/header.css', 'styles/header.css'],
  ['components/index.css', 'components/index.css'],
  ['components/Button/Button.css', 'components/Button/Button.css'],
  ['components/Dialog/Dialog.css', 'components/Dialog/Dialog.css'],
  ['components/NavigationStack/NavigationStack.css', 'components/NavigationStack/NavigationStack.css'],
  ['components/Pill/Pill.css', 'components/Pill/Pill.css'],
  ['components/Scrollbar/Scrollbar.css', 'components/Scrollbar/Scrollbar.css'],
  ['components/Tooltip/Tooltip.css', 'components/Tooltip/Tooltip.css'],
  ['components/Watermark/Watermark.css', 'components/Watermark/Watermark.css'],
] as const

function styles(): Plugin {
  return {
    name: 'ui-compilable-styles',
    buildStart() {
      assets.forEach(([source]) => this.addWatchFile(resolve(root, source)))
    },
    generateBundle() {
      assets.forEach(([source, target]) => {
        this.emitFile({
          type: 'asset',
          fileName: target,
          source: readFileSync(resolve(root, source)),
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), vueJsx(), tailwindcss(), styles()],
  build: {
    target: 'es2020',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', '@floating-ui/vue'],
    },
  },
})
