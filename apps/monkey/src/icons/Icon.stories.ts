import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import Button from '@/components/Button/Button'
import { I, Icon } from '@/icons'

const meta = {
  title: 'UI/Icon',
  component: Icon,
  args: { name: I.STAR },
  parameters: {
    docs: {
      description: {
        component:
          '集中式图标组件：ionicons Filled 套件（`ion:*`）委托 @iconify/vue 渲染，自定义 SVG（`custom:*`）动态异步加载。颜色通过 Tailwind 文本类（`text-base-content` 等）控制，尺寸用 `size` prop（xs~2xl）。**所有图标引用必须走 `I.*` 语义常量，禁止字面量字符串。**',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: '基础',
  render: () => ({
    components: { Icon },
    setup: () => ({ I }),
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Icon :name="I.PLAY" />
        <Icon :name="I.SETTINGS" />
        <Icon :name="I.SEARCH" />
        <Icon :name="I.STAR" />
        <Icon :name="I.CLOSE" />
      </div>
    `,
  }),
}

export const Sizes: Story = {
  name: '尺寸',
  render: () => ({
    components: { Icon },
    setup: () => ({ I }),
    template: `
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex flex-col items-center gap-1">
          <Icon :name="I.STAR_FILL" size="xs" class="text-warning" />
          <span class="text-xs opacity-60">xs (14px)</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <Icon :name="I.STAR_FILL" size="sm" class="text-warning" />
          <span class="text-xs opacity-60">sm (16px)</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <Icon :name="I.STAR_FILL" size="md" class="text-warning" />
          <span class="text-xs opacity-60">md (20px)</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <Icon :name="I.STAR_FILL" size="lg" class="text-warning" />
          <span class="text-xs opacity-60">lg (24px)</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <Icon :name="I.STAR_FILL" size="xl" class="text-warning" />
          <span class="text-xs opacity-60">xl (64px)</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <Icon :name="I.STAR_FILL" size="2xl" class="text-warning" />
          <span class="text-xs opacity-60">2xl (96px)</span>
        </div>
      </div>
    `,
  }),
}

export const Colors: Story = {
  name: '颜色',
  parameters: {
    docs: {
      description: {
        story: '图标仅使用 `currentColor`，通过 Tailwind 文本颜色类（`text-base-content`、`text-error`、`text-success` 等）控制，跟随主题自动切换。',
      },
    },
  },
  render: () => ({
    components: { Icon },
    setup: () => ({ I }),
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <Icon :name="I.STAR_FILL" size="lg" class="text-base-content" />
        <Icon :name="I.STAR_FILL" size="lg" class="text-primary" />
        <Icon :name="I.STAR_FILL" size="lg" class="text-success" />
        <Icon :name="I.STAR_FILL" size="lg" class="text-warning" />
        <Icon :name="I.STAR_FILL" size="lg" class="text-error" />
        <Icon :name="I.STAR_FILL" size="lg" class="text-info" />
      </div>
    `,
  }),
}

export const CustomSvg: Story = {
  name: '自定义 SVG',
  parameters: {
    docs: {
      description: {
        story: '`custom:` 前缀的图标从 `./custom/<name>.svg` 动态异步加载为 Vue 组件。当前有 `FILE_FOLDER`（文件夹）和 `FILE_IMAGE`（图片文件）两个自定义图标，补充 ionicons 无合适对应物的场景。',
      },
    },
  },
  render: () => ({
    components: { Icon },
    setup: () => ({ I }),
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex flex-col items-center gap-1">
          <Icon :name="I.FILE_FOLDER" size="xl" class="text-warning" />
          <span class="text-xs opacity-60">FILE_FOLDER</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <Icon :name="I.FILE_IMAGE" size="xl" class="text-info" />
          <span class="text-xs opacity-60">FILE_IMAGE</span>
        </div>
      </div>
    `,
  }),
}

export const Dynamic: Story = {
  name: '动态切换',
  render: () => ({
    components: { Button, Icon },
    setup: () => {
      const playing = ref(false)
      return { I, playing }
    },
    template: `
      <div class="flex flex-col items-start gap-3">
        <Button color="primary" type="button" @click="playing = !playing">
          <Icon :name="playing ? I.PAUSE : I.PLAY" size="sm" />
          {{ playing ? '暂停' : '播放' }}
        </Button>
        <p class="text-sm opacity-60">点击按钮切换 PLAY / PAUSE 图标</p>
      </div>
    `,
  }),
}

export const Gallery: Story = {
  name: '图标库',
  parameters: {
    docs: {
      description: {
        story: '所有可用图标按类别排列。悬停查看常量名。',
      },
    },
  },
  render: () => ({
    components: { Icon },
    setup: () => {
      const categories: { label: string, icons: { key: string, value: string }[] }[] = [
        {
          label: '动作 / 导航',
          icons: [
            { key: 'RESTART', value: I.RESTART },
            { key: 'SETTINGS', value: I.SETTINGS },
            { key: 'CLOSE', value: I.CLOSE },
            { key: 'RIGHT', value: I.RIGHT },
            { key: 'LEFT', value: I.LEFT },
            { key: 'MENU', value: I.MENU },
            { key: 'COPY', value: I.COPY },
            { key: 'DOWNLOAD', value: I.DOWNLOAD },
            { key: 'DELETE', value: I.DELETE },
            { key: 'CANCEL', value: I.CANCEL },
            { key: 'TOP', value: I.TOP },
            { key: 'TOP_SOLID', value: I.TOP_SOLID },
            { key: 'MOVE', value: I.MOVE },
            { key: 'RENAME', value: I.RENAME },
            { key: 'EXPORT', value: I.EXPORT },
            { key: 'IMPORT', value: I.IMPORT },
            { key: 'VIEW', value: I.VIEW },
            { key: 'PREVIEW_OFF', value: I.PREVIEW_OFF },
            { key: 'PREVIEW_ON', value: I.PREVIEW_ON },
            { key: 'PLUS', value: I.PLUS },
            { key: 'RESET', value: I.RESET },
            { key: 'RESET_ALL', value: I.RESET_ALL },
            { key: 'BACK_DIR', value: I.BACK_DIR },
            { key: 'CHEVRON_DOWN', value: I.CHEVRON_DOWN },
            { key: 'EMPTY', value: I.EMPTY },
            { key: 'SEARCH', value: I.SEARCH },
            { key: 'MORE', value: I.MORE },
            { key: 'ARROW_UP', value: I.ARROW_UP },
            { key: 'ARROW_DOWN', value: I.ARROW_DOWN },
            { key: 'SORT', value: I.SORT },
            { key: 'BACK_DIR_ARROW', value: I.BACK_DIR_ARROW },
          ],
        },
        {
          label: '媒体控制',
          icons: [
            { key: 'PLAY', value: I.PLAY },
            { key: 'PAUSE', value: I.PAUSE },
            { key: 'PREV', value: I.PREV },
            { key: 'NEXT', value: I.NEXT },
            { key: 'FAST_FORWARD', value: I.FAST_FORWARD },
            { key: 'FAST_REWIND', value: I.FAST_REWIND },
            { key: 'FULLSCREEN', value: I.FULLSCREEN },
            { key: 'FULLSCREEN_EXIT', value: I.FULLSCREEN_EXIT },
            { key: 'VOLUME_OFF', value: I.VOLUME_OFF },
            { key: 'VOLUME_MUTE', value: I.VOLUME_MUTE },
            { key: 'VOLUME_DOWN', value: I.VOLUME_DOWN },
            { key: 'VOLUME_UP', value: I.VOLUME_UP },
            { key: 'PIP', value: I.PIP },
            { key: 'PIP_EXIT', value: I.PIP_EXIT },
            { key: 'SUBTITLES', value: I.SUBTITLES },
            { key: 'SUBTITLES_OFF', value: I.SUBTITLES_OFF },
            { key: 'PLAYLIST', value: I.PLAYLIST },
          ],
        },
        {
          label: '媒体显示',
          icons: [
            { key: 'PLAYER_CORE', value: I.PLAYER_CORE },
            { key: 'AUDIO_TRACK', value: I.AUDIO_TRACK },
            { key: 'TRANSFORM', value: I.TRANSFORM },
            { key: 'ROTATE_LEFT', value: I.ROTATE_LEFT },
            { key: 'ROTATE_RIGHT', value: I.ROTATE_RIGHT },
            { key: 'ROTATE_NORMAL', value: I.ROTATE_NORMAL },
            { key: 'ROTATE', value: I.ROTATE },
            { key: 'FLIP_X', value: I.FLIP_X },
            { key: 'FLIP_Y', value: I.FLIP_Y },
            { key: 'LOCATION_ON', value: I.LOCATION_ON },
            { key: 'TIMER', value: I.TIMER },
            { key: 'PLAYBACK_RATE', value: I.PLAYBACK_RATE },
            { key: 'STATISTICS_INFO', value: I.STATISTICS_INFO },
            { key: 'SHORTCUTS', value: I.SHORTCUTS },
            { key: 'ABOUT', value: I.ABOUT },
            { key: 'COLOR_ADJUST', value: I.COLOR_ADJUST },
            { key: 'LOADING', value: I.LOADING },
            { key: 'ERROR', value: I.ERROR },
            { key: 'AUTO_LOAD', value: I.AUTO_LOAD },
            { key: 'ROCKET_LAUNCH', value: I.ROCKET_LAUNCH },
            { key: 'EXTENSION', value: I.EXTENSION },
            { key: 'WINDOW', value: I.WINDOW },
            { key: 'QUALITY', value: I.QUALITY },
          ],
        },
        {
          label: '文件 / 标签 / 排序',
          icons: [
            { key: 'ALL_FILE', value: I.ALL_FILE },
            { key: 'FILE_FOLDER', value: I.FILE_FOLDER },
            { key: 'FILE_IMAGE', value: I.FILE_IMAGE },
            { key: 'FILE_IMPROVE', value: I.FILE_IMPROVE },
            { key: 'TAG', value: I.TAG },
            { key: 'SELECT_ALL', value: I.SELECT_ALL },
            { key: 'INVERT', value: I.INVERT },
            { key: 'SORT_HISTORY', value: I.SORT_HISTORY },
            { key: 'SORT_EDIT_CALENDAR', value: I.SORT_EDIT_CALENDAR },
            { key: 'SORT_SCHEDULE', value: I.SORT_SCHEDULE },
            { key: 'SORT_ALPHA', value: I.SORT_ALPHA },
            { key: 'SORT_DATABASE', value: I.SORT_DATABASE },
          ],
        },
        {
          label: '通用',
          icons: [
            { key: 'HISTORY', value: I.HISTORY },
            { key: 'GRID', value: I.GRID },
            { key: 'LIST', value: I.LIST },
            { key: 'NEW_FOLDER', value: I.NEW_FOLDER },
            { key: 'DOCUMENT', value: I.DOCUMENT },
            { key: 'STAR_RATING', value: I.STAR_RATING },
            { key: 'STAR_FILL', value: I.STAR_FILL },
            { key: 'STAR', value: I.STAR },
            { key: 'UPLOAD', value: I.UPLOAD },
            { key: 'ADD_LINK', value: I.ADD_LINK },
            { key: 'FLASK', value: I.FLASK },
            { key: 'FILE_UPLOAD', value: I.FILE_UPLOAD },
            { key: 'QA', value: I.QA },
          ],
        },
        {
          label: '通知 / 主题 / 品牌',
          icons: [
            { key: 'TOAST_SUCCESS', value: I.TOAST_SUCCESS },
            { key: 'TOAST_ERROR', value: I.TOAST_ERROR },
            { key: 'TOAST_WARNING', value: I.TOAST_WARNING },
            { key: 'TOAST_INFO', value: I.TOAST_INFO },
            { key: 'THEME_LIGHT', value: I.THEME_LIGHT },
            { key: 'THEME_DARK', value: I.THEME_DARK },
            { key: 'THEME_SYSTEM', value: I.THEME_SYSTEM },
            { key: 'GITHUB', value: I.GITHUB },
            { key: 'SPONSOR', value: I.SPONSOR },
          ],
        },
      ]
      return { categories, I }
    },
    template: `
      <div class="space-y-6">
        <div v-for="cat in categories" :key="cat.label">
          <h3 class="mb-2 text-sm font-semibold opacity-50">{{ cat.label }}</h3>
          <div class="flex flex-wrap gap-1">
            <div
              v-for="icon in cat.icons"
              :key="icon.key"
              :title="icon.key"
              class="flex size-10 items-center justify-center rounded-lg hover:bg-base-content/10 cursor-default"
            >
              <Icon :name="icon.value" />
            </div>
          </div>
        </div>
      </div>
    `,
  }),
}
