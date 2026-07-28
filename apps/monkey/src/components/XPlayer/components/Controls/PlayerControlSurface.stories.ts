import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button } from '@115master/ui'
import { I, Icon } from '@/icons'
import PlayerControlSurface from './PlayerControlSurface'

const meta = {
  title: 'UI/XPlayer/PlayerControlSurface',
  component: PlayerControlSurface,
  parameters: {
    docs: {
      description: {
        component:
          '播放器浮动控制组：Float Glass 只由外层容器承载，内部按钮保持透明反馈，避免嵌套背景形成实色圆块。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlayerControlSurface>

export default meta
type Story = StoryObj<typeof meta>

export const PlayerControls: Story = {
  name: '播放器控制栏',
  render: () => ({
    components: { Button, Icon, PlayerControlSurface },
    setup: () => ({ I }),
    template: `
      <div class="flex min-h-72 items-end gap-4 rounded-3xl bg-neutral p-8">
        <PlayerControlSurface data-testid="episodes-surface">
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
        <PlayerControlSurface data-testid="volume-surface">
          <Button data-testid="volume" variant="ghost" shape="circle" aria-label="音量">
            <Icon :name="I.VOLUME_UP" size="xl" />
          </Button>
          <input type="range" class="range range-2xs range-primary mx-2 w-24" value="60">
        </PlayerControlSurface>
        <PlayerControlSurface data-testid="audio-track-surface">
          <Button variant="ghost" shape="circle" disabled aria-label="音频轨道">
            <Icon :name="I.AUDIO_TRACK" size="xl" />
          </Button>
        </PlayerControlSurface>
        <PlayerControlSurface data-testid="playlist-surface">
          <Button variant="ghost" shape="circle" aria-label="播放列表">
            <Icon :name="I.PLAYLIST" size="xl" />
          </Button>
        </PlayerControlSurface>
      </div>
    `,
  }),
}
