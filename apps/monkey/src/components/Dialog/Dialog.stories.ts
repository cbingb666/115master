import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Ref } from 'vue'
import type { UseDialogPromptOptions } from './types'
import type { DialogContainerExpose, DialogSize, ModalProps } from './types.dialog'
import { h, ref } from 'vue'
import { I, Icon } from '@/icons'
import Button from '../Button/Button'
import DialogContainer from './DialogContainer'
import DialogModal from './DialogModal'
import PromptContent from './PromptContent'

const meta = {
  title: 'UI/Dialog',
  component: DialogModal,
  args: { id: 'storybook-dialog' },
  parameters: {
    docs: {
      description: {
        component:
          '全局对话框系统：DialogContainer 统一管理层级与关闭行为，useDialog 提供 alert、confirm、prompt 和自定义实例 API；面板使用 modal + app-glass-panel，并在移动端从底部弹出。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DialogModal>

export default meta
type Story = StoryObj<typeof meta>

let id = 0

function generateId() {
  return `storybook-dialog-${++id}`
}

function close(container: Ref<DialogContainerExpose | undefined>, id: string) {
  container.value?.updateDialog(id, { visible: false })
  setTimeout(() => container.value?.removeDialog(id), 300)
}

function show(
  container: Ref<DialogContainerExpose | undefined>,
  dialog: Omit<ModalProps, 'id' | 'visible'>,
  id = generateId(),
) {
  container.value?.addDialog({ id, visible: false, ...dialog })
  setTimeout(() => container.value?.updateDialog(id, { visible: true }))
  return id
}

function render(
  setup: (container: Ref<DialogContainerExpose | undefined>) => object,
  template: string,
) {
  return () => ({
    components: { Button, DialogContainer },
    setup() {
      const container = ref<DialogContainerExpose>()
      return { container, ...setup(container) }
    },
    template: `<DialogContainer ref="container">${template}</DialogContainer>`,
  })
}

export const Alert: Story = {
  name: '提示',
  render: render((container) => {
    const result = ref('等待操作')
    const open = () => show(container, {
      title: '操作完成',
      content: '所选文件已成功移动到目标文件夹。',
      confirmText: '知道了',
      showCancel: false,
      confirmCallback: () => {
        result.value = '已确认'
      },
      cancelCallback: () => {
        result.value = '已关闭'
      },
    })
    return { open, result }
  }, `
    <div class="flex flex-col items-start gap-3">
      <Button color="primary" @click="open">打开提示</Button>
      <p class="text-base-content/60 text-sm">结果：{{ result }}</p>
    </div>
  `),
}

export const Confirm: Story = {
  name: '确认',
  render: render((container) => {
    const result = ref('等待选择')
    const open = () => show(container, {
      title: '移动文件',
      content: '确认将选中的 3 个文件移动到“已整理”文件夹吗？',
      confirmText: '确认移动',
      cancelText: '暂不移动',
      confirmCallback: () => {
        result.value = '已确认移动'
      },
      cancelCallback: () => {
        result.value = '已取消'
      },
    })
    return { open, result }
  }, `
    <div class="flex flex-col items-start gap-3">
      <Button color="primary" @click="open">打开确认框</Button>
      <p class="text-base-content/60 text-sm">结果：{{ result }}</p>
    </div>
  `),
}

export const Prompt: Story = {
  name: '输入',
  render: render((container) => {
    const result = ref('尚未提交')

    const open = (multiline = false) => {
      const value = ref(multiline ? '' : '示例视频.mp4')
      const prompt = ref<{ focus: () => void }>()
      const options: UseDialogPromptOptions = multiline
        ? {
            multiline: true,
            placeholder: '输入备注，Shift + Enter 换行',
            rows: 5,
            maxLength: 300,
          }
        : {
            content: '请输入新的文件名。',
            defaultValue: value.value,
            placeholder: '文件名',
            required: true,
            maxLength: 80,
          }
      const id = generateId()
      const submit = () => {
        if (options.required && !value.value.trim())
          return false
        result.value = multiline
          ? `多行输入：${value.value || '（空）'}`
          : `单行输入：${value.value}`
      }
      const confirm = () => {
        if (submit() === false)
          return
        close(container, id)
      }

      show(container, {
        title: multiline ? '添加备注' : '重命名文件',
        content: () => h(PromptContent, {
          'ref': prompt,
          'options': options,
          'modelValue': value.value,
          'onConfirm': confirm,
          'onUpdate:modelValue': (input: string) => {
            value.value = input
          },
        }),
        confirmText: '确定',
        cancelText: '取消',
        confirmCallback: submit,
        cancelCallback: () => {
          result.value = '已取消'
        },
        openedCallback: () => prompt.value?.focus(),
      }, id)
    }

    return {
      multiline: () => open(true),
      result,
      text: () => open(),
    }
  }, `
    <div class="flex flex-col items-start gap-3">
      <div class="flex flex-wrap gap-3">
        <Button color="primary" @click="text">单行输入</Button>
        <Button @click="multiline">多行输入</Button>
      </div>
      <p class="text-base-content/60 max-w-xl text-sm">结果：{{ result }}</p>
    </div>
  `),
}

export const Sizes: Story = {
  name: '尺寸',
  parameters: {
    docs: {
      description: {
        story: '依次验证 md、lg、xl、full 四档宽高约束；窄屏下统一使用底部弹出形态。',
      },
    },
  },
  render: render((container) => {
    const sizes = ['md', 'lg', 'xl', 'full'] as const
    const open = (size: DialogSize) => show(container, {
      title: `${size.toUpperCase()} 尺寸`,
      content: '对话框内容区会随尺寸档位扩展，标题与操作区保持固定，适合承载从简单提示到复杂面板的不同内容。',
      confirmText: '关闭',
      showCancel: false,
      size,
    })
    return { open, sizes }
  }, `
    <div class="flex flex-wrap gap-3">
      <Button v-for="size in sizes" :key="size" @click="open(size)">
        {{ size.toUpperCase() }}
      </Button>
    </div>
  `),
}

export const Custom: Story = {
  name: '自定义内容',
  render: render((container) => {
    const open = () => {
      const id = generateId()
      show(container, {
        title: '文件详情',
        content: () => h('div', { class: 'space-y-4' }, [
          h('p', { class: 'text-base-content/70' }, '通过 VNode 内容与标题操作区组合复杂对话框。'),
          h('dl', { class: 'bg-base-content/5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl p-4 text-sm' }, [
            h('dt', { class: 'text-base-content/60' }, '文件名'),
            h('dd', '示例视频.mp4'),
            h('dt', { class: 'text-base-content/60' }, '大小'),
            h('dd', '1.28 GB'),
            h('dt', { class: 'text-base-content/60' }, '修改时间'),
            h('dd', '2026-07-28 14:30'),
          ]),
        ]),
        titleActions: () => h(Button, {
          'aria-label': '关闭',
          'shape': 'circle',
          'variant': 'ghost',
          'onClick': () => close(container, id),
        }, () => h(Icon, { name: I.CLOSE, size: 'sm' })),
        showCancel: false,
        showConfirm: false,
      }, id)
    }
    return { open }
  }, `
    <Button color="primary" @click="open">打开自定义对话框</Button>
  `),
}
