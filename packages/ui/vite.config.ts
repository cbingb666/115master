import type { Plugin } from 'vite'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, normalizePath } from 'vite'

const root = resolve(__dirname, 'src')
const directories = ['styles', 'components'] as const

function styles(): Plugin {
  const assets = () => directories
    .flatMap(directory => readdirSync(resolve(root, directory), {
      recursive: true,
      withFileTypes: true,
    }))
    .filter(file => file.isFile() && file.name.endsWith('.css'))
    .map(file => normalizePath(relative(root, join(file.parentPath, file.name))))
    .sort()

  return {
    name: 'ui-compilable-styles',
    buildStart() {
      directories.forEach(directory => this.addWatchFile(resolve(root, directory)))
    },
    generateBundle() {
      assets().forEach((file) => {
        this.emitFile({
          type: 'asset',
          fileName: file,
          source: readFileSync(resolve(root, file)),
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
      entry: resolve(root, 'index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', '@floating-ui/vue'],
    },
  },
})
