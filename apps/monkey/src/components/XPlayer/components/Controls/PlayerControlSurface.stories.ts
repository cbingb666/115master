import { Button } from '@115master/ui'
import { expect } from 'storybook/test'
import { I, Icon } from '@/icons'
import preview from '../../../../../.storybook/preview'
import PlayerControlSurface from './PlayerControlSurface'

const meta = preview.meta({
  title: 'UI/XPlayer/PlayerControlSurface',
  component: PlayerControlSurface,
  parameters: {
    docs: {
      description: {
        component:
          '播放器浮动控制组：Panel Glass 只由外层容器承载，内部按钮保持透明反馈，并跟随页面主题切换明暗表面。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const PlayerControls = meta.story({
  name: '播放器控制栏',
  render: () => ({
    components: { Button, Icon, PlayerControlSurface },
    setup: () => ({ I }),
    template: `
      <div class="flex min-h-72 items-end gap-4 rounded-3xl bg-neutral p-8">
        <PlayerControlSurface data-app-player-surface="episodes">
          <Button variant="ghost" shape="circle" disabled aria-label="上一集">
            <Icon :name="I.PREV" size="xl" />
          </Button>
          <Button variant="ghost" shape="circle" aria-label="暂停">
            <Icon :name="I.PAUSE" size="xl" />
          </Button>
          <Button variant="ghost" shape="circle" aria-label="下一集">
            <Icon :name="I.NEXT" size="xl" />
          </Button>
        </PlayerControlSurface>
        <PlayerControlSurface data-app-player-surface="volume">
          <Button data-app-player-control="volume" variant="ghost" shape="circle" aria-label="音量">
            <Icon :name="I.VOLUME_UP" size="xl" />
          </Button>
          <input type="range" class="range app-range-2xs range-primary mx-2 w-24" value="60">
        </PlayerControlSurface>
        <PlayerControlSurface data-app-player-surface="audio-track">
          <Button variant="ghost" shape="circle" disabled aria-label="音频轨道">
            <Icon :name="I.AUDIO_TRACK" size="xl" />
          </Button>
        </PlayerControlSurface>
        <PlayerControlSurface data-app-player-surface="playlist">
          <Button variant="ghost" shape="circle" aria-label="播放列表">
            <Icon :name="I.PLAYLIST" size="xl" />
          </Button>
        </PlayerControlSurface>
      </div>
    `,
  }),
})

PlayerControls.test('adapts media control material to the active theme', async ({ canvasElement }) => {
  const surface = canvasElement.querySelector<HTMLElement>('[data-app-player-surface="volume"]')
  const button = canvasElement.querySelector<HTMLButtonElement>('[data-app-player-control="volume"]')
  const theme = surface?.closest<HTMLElement>('[data-theme]')

  if (!surface || !button || !theme)
    throw new Error('Player control surface fixture did not render')

  const surfaceStyle = getComputedStyle(surface)
  const buttonStyle = getComputedStyle(button)
  const sample = document.createElement('canvas')
  const context = sample.getContext('2d')

  if (!context)
    throw new Error('Canvas color sampling is unavailable')

  sample.width = 1
  sample.height = 1
  context.fillStyle = surfaceStyle.backgroundColor
  context.fillRect(0, 0, 1, 1)
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
  const lightness = (red + green + blue) / 3

  await expect(surfaceStyle.color).toBe(getComputedStyle(theme).color)
  await expect(buttonStyle.color).toBe(surfaceStyle.color)
  if (theme.dataset.theme === 'light') {
    await expect(lightness).toBeGreaterThan(192)
    return
  }
  await expect(lightness).toBeLessThan(128)
})
