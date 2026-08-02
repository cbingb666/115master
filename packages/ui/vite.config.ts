import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'

const root = resolve(__dirname, 'src/styles')
const assets = [
  ['index.css', 'styles.css'],
  ['themes.css', 'themes.css'],
  ['tokens.css', 'tokens.css'],
  ['glass.css', 'glass.css'],
  ['components.css', 'components.css'],
  ['button.css', 'button.css'],
  ['dialog.css', 'dialog.css'],
  ['navigation-stack.css', 'navigation-stack.css'],
  ['pill.css', 'pill.css'],
  ['scrollbar.css', 'scrollbar.css'],
  ['watermark.css', 'watermark.css'],
  ['../components/Tooltip/Tooltip.css', 'tooltip.css'],
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
