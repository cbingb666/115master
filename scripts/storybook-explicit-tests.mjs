import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

const signals = [
  'click',
  'gotpointercapture',
  'lostpointercapture',
  'pointercancel',
  'pointerdown',
  'pointerenter',
  'pointerleave',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'keydown',
  'input',
  'change',
  'submit',
  'focusin',
]

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay))

async function findPort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()

      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Could not reserve a Storybook port'))
        return
      }

      server.close(error => error ? reject(error) : resolve(address.port))
    })
  })
}

async function stop(child, closed) {
  if (!running(child))
    return

  const kill = (signal) => {
    if (process.platform === 'win32' || !child.pid) {
      child.kill(signal)
      return
    }

    try {
      process.kill(-child.pid, signal)
    }
    catch {
      child.kill(signal)
    }
  }

  kill('SIGTERM')
  await Promise.race([closed, sleep(5_000)])

  if (running(child))
    kill('SIGKILL')

  await closed
}

function running(child) {
  return child.exitCode === null && !child.signalCode
}

function validate(index, config) {
  config.stories.forEach((story) => {
    const parent = index.entries[story.id]

    if (!parent || parent.type !== 'story' || parent.subtype !== 'story')
      throw new Error(`${story.id} is not a parent Storybook story`)

    if (story.component && !parent.componentPath)
      throw new Error(`${story.id} does not expose its component metadata`)

    story.tags?.forEach((tag) => {
      if (!parent.tags?.includes(tag))
        throw new Error(`${story.id} does not include the ${tag} tag`)
    })

    story.tests.forEach((id) => {
      const test = index.entries[id]

      if (!test || test.subtype !== 'test' || test.parent !== story.id)
        throw new Error(`${id} is not a test attached to ${story.id}`)

      if (test.importPath !== parent.importPath)
        throw new Error(`${id} does not share ${story.id}'s story module`)
    })

    if (!story.docs)
      return

    const docs = index.entries[story.docs]

    if (!docs || docs.type !== 'docs' || docs.importPath !== parent.importPath)
      throw new Error(`${story.docs} is not the docs entry for ${story.id}`)
  })
}

async function inspect(page, story, visit, errors) {
  await page.locator(story.ready).waitFor({ state: 'visible' })
  await page.waitForTimeout(3_000)

  if (errors.length)
    throw new Error(`${story.id} raised page errors on ${visit}: ${errors.join('; ')}`)

  const events = await page.evaluate(() => globalThis.__storybookInertEvents)

  if (events.length)
    throw new Error(`${story.id} emitted input events on ${visit}: ${JSON.stringify(events)}`)

  await Promise.all(story.outcomes.map(async (outcome) => {
    const text = await page.locator(outcome.selector).textContent()

    if (text?.trim() !== outcome.text)
      throw new Error(`${story.id} expected ${outcome.selector} to equal "${outcome.text}" on ${visit}, received "${text?.trim()}"`)
  }))
}

async function observe(browser, base, story) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))

  await page.addInitScript((types) => {
    globalThis.__storybookInertEvents = []

    const selector = 'button, a[href], form, input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])'

    types.forEach((type) => {
      document.addEventListener(type, (event) => {
        const target = event.target instanceof Element ? event.target.closest(selector) : null

        if (!target)
          return

        globalThis.__storybookInertEvents.push({
          type,
          target: target?.getAttribute('aria-label') || target?.textContent?.trim().slice(0, 80) || event.target?.nodeName,
        })
      }, true)
    })
  }, signals)

  try {
    await page.goto(`${base}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`, {
      waitUntil: 'domcontentloaded',
    })
    await inspect(page, story, 'initial entry', errors)

    if (story.reload) {
      errors.length = 0
      await page.reload({ waitUntil: 'domcontentloaded' })
      await inspect(page, story, 'reload', errors)
    }
  }
  finally {
    await page.close()
  }
}

async function wait(base, child, logs) {
  const deadline = Date.now() + 60_000

  while (Date.now() < deadline) {
    if (!running(child))
      throw new Error(`Storybook exited before becoming ready\n${logs.join('')}`)

    try {
      const response = await fetch(`${base}/index.json`)

      if (response.ok)
        return response.json()
    }
    catch {
      // Storybook is still starting.
    }

    await sleep(250)
  }

  throw new Error(`Storybook did not become ready within 60 seconds\n${logs.join('')}`)
}

async function inertness(require, base, index, config) {
  const playwright = require('playwright')
  const browser = await playwright.chromium.launch({ headless: true })

  try {
    validate(index, config)
    await Promise.all(config.stories.map(story => observe(browser, base, story)))
    console.log(`✓ ${config.name}: ${config.stories.length} parent Canvas remained inert`)
  }
  finally {
    await browser.close()
  }
}

async function main() {
  if (process.argv.length < 4)
    throw new Error('Usage: node scripts/storybook-explicit-tests.mjs <inertness|index> <host>/.storybook/inertness.json [index.json]')

  const mode = process.argv[2]
  const file = resolve(process.cwd(), process.argv[3])
  const root = resolve(dirname(file), '..')
  const config = JSON.parse(await readFile(file, 'utf8'))

  if (mode === 'index') {
    if (process.argv.length !== 5)
      throw new Error('The index mode requires the built Storybook index path')

    validate(JSON.parse(await readFile(resolve(process.cwd(), process.argv[4]), 'utf8')), config)
    console.log(`✓ ${config.name}: explicit test entries are present in the static index`)
    return
  }

  if (mode !== 'inertness')
    throw new Error(`Unknown Storybook explicit test mode: ${mode}`)

  const require = createRequire(resolve(root, 'package.json'))
  const manifest = JSON.parse(await readFile(require.resolve('storybook/package.json'), 'utf8'))
  const bin = resolve(dirname(require.resolve('storybook/package.json')), manifest.bin)
  const port = await findPort()
  const base = `http://127.0.0.1:${port}`
  const logs = []
  const child = spawn(process.execPath, [
    bin,
    'dev',
    '--ci',
    '--quiet',
    '--no-open',
    '--no-version-updates',
    '--disable-telemetry',
    '--exact-port',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
  ], {
    cwd: root,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const closed = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })))

  child.stdout.on('data', data => logs.push(data.toString()))
  child.stderr.on('data', data => logs.push(data.toString()))

  try {
    await inertness(require, base, await wait(base, child, logs), config)
  }
  finally {
    await stop(child, closed)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
