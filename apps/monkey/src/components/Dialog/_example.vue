<template>
  <div :class="styles.container">
    <h2 :class="styles.title">
      Dialog 组件使用示例
    </h2>

    <div :class="styles.buttonGroup">
      <button :class="styles.button" @click="showAlert">
        显示警告对话框
      </button>

      <button :class="styles.button" @click="showConfirm">
        显示确认对话框
      </button>

      <button :class="styles.button" @click="showCustom">
        显示自定义对话框
      </button>

      <button :class="styles.button" @click="showWithComponent">
        显示带组件内容的对话框
      </button>

      <button :class="styles.dangerButton" @click="closeAll">
        关闭所有对话框
      </button>
    </div>

    <div :class="styles.result">
      <h3>操作结果：</h3>
      <p>{{ result }}</p>
    </div>

    <DialogContainer />
  </div>
</template>

<script setup lang="tsx">
import { computed, defineComponent, ref } from 'vue'
import { useDialog } from '@/components'

const result = ref('等待操作...')

const dialog = useDialog()

/** 自定义组件示例 */
const CustomContent = defineComponent({
  name: 'CustomContent',
  setup() {
    return () => {
      return (
        <div>
          <h4>这是一个自定义组件</h4>
        </div>
      )
    }
  },
})

const styles = computed(() => ({
  container: [
    'p-6',
    'max-w-md',
    'mx-auto',
  ],
  title: [
    'text-2xl',
    'font-bold',
    'mb-6',
    'text-center',
  ],
  buttonGroup: [
    'space-y-3',
    'mb-6',
  ],
  button: [
    'btn',
    'btn-primary',
    'w-full',
  ],
  dangerButton: [
    'btn',
    'btn-error',
    'w-full',
  ],
  result: [
    'bg-base-200',
    'p-4',
    'rounded-lg',
  ],
}))

async function showAlert() {
  try {
    await dialog.alert({
      title: '警告',
      content: '这是一个警告对话框的示例。',
      confirmText: '知道了',
    })
    result.value = '用户点击了确认按钮'
  }
  catch {
    result.value = '对话框被取消或关闭'
  }
}

async function showConfirm() {
  try {
    const confirmed = await dialog.confirm({
      title: '确认操作',
      content: '你确定要执行这个操作吗？',
      confirmText: '确认',
      cancelText: '取消',
    })
    result.value = confirmed ? '用户确认了操作' : '用户取消了操作'
  }
  catch {
    result.value = '对话框被取消或关闭'
  }
}

function showCustom() {
  const instance = dialog.create({
    title: '自定义对话框',
    content: '这是一个自定义对话框，你可以手动控制它的显示和隐藏。',
  })
  result.value = `创建了自定义对话框 ${instance.id}`
}

function showWithComponent() {
  const instance = dialog.create({
    title: '带组件内容的对话框',
    content: CustomContent,
  })

  result.value = `创建了带组件内容的对话框 ${instance.id}`
}

function closeAll() {
  dialog.closeAll()
  result.value = '所有对话框已关闭'
}
</script>
