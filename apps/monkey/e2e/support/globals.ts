import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/**
 * CDN 外部全局（vite.config.ts externalGlobals 的本地等价物）
 * userscript 是 SystemJS 模块，头部 `System.set("user:vue", (()=>{const _=Vue;...})())`
 * 直接引用 window 全局——必须在 userscript 之前按序提供这些全局。
 * 文件全部取自 node_modules，与 @require 的 CDN URL 一一对应（离线确定性）。
 */

type Global
  = | {
    /** node_modules 包名 */
    id: string
    /** 包内文件 */
    file: string
    /** 脚本执行后的全局别名（对应 @require 的 data: 补丁） */
    after?: string
  }
  /** 纯补丁脚本（无包文件） */
  | { after: string }

const GLOBALS: Global[] = [
  { id: 'systemjs', file: 'dist/system.min.js', after: ';window.System=System;' },
  { id: 'systemjs', file: 'dist/extras/named-register.min.js' },
  // 与 @require 的 data:application/javascript 补丁一致：隔离出独立 System 实例
  { after: `;(typeof System!=='undefined')&&(System=new System.constructor());` },
  // Playwright 将 init script 包成函数执行，顶层 var 不落 window——逐个显式挂全局
  { id: 'vue', file: 'dist/vue.global.prod.js', after: ';window.Vue=Vue;' },
  { id: 'localforage', file: 'dist/localforage.min.js', after: ';window.localforage=localforage;' },
  { id: 'lodash', file: 'lodash.min.js', after: ';window._=_;' },
  { id: 'big-integer', file: 'BigInteger.min.js', after: ';window.bigInt=bigInt;' },
  { id: 'blueimp-md5', file: 'js/md5.min.js', after: ';window.md5=md5;' },
  { id: 'dayjs', file: 'dayjs.min.js', after: ';window.dayjs=dayjs;' },
  { id: 'hls.js', file: 'dist/hls.min.js', after: ';window.Hls=Hls;' },
  { id: 'm3u8-parser', file: 'dist/m3u8-parser.min.js', after: ';window.m3u8Parser=m3u8Parser;' },
  { id: 'photoswipe', file: 'dist/umd/photoswipe.umd.min.js', after: ';window.PhotoSwipe=PhotoSwipe;window.photoswipe=PhotoSwipe;' },
  { id: 'photoswipe', file: 'dist/umd/photoswipe-lightbox.umd.min.js', after: ';window.PhotoSwipeLightbox=PhotoSwipeLightbox;' },
]

const require = createRequire(import.meta.url)

/** 由包入口向上找包根（exports 未暴露的子路径只能靠拼路径） */
function pkgRoot(id: string, from?: string) {
  let dir = dirname(require.resolve(id, from ? { paths: [from] } : undefined))
  while (true) {
    const pkg = join(dir, 'package.json')
    if (existsSync(pkg) && JSON.parse(readFileSync(pkg, 'utf8')).name === id)
      return dir
    const parent = dirname(dir)
    if (parent === dir)
      throw new Error(`[e2e] 找不到包根: ${id}`)
    dir = parent
  }
}

function contentOf(g: Global) {
  if (!('id' in g))
    return g.after
  /** systemjs 是 vite-plugin-monkey 的依赖，从它的位置解析 */
  const from = g.id === 'systemjs'
    ? dirname(require.resolve('vite-plugin-monkey/package.json'))
    : undefined
  const path = join(pkgRoot(g.id, from), g.file)
  if (!existsSync(path))
    throw new Error(`[e2e] 全局依赖文件不存在: ${path}`)
  const code = readFileSync(path, 'utf8')
  return g.after ? `${code}\n${g.after}` : code
}

/** 按依赖顺序生成注入脚本列表（systemjs → vue → … → photoswipe） */
export function globals(): string[] {
  return GLOBALS.map(contentOf)
}
