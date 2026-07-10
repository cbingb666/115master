<template>
  <div :class="styles.container">
    <!-- 隐藏的文件输入 -->
    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleFileChange">

    <div :class="styles.content">
      <template v-for="group in groupedActions" :key="group.key">
        <div :class="styles.groupWrapper">
          <div :class="styles.groupTitle">
            <span>{{ group.name }}</span>
          </div>
          <div :class="styles.groupContent">
            <ShortcutsItem
              v-for="action in group.actions"
              :key="action.key"
              :action-key="action.key"
              :action="action.config"
              :key-bindings="action.keyBindings"
              @update:key-bindings="shortcuts.updateActionKeyBindings(action.key, $event)"
              @reset="shortcuts.resetActionKeyBindings(action.key)"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- 底部操作按钮 -->
    <div :class="styles.footer">
      <div :class="styles.actions">
        <button :class="styles.actionBtn" type="button" @click="handleImport">
          <Icon :name="I.IMPORT" class="size-3.5" />
          <span>导入</span>
        </button>
        <button :class="styles.actionBtn" type="button" @click="handleExport">
          <Icon :name="I.EXPORT" class="size-3.5" />
          <span>导出</span>
        </button>
        <button
          v-if="hasCustomConfig"
          type="button"
          :class="[styles.actionBtn]"
          @click="handleResetAll"
        >
          <Icon :name="I.RESET_ALL" class="size-3.5" />
          重置全部
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import ShortcutsItem from '@/components/XPlayer/components/Shortcuts/components/ShortcutsItem.vue'
import { ACTION_GROUPS, EXPORT_FILE_PREFIX } from '@/components/XPlayer/components/Shortcuts/shortcuts.const'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  container: [
    'flex flex-col',
    'flex-1',
    'min-h-0',
  ],
  content: [
    'px-2 py-8',
    'overflow-y-auto',
  ],

  // ===== 分组容器 =====
  groupWrapper: 'mb-8 last:mb-0',
  groupTitle: [
    'mx-4 mt-6 mb-3 first:mt-0',
    'flex items-center gap-1.5',
    'text-md font-semibold',
    'pl-4',
  ],
  groupContent: [
    'mx-4',
    'bg-base-200',
    'rounded-2xl',
  ],

  // ===== 底部操作区 =====
  footer: [
    'flex items-center justify-end gap-2.5',
    'border-base-content/10 border-t',
    'px-5 py-4',
  ],
  actions: 'flex items-center gap-2.5',
  actionBtn: [
    'btn btn-sm btn-ghost',
    'gap-1',
  ],
})

const { shortcuts } = usePlayerContext()
const fileInputRef = shallowRef<HTMLInputElement>()
const actionList = computed(() => shortcuts.getActionList())
const hasCustomConfig = shortcuts.hasCustomConfig

/** 分组 Action */
const groupedActions = computed(() => {
  const actions = actionList.value

  /** 按照 ACTION_GROUPS 的顺序创建分组 */
  const groupOrder = Object.values(ACTION_GROUPS)
  const groupsMap = new Map<string, typeof actions>()

  /** 初始化所有分组 */
  for (const group of groupOrder) {
    groupsMap.set(group.key, [])
  }

  /** 将 actions 分配到对应的组 */
  for (const action of actions) {
    const group = action.config.group
    if (group && groupsMap.has(group.key)) {
      groupsMap.get(group.key)!.push(action)
    }
  }

  /** 返回有内容的分组（按顺序） */
  return groupOrder
    .map(group => ({
      key: group.key,
      name: group.name,
      actions: groupsMap.get(group.key) || [],
    }))
    .filter(group => group.actions.length > 0)
})

/**
 * 重置所有快捷键
 */
function handleResetAll() {
  if (confirm('确定重置所有快捷键？'))
    shortcuts.resetAllActionKeyBindings()
}

/**
 * 导入快捷键配置
 */
function handleImport() {
  fileInputRef.value?.click()
}

/**
 * 导出快捷键配置
 */
function handleExport() {
  const json = shortcuts.exportPreference()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${EXPORT_FILE_PREFIX}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 文件变化事件处理
 */
function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    if (shortcuts.importPreference(content)) {
      alert('导入成功')
    }
    else {
      alert('导入失败：配置格式无效')
    }
  }
  reader.readAsText(file)
  input.value = ''
}
</script>
