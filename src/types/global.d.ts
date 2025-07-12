import type Hls from 'hls.js'

declare global {
  interface Window {
    /** hls.js 类型声明 */
    Hls: typeof Hls
  }
}
