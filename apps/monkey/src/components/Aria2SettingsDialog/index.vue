<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box w-11/12 max-w-3xl">
      <h3 class="font-bold text-lg mb-4">
        Aria2 导出设置
      </h3>

      <div :class="$style.section">
        <label class="label">RPC 列表</label>
        <RpcListEditor v-model="form.rpcList" />
      </div>

      <div :class="$style.section">
        <label class="label">下载路径（可选）</label>
        <input
          v-model="form.downloadPath"
          class="input input-bordered w-full"
          placeholder="绝对路径，对应 aria2 --dir"
        >
      </div>

      <div :class="$style.section">
        <label class="label">递归间隔（ms）</label>
        <input
          v-model.number="form.intervalMs"
          type="number"
          class="input input-bordered w-40"
          min="0"
        >
      </div>

      <div :class="$style.section">
        <label class="label cursor-pointer justify-start gap-2">
          <input
            v-model="form.sha1Check"
            type="checkbox"
            class="checkbox checkbox-sm"
          >
          SHA1 校验
        </label>
      </div>

      <div :class="$style.section">
        <label class="label cursor-pointer justify-start gap-2">
          <input
            v-model="form.useBrowserUA"
            type="checkbox"
            class="checkbox checkbox-sm"
          >
          使用浏览器 UA
        </label>
        <input
          v-model="form.userAgent"
          class="input input-bordered w-full mt-2"
          :disabled="form.useBrowserUA"
          placeholder="自定义 User-Agent"
        >
      </div>

      <div :class="$style.section">
        <label class="label">Referer</label>
        <input v-model="form.referer" class="input input-bordered w-full">
      </div>

      <div :class="$style.section">
        <label class="label">自定义 Headers（每行 Key: Value）</label>
        <textarea
          v-model="form.extraHeaders"
          class="textarea textarea-bordered w-full h-24"
        />
      </div>

      <div class="modal-action">
        <button class="btn" @click="onReset">
          重置
        </button>
        <button class="btn btn-primary" @click="onApply">
          应用
        </button>
        <button class="btn" @click="close">
          关闭
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import type { Aria2Settings } from '@/utils/aria2'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { ARIA2_DEFAULT_SETTINGS, aria2Events, readSettings, writeSettings } from '@/utils/aria2'
import RpcListEditor from './RpcListEditor.vue'

const dialogRef = ref<HTMLDialogElement | null>(null)
const form = reactive<Aria2Settings>({ ...readSettings() })

function refill() {
  Object.assign(form, readSettings())
  if (!form.userAgent)
    form.userAgent = navigator.userAgent
}

function open() {
  refill()
  dialogRef.value?.showModal()
}

function close() {
  dialogRef.value?.close()
}

function onApply() {
  const cleaned: Aria2Settings = {
    ...form,
    rpcList: form.rpcList.filter(r => r.name.trim() && r.url.trim()),
  }
  writeSettings(cleaned)
  close()
}

function onReset() {
  Object.assign(form, ARIA2_DEFAULT_SETTINGS)
}

onMounted(() => {
  aria2Events.on('aria2:open-settings', open)
})
onUnmounted(() => {
  aria2Events.off('aria2:open-settings', open)
})
</script>

<style module>
.section {
  margin-bottom: 16px;
}
</style>
