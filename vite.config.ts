import transformer from '@libmedia/cheap/build/transformer'
import typescript from '@rollup/plugin-typescript'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import monkey, { cdn, util } from 'vite-plugin-monkey'
import svgLoader from 'vite-svg-loader'
import PKG from './package.json'

// eslint-disable-next-line node/prefer-global/process
const env = process.env

const icons = {
  prod: 'https://115.com/favicon.ico',
  dev: 'https://vitejs.dev/logo.svg',
}
const isProd = env.NODE_ENV === 'production'
const isAnalyze = env.ANALYZE === 'true'
const _cdn = cdn.jsdelivrFastly

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: true,
  },
  optimizeDeps: {
    exclude: ['@libmedia/avplayer'],
  },
  plugins: [
    typescript({
      // ref: https://zhaohappy.github.io/libmedia/docs/guide/quick-start#%E7%BC%96%E8%AF%91%E9%85%8D%E7%BD%AE
      // 配置使用的 tsconfig.json 配置文件
      // include 中需要包含要处理的文件
      tsconfig: './tsconfig.app.json',
      transformers: {
        before: [
          {
            type: 'program',
            factory: (program) => {
              return transformer.before(program)
            },
          },
        ],
      },
    }),
    vue(),
    tailwindcss(),
    svgLoader(),
    visualizer({
      filename: 'dist/stats.html',
      open: isAnalyze,
      gzipSize: true,
      brotliSize: true,
    }),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        'name': '115Master',
        'icon': isProd ? icons.prod : icons.dev,
        'namespace': '115Master',
        'homepage': PKG.homepage,
        'author': PKG.author,
        'description': PKG.description,
        'supportURL': PKG.bugs.url,
        'run-at': 'document-start',
        'include': [
          'https://115.com/?ct*',
          'https://115.com/web/lixian/master/video/*',
          'https://115.com/web/lixian/master/magnet/*',
          'https://115.com/?aid*',
          'https://dl.115cdn.net/video/token',
        ],
        'exclude': [
          'https://*.115.com/bridge*',
          'https://*.115.com/static*',
          'https://q.115.com/*',
        ],
        // 自动允许脚本跨域访问的域名
        'connect': [
          '115.com',
          '115vod.com',
          'aps.115.com',
          'webapi.115.com',
          'proapi.115.com',
          'cpats01.115.com',
          'dl.115cdn.net',
          'cdnfhnfile.115cdn.net',
          'v.anxia.com',
          'subtitlecat.com',
          'javbus.com',
          'javdb.com',
          'jdbstatic.com',
          'missav.ws',
        ],
        'resource': {
          icon: 'https://115.com/favicon.ico',
        },
        'downloadURL':
          'https://github.com/cbingb666/115master/releases/latest/download/115master.user.js',
        'updateURL':
          'https://github.com/cbingb666/115master/releases/latest/download/115master.meta.js',
      },
      build: {
        fileName: '115master.user.js',
        metaFileName: '115master.meta.js',
        externalGlobals: {
          'vue': _cdn('Vue', 'dist/vue.global.prod.js'),
          'localforage': _cdn('localforage', 'dist/localforage.min.js'),
          'lodash': _cdn('_', 'lodash.min.js'),
          'big-integer': _cdn('bigInt', 'BigInteger.min.js').concat(
            util.dataUrl(';window.bigInt=bigInt;'),
          ),
          'blueimp-md5': _cdn('md5', 'js/md5.min.js'),
          'dayjs': _cdn('dayjs', 'dayjs.min.js').concat(
            util.dataUrl(';window.dayjs=dayjs;'),
          ),
          'hls.js': _cdn('Hls', 'dist/hls.min.js'),
          'm3u8-parser': _cdn('m3u8Parser', 'dist/m3u8-parser.min.js'),
          'photoswipe': _cdn(
            'photoswipe',
            'dist/umd/photoswipe.umd.min.js',
          ).concat(util.dataUrl(';window.photoswipe=PhotoSwipe;')),
          'photoswipe/lightbox': _cdn(
            'PhotoSwipeLightbox',
            'dist/umd/photoswipe-lightbox.umd.min.js',
          ).concat(
            util.dataUrl(';window.PhotoSwipeLightbox=PhotoSwipeLightbox;'),
          ),
        },
      },
    }),
  ],
})
