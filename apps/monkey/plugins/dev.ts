import { spawnSync } from 'node:child_process'

function readGitBranch(): string {
  const res = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' })
  if (res.status !== 0)
    throw new Error(res.stderr || `git exited with code ${res.status}`)
  return (res.stdout ?? '').trim() || 'HEAD'
}

function sanitizeBranch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\\:?"<>|@#+$=&/]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+/g, '-')
}

function fnv1a32(input: string): number {
  let hash = 0x811C9DC5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function derivePort(branch: string, base = 5180, range = 200): number {
  return base + (fnv1a32(branch) % range)
}

function detectBranch(): string {
  try {
    return sanitizeBranch(readGitBranch())
  }
  catch (e) {
    console.warn('[monkey-dev] git branch detection failed:', e)
    return ''
  }
}

function devName(branch: string): string {
  return branch ? `115Master-${branch}` : '115Master'
}

function devServer(branch: string, branchPort?: string) {
  return {
    host: '127.0.0.1',
    port: branchPort ? Number(branchPort) : derivePort(branch || 'default'),
    strictPort: !branchPort,
  }
}

function logBanner(branch: string, port: number) {
  console.log(`[monkey-dev] branch : ${branch || '(empty)'}`)
  console.log(`[monkey-dev] name   : ${devName(branch)}`)
  console.log(`[monkey-dev] port   : ${port}`)
  console.log(`[monkey-dev] install: http://127.0.0.1:${port}/115master.user.js`)
  console.log(`[monkey-dev] open   : https://115.com/?bn=${branch}`)
}

/**
 * dev 模式配置，返回可直接 spread 到 Vite config 的 partial。
 * 生产构建不调此函数。
 *
 * @param branchPort 可选的手动端口覆盖，来自 env.BRANCH_PORT
 */
export function devConfig(branchPort?: string) {
  const branch = detectBranch()
  const server = devServer(branch, branchPort)

  logBanner(branch, server.port)

  return {
    server,
    userscript: {
      name: devName(branch),
    },
  }
}