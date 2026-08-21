import type { Share } from '@115master/drive115'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { DndRoot, Pill } from '@115master/ui'
import { ref } from 'vue'
import FileDndSource from './FileDndSource'
import FileDndTarget from './FileDndTarget'
import FileDragPreview from './FileDragPreview'

function item(partial: Partial<Share.Entity.FilesItem>) {
  return partial as Share.Entity.FilesItem
}

const folder = item({ cid: 'folder-source', fc: 0, iv: 0, ico: 'folder', n: '项目资料', pc: 'folder-pc' })
const video = item({ fc: 1, fid: 'video-source', iv: 1, ico: 'mp4', n: '演示视频.mp4', pc: 'video-pc' })
const image = item({ fc: 1, fid: 'image-source', iv: 0, ico: 'jpg', n: '封面.jpg', pc: 'image-pc' })
const audio = item({ fc: 1, fid: 'audio-source', iv: 0, ico: 'flac', n: '原声.flac', pc: 'audio-pc' })
const doc = item({ fc: 1, fid: 'doc-source', iv: 0, ico: 'pdf', n: '说明.pdf', pc: 'doc-pc' })

const meta = {
  title: 'UI/FileDnd',
  component: FileDragPreview,
  args: { items: [] },
  parameters: {
    docs: {
      description: {
        component: '文件拖拽适配层：把纯 DnD 组件转换为文件 payload、类型预览、固定偏移和禁止拖入自身的规则。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FileDragPreview>

export default meta
type Story = StoryObj<typeof meta>

export const FileTypes: Story = {
  name: '文件类型矩阵',
  render: () => ({
    components: { FileDragPreview },
    setup: () => ({
      samples: [
        { label: '文件夹', items: [folder] },
        { label: '视频', items: [video] },
        { label: '图片', items: [image] },
        { label: '音频', items: [audio] },
        { label: '文档', items: [doc] },
      ],
    }),
    template: `
      <ul class="list bg-base-100 rounded-box shadow-sm">
        <li v-for="sample in samples" :key="sample.label" class="list-row items-center">
          <FileDragPreview :items="sample.items" />
          <div class="list-col-grow">
            <div class="font-medium">{{ sample.label }}</div>
            <div class="text-base-content/50 text-xs">首项决定跟随预览图标</div>
          </div>
        </li>
      </ul>
    `,
  }),
}

export const CountLayers: Story = {
  name: '数量层级',
  render: () => ({
    components: { FileDragPreview },
    setup: () => ({
      samples: [
        { label: '1 项', items: [folder] },
        { label: '2 项', items: [video, image] },
        { label: '5 项', items: [folder, video, image, audio, doc] },
      ],
    }),
    template: `
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div v-for="sample in samples" :key="sample.label" class="card card-sm card-border bg-base-100">
          <div class="card-body items-center">
            <FileDragPreview :items="sample.items" />
            <span class="badge badge-ghost badge-sm">{{ sample.label }}</span>
          </div>
        </div>
      </div>
    `,
  }),
}

export const FileDrop: Story = {
  name: '文件投放沙盒',
  parameters: {
    docs: {
      description: {
        story: '按住文件源，分别拖到文件夹卡片和面包屑形态目标，验证 FileDnd 的 payload、预览、自身拒收与 drop 事件。',
      },
    },
  },
  render: () => ({
    components: { DndRoot, FileDndSource, FileDndTarget, Pill },
    setup: () => {
      const result = ref('等待投放')
      const payload = () => [video, doc]
      const drop = (target: string, items: Share.Entity.FilesItem[]) => result.value = `${target}收到 ${items.length} 项`
      return { drop, payload, result }
    },
    template: `
      <DndRoot>
        <FileDndSource :items="payload">
          <template #default="{ sourceProps }">
            <div v-bind="sourceProps" class="card card-sm bg-base-200 mb-5 cursor-grab select-none">
              <div class="card-body">
                <h3 class="card-title text-base">演示视频.mp4 + 说明.pdf</h3>
                <p class="text-base-content/60 text-sm">按住拖动这两个文件</p>
              </div>
            </div>
          </template>
        </FileDndSource>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FileDndTarget cid="archive" @drop="drop('归档文件夹', $event)">
            <template #default="{ targetProps, hovering }">
              <div v-bind="targetProps" :data-drop-zone="hovering" class="card card-sm card-border data-[drop-zone=true]:border-primary data-[drop-zone=true]:bg-primary/10 min-h-24 transition-colors ease-[var(--ui-ease-standard)]">
                <div class="card-body items-center justify-center">
                  <span class="font-medium">归档文件夹</span>
                  <span class="text-base-content/50 text-xs">文件夹目标</span>
                </div>
              </div>
            </template>
          </FileDndTarget>

          <div class="card card-sm card-border min-h-24">
            <div class="card-body items-center justify-center">
              <span class="text-base-content/50 text-xs">面包屑目标</span>
              <FileDndTarget cid="root" @drop="drop('全部文件', $event)">
                <template #default="{ targetProps, hovering }">
                  <Pill v-bind="targetProps" variant="glass-surface" :data-drop-zone="hovering" class="data-[drop-zone=true]:bg-primary/10 data-[drop-zone=true]:ring-primary data-[drop-zone=true]:ring-2 data-[drop-zone=true]:ring-inset">
                    全部文件
                  </Pill>
                </template>
              </FileDndTarget>
            </div>
          </div>
        </div>

        <div class="mt-4 flex justify-center">
          <span class="badge badge-soft">{{ result }}</span>
        </div>
      </DndRoot>
    `,
  }),
}
