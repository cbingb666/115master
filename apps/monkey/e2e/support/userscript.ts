import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * userscript 构建产物注入
 * 读 apps/monkey/dist/115master.user.js（需先 `pnpm --filter @115master/monkey build`）
 */

const dist = fileURLToPath(new URL('../../dist/115master.user.js', import.meta.url))

/** 返回产物内容；不存在时给出明确提示 */
export function userscript(): string {
  if (!existsSync(dist)) {
    throw new Error(
      `[e2e] 未找到构建产物 ${dist}，请先运行 pnpm --filter @115master/monkey build（或直接 pnpm test:e2e）`,
    )
  }
  return readFileSync(dist, 'utf8')
}
