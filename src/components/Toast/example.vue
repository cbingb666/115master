<template>
  <div :class="styles.container">
    <h2 :class="styles.title">
      Toast 组件使用示例
    </h2>

    <div :class="styles.buttonGroup">
      <button :class="styles.successButton" @click="showSuccess">
        显示成功消息
      </button>

      <button :class="styles.errorButton" @click="showError">
        显示错误消息
      </button>

      <button :class="styles.warningButton" @click="showWarning">
        显示警告消息
      </button>

      <button :class="styles.infoButton" @click="showInfo">
        显示信息消息
      </button>

      <button :class="styles.button" @click="showCustom">
        显示自定义消息
      </button>

      <button :class="styles.button" @click="showWithTitle">
        显示带标题的消息
      </button>

      <button :class="styles.button" @click="showLongMessage">
        显示长消息
      </button>

      <button :class="styles.button" @click="showWithComponent">
        显示带组件内容的消息
      </button>

      <button :class="styles.button" @click="showPersistent">
        显示持久化消息
      </button>

      <button :class="styles.dangerButton" @click="clearAll">
        清除所有 Toast
      </button>
    </div>

    <div :class="styles.result">
      <h3>操作结果：</h3>
      <p>{{ result }}</p>
    </div>

    <ToastContainer position="top-right" :max-count="3" />
  </div>
</template>

<script setup lang="tsx">
import { computed, defineComponent, ref } from 'vue'
import { useToast } from '@/components/Toast/hooks'

const result = ref('等待操作...')

const toast = useToast()

/** 自定义组件示例 */
const CustomContent = defineComponent({
  name: 'CustomContent',
  setup() {
    return () => {
      return (
        <div>
          <p class="font-bold">这是一个自定义组件</p>
          <p class="text-sm text-gray-600">可以包含任何 Vue 组件内容</p>
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
  successButton: [
    'btn',
    'btn-success',
    'w-full',
  ],
  errorButton: [
    'btn',
    'btn-error',
    'w-full',
  ],
  warningButton: [
    'btn',
    'btn-warning',
    'w-full',
  ],
  infoButton: [
    'btn',
    'btn-info',
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

function showSuccess() {
  toast.success('操作成功！')
  result.value = '显示了成功消息'
}

function showError() {
  toast.error('操作失败，请重试')
  result.value = '显示了错误消息'
}

function showWarning() {
  toast.warning('请注意，这是一个警告消息')
  result.value = '显示了警告消息'
}

function showInfo() {
  toast.info('这是一个信息提示')
  result.value = '显示了信息消息'
}

function showCustom() {
  toast.create({
    type: 'success',
    content: '这是一个自定义的消息',
    duration: 5000,
    closable: true,
  })
  result.value = '显示了自定义消息'
}

function showWithTitle() {
  toast.create({
    type: 'info',
    title: '重要提示',
    content: '这是一个带标题的消息',
    duration: 4000,
  })
  result.value = '显示了带标题的消息'
}

function showLongMessage() {
  toast.create({
    type: 'warning',
    title: '长消息示例',
    content: '这是一个很长的消息内容，用来展示Toast组件如何处理长文本内容。长文本会自动换行显示，确保用户能够阅读完整的消息内容。',
    duration: 6000,
  })
  result.value = '显示了长消息'
}

function showWithComponent() {
  toast.create({
    type: 'info',
    title: '组件内容',
    content: CustomContent,
    duration: 5000,
  })
  result.value = '显示了带组件内容的消息'
}

function showPersistent() {
  toast.create({
    type: 'error',
    title: '持久化消息',
    content: '这个消息不会自动消失，需要手动关闭',
    duration: 0, // 不自动关闭
    closable: true,
  })
  result.value = '显示了持久化消息'
}

function clearAll() {
  toast.clear()
  result.value = '清除了所有 Toast'
}
</script>
