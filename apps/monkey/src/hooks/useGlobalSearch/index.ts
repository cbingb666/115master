import { useStorage } from '@vueuse/core'
import { ref, watch } from 'vue'
import { router } from '@/app/router'

const show = ref(false)
const word = ref('')
const history = useStorage<string[]>('115Master_search_history', [])
const idx = ref(-1)

const maxHistory = 10

watch(word, (v, o) => {
  if (v === o)
    return
  idx.value = -1
})

function isInputEmpty() {
  return !word.value.trim()
}

function getCurrentSize() {
  if (isInputEmpty())
    return history.value.length
  return 0
}

function addHistory(v: string) {
  const value = v.trim()
  if (!value)
    return
  history.value = [
    value,
    ...history.value.filter(item => item !== value),
  ].slice(0, maxHistory)
}

function getCurrentWord() {
  if (idx.value < 0)
    return word.value
  if (isInputEmpty())
    return history.value[idx.value] ?? word.value
  return word.value
}

function open() {
  show.value = true
  idx.value = -1
}

function close() {
  show.value = false
  idx.value = -1
}

function change(v: string) {
  word.value = v
  idx.value = -1
}

function setIndex(v: number) {
  idx.value = v
}

function move(v: 1 | -1) {
  const total = getCurrentSize()
  if (!total) {
    idx.value = -1
    return
  }
  if (idx.value < 0) {
    idx.value = v > 0 ? 0 : total - 1
    return
  }
  const next = idx.value + v
  if (next < 0) {
    idx.value = -1
    return
  }
  if (next >= total) {
    idx.value = -1
    return
  }
  idx.value = next
}

async function submit(v?: string) {
  const value = (v ?? getCurrentWord() ?? '').trim()
  if (!value)
    return false
  addHistory(value)
  close()
  await router.push({
    path: '/drive/search/0',
    query: { keyword: value, page: '1' },
  })
  return true
}

function removeHistory(v: string) {
  history.value = history.value.filter(item => item !== v)
  if (!isInputEmpty())
    return
  const total = history.value.length
  if (!total) {
    idx.value = -1
    return
  }
  if (idx.value >= total)
    idx.value = total - 1
}

function clearHistory() {
  history.value = []
  if (isInputEmpty())
    idx.value = -1
}

export function useGlobalSearch() {
  return {
    show,
    word,
    history,
    idx,
    open,
    close,
    change,
    setIndex,
    move,
    submit,
    removeHistory,
    clearHistory,
  }
}
