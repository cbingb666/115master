import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import DndMonitor from './DndMonitor'
import DndRoot from './DndRoot'
import DndSource from './DndSource'
import DndTarget from './DndTarget'

const meta = {
  title: 'UI/Dnd',
  component: DndRoot,
  parameters: {
    docs: {
      description: {
        component: '纯 Pointer Events 拖拽组件组：Headless Source/Target 保持调用方 DOM，自带跟随层、命中反馈和会话监控。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DndRoot>

export default meta
type Story = StoryObj<typeof meta>

export const Accepted: Story = {
  name: '成功投放',
  render: () => ({
    components: { DndMonitor, DndRoot, DndSource, DndTarget },
    setup: () => {
      const result = ref('等待投放')
      const payload = () => ({ label: '季度报告' })
      const drop = (value: unknown) => result.value = `已接收 ${(value as { label: string }).label}`
      return { drop, payload, result }
    },
    template: `
      <DndRoot>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DndSource :payload="payload">
            <template #default="{ sourceProps }">
              <div
                v-bind="sourceProps"
                class="card card-sm card-border bg-base-100 cursor-grab select-none"
              >
                <div class="card-body">
                  <h3 class="card-title text-base">季度报告</h3>
                  <p class="text-base-content/60 text-sm">按住并拖到右侧目标</p>
                </div>
              </div>
            </template>
            <template #ghost="{ payload: value }">
              <div class="card card-sm bg-base-100 border-base-content/10 w-40 border shadow-lg">
                <div class="card-body font-medium">{{ value.label }}</div>
              </div>
            </template>
          </DndSource>

          <DndTarget @drop="drop">
            <template #default="{ targetProps, hovering }">
              <div
                v-bind="targetProps"
                :data-hovering="hovering"
                class="card card-sm card-dash border-base-content/25 data-[hovering=true]:border-primary data-[hovering=true]:bg-primary/10 min-h-28 transition-colors ease-[var(--ui-ease-standard)]"
              >
                <div class="card-body items-center justify-center text-center">
                  <span class="font-medium">可接收目标</span>
                  <span class="badge badge-soft badge-sm">{{ result }}</span>
                </div>
              </div>
            </template>
          </DndTarget>
        </div>

        <DndMonitor>
          <template #default="{ active }">
            <p class="text-base-content/50 mt-4 text-xs">会话：{{ active ? '拖拽中' : '空闲' }}</p>
          </template>
        </DndMonitor>
      </DndRoot>
    `,
  }),
}

export const Rejected: Story = {
  name: '拒绝投放',
  parameters: {
    docs: {
      description: {
        story: '目标的 accept 始终返回 false；拖入时不会高亮，释放也不会触发 drop。',
      },
    },
  },
  render: () => ({
    components: { DndRoot, DndSource, DndTarget },
    setup: () => {
      const result = ref('未触发 drop')
      return {
        accept: () => false,
        drop: () => result.value = '错误：触发了 drop',
        payload: () => '受限内容',
        result,
      }
    },
    template: `
      <DndRoot>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DndSource :payload="payload">
            <template #default="{ sourceProps }">
              <div v-bind="sourceProps" class="card card-sm card-border bg-base-100 cursor-grab select-none">
                <div class="card-body">受限内容</div>
              </div>
            </template>
            <template #ghost="{ payload: value }">
              <div class="badge badge-neutral badge-lg shadow-lg">{{ value }}</div>
            </template>
          </DndSource>

          <DndTarget :accept="accept" @drop="drop">
            <template #default="{ targetProps, hovering }">
              <div
                v-bind="targetProps"
                :data-hovering="hovering"
                class="card card-sm card-dash border-error/40 data-[hovering=true]:bg-error/10 min-h-24"
              >
                <div class="card-body items-center justify-center text-center">
                  <span>拒绝目标</span>
                  <span class="text-base-content/50 text-xs">{{ result }}</span>
                </div>
              </div>
            </template>
          </DndTarget>
        </div>
      </DndRoot>
    `,
  }),
}

export const MultipleTargets: Story = {
  name: '多目标切换',
  render: () => ({
    components: { DndRoot, DndSource, DndTarget },
    setup: () => {
      const result = ref('在两个目标间移动')
      return {
        payload: () => ({ label: '移动任务' }),
        result,
        select: (name: string) => result.value = `投放到${name}`,
      }
    },
    template: `
      <DndRoot>
        <DndSource :payload="payload">
          <template #default="{ sourceProps }">
            <div v-bind="sourceProps" class="card card-sm bg-base-200 mb-5 cursor-grab select-none">
              <div class="card-body items-center">移动任务</div>
            </div>
          </template>
          <template #ghost="{ payload: value }">
            <div class="badge badge-primary badge-lg shadow-lg">{{ value.label }}</div>
          </template>
        </DndSource>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DndTarget @drop="select('目标 A')">
            <template #default="{ targetProps, hovering }">
              <div v-bind="targetProps" :data-hovering="hovering" class="card card-sm card-dash data-[hovering=true]:border-primary data-[hovering=true]:bg-primary/10 min-h-24">
                <div class="card-body items-center justify-center">目标 A</div>
              </div>
            </template>
          </DndTarget>
          <DndTarget @drop="select('目标 B')">
            <template #default="{ targetProps, hovering }">
              <div v-bind="targetProps" :data-hovering="hovering" class="card card-sm card-dash data-[hovering=true]:border-primary data-[hovering=true]:bg-primary/10 min-h-24">
                <div class="card-body items-center justify-center">目标 B</div>
              </div>
            </template>
          </DndTarget>
        </div>
        <p class="text-base-content/60 mt-4 text-center text-sm">{{ result }}</p>
      </DndRoot>
    `,
  }),
}
