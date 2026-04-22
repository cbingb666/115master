<template>
  <div :class="$style.wrap">
    <div
      v-for="(item, i) in items"
      :key="item.id"
      :class="$style.row"
    >
      <input
        :value="item.name"
        class="input input-bordered input-sm w-40"
        placeholder="名称"
        @input="update(i, 'name', ($event.target as HTMLInputElement).value)"
      >
      <input
        :value="item.url"
        class="input input-bordered input-sm flex-1"
        placeholder="http://token:密钥@127.0.0.1:6800/jsonrpc"
        @input="update(i, 'url', ($event.target as HTMLInputElement).value)"
      >
      <button class="btn btn-sm btn-ghost" @click="onTest(i)">
        测试
      </button>
      <button class="btn btn-sm btn-ghost text-error" @click="remove(i)">
        删除
      </button>
      <span v-if="testResults[item.id]" :class="$style.result">
        {{ testResults[item.id] }}
      </span>
    </div>
    <button class="btn btn-sm btn-primary self-start" @click="add">
      + 添加 RPC
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Aria2RpcPreset } from '@/utils/aria2'
import { nanoid } from 'nanoid'
import { reactive, watch } from 'vue'
import { testRpc } from '@/utils/aria2'

const props = defineProps<{ modelValue: Aria2RpcPreset[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: Aria2RpcPreset[]): void }>()

const items = reactive<Aria2RpcPreset[]>([...props.modelValue])
const testResults = reactive<Record<string, string>>({})

watch(() => props.modelValue, (next) => {
  items.splice(0, items.length, ...next)
}, { deep: true })

function emitChange() {
  emit('update:modelValue', JSON.parse(JSON.stringify(items)))
}

function update(i: number, k: 'name' | 'url', v: string) {
  items[i][k] = v
  emitChange()
}

function add() {
  items.push({ id: nanoid(), name: '', url: '' })
  emitChange()
}

function remove(i: number) {
  items.splice(i, 1)
  emitChange()
}

async function onTest(i: number) {
  const item = items[i]
  testResults[item.id] = '连接中...'
  try {
    const v = await testRpc(item.url)
    testResults[item.id] = `v${v}`
  }
  catch (e) {
    testResults[item.id] = e instanceof Error ? e.message : '失败'
  }
}
</script>

<style module>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.result {
  font-size: 12px;
  color: #64748b;
  margin-left: 4px;
}
</style>
