import { Api, Core } from '@115master/drive115'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { drive115 } from '@/utils/drive115Instance'

const { LabelColor } = Api.TagApi.Req

/** 标签名上限（联调后按 115 实际约束调整） */
export const TAG_NAME_MAX_LENGTH = 20

/** 一次全量加载的最大条数（标签量级小，前端过滤） */
const LOAD_LIMIT = 200

/**
 * 稳定的标签模型。
 *
 * 经 `normalizeTags` 从不确定的原始响应归一而来，组件与页面只消费此形状。
 */
export interface Tag {
  id: string
  name: string
  /** 归一为非空 hex；无色时取 `LabelColor.Blank` */
  color: string
  /** 归一为 number */
  sort: number
  createTime?: number
  updateTime?: number
}

/** 批量删除中单个失败项 */
export interface TagRemoveFailure {
  id: string
  error: Core.Drive115Error
}

type RawLabel = Record<string, unknown>

/** 单条原始标签 → Tag；缺 id/name 视为脏数据丢弃 */
function toTag(raw: unknown): Tag | null {
  if (!raw || typeof raw !== 'object')
    return null
  const r = raw as RawLabel
  const { id, name } = r
  if (typeof id !== 'string' || id === '')
    return null
  if (typeof name !== 'string' || name === '')
    return null
  const color = typeof r.color === 'string' && r.color !== '' ? r.color : LabelColor.Blank
  const sortRaw = Number(r.sort)
  const sort = Number.isFinite(sortRaw) ? sortRaw : 0
  const tag: Tag = { id, name, color, sort }
  if (typeof r.create_time === 'number')
    tag.createTime = r.create_time
  if (typeof r.update_time === 'number')
    tag.updateTime = r.update_time
  return tag
}

/**
 * adapter：把不确定的原始标签列表（`LabelInfo` 字段全 optional）转成稳定 `Tag` 列表。
 *
 * 联调时若 115 返回字段名 / 类型 / 存在性与封装不符，**只改这里**——
 * 组件与 store 外部行为不动（见 spec「稳定内部模型」）。
 */
export function normalizeTags(raw: unknown): Tag[] {
  if (!Array.isArray(raw))
    return []
  return raw.map(toTag).filter((t): t is Tag => t !== null)
}

export const useTagStore = defineStore('tagList', () => {
  const tags = shallowRef<Tag[]>([])
  const loading = ref(false)
  const error = ref<Core.Drive115Error | null>(null)
  const keyword = ref('')
  const selected = shallowRef<Set<string>>(new Set())

  /** 请求版本号，丢弃过期加载 */
  let generation = 0

  const filtered = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw)
      return tags.value
    return tags.value.filter(t => t.name.toLowerCase().includes(kw))
  })

  const selectedIds = computed(() => Array.from(selected.value))
  const selectedCount = computed(() => selected.value.size)

  async function load() {
    const gen = ++generation
    loading.value = true
    error.value = null
    try {
      const res = await drive115.tag.getLabels({ offset: 0, limit: LOAD_LIMIT })
      if (gen !== generation)
        return
      if (!res.state)
        throw new Core.Drive115Error(res.message || '加载标签失败', Core.Drive115ErrorCode.Unknown)
      tags.value = normalizeTags(res.data?.list)
    }
    catch (e) {
      if (gen !== generation)
        return
      error.value = Core.toDrive115Error(e)
    }
    finally {
      if (gen === generation)
        loading.value = false
    }
  }

  async function create(name: string, color: string) {
    const res = await drive115.tag.addLabels([{ name, color }])
    if (!res.state)
      throw new Core.Drive115Error(res.message || '创建标签失败', Core.Drive115ErrorCode.Unknown)
    /** addLabels 返回新建标签；响应缺数据时回退全量刷新 */
    const created = normalizeTags(res.data)
    if (created.length > 0) {
      tags.value = [...tags.value, ...created]
      return
    }
    await load()
  }

  async function update(id: string, name: string, color: string) {
    const res = await drive115.tag.editLabel({ id, name, color })
    if (!res.state)
      throw new Core.Drive115Error(res.message || '更新标签失败', Core.Drive115ErrorCode.Unknown)
    tags.value = tags.value.map(t => (t.id === id ? { ...t, name, color } : t))
  }

  async function remove(id: string) {
    const res = await drive115.tag.deleteLabel({ id })
    if (!res.state)
      throw new Core.Drive115Error(res.message || '删除标签失败', Core.Drive115ErrorCode.Unknown)
    tags.value = tags.value.filter(t => t.id !== id)
    // 同步移除选中态：成功删除的项不再可选；批量中失败的项保留选中（便于重试）
    if (selected.value.has(id)) {
      const next = new Set(selected.value)
      next.delete(id)
      selected.value = next
    }
  }

  /**
   * 批量删除：`Promise.allSettled` 聚合。
   *
   * 单个 `remove`（即 `deleteLabel`）仍遵循异常范式——失败抛 `Drive115Error`；
   * 批量聚合发生在本编排层，是对多个异常的收集，不引入 Result 范式（ADR-0001 兼容）。
   *
   * @returns 失败项列表（成功项已从列表移除、失败项保留）
   */
  async function removeBatch(ids: string[]): Promise<TagRemoveFailure[]> {
    const results = await Promise.allSettled(ids.map(id => remove(id)))
    const failed: TagRemoveFailure[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected')
        failed.push({ id: ids[i], error: Core.toDrive115Error(r.reason) })
    })
    return failed
  }

  /** 名称校验：空值 / 超长 / 查重（全量已加载，O(n)） */
  function checkName(name: string, excludeId?: string): string | null {
    const n = name.trim()
    if (!n)
      return '标签名不能为空'
    if (n.length > TAG_NAME_MAX_LENGTH)
      return `标签名不能超过 ${TAG_NAME_MAX_LENGTH} 个字符`
    if (tags.value.some(t => t.name === n && t.id !== excludeId))
      return '标签名已存在'
    return null
  }

  function setKeyword(v: string) {
    keyword.value = v
  }

  function isSelected(id: string) {
    return selected.value.has(id)
  }

  function toggle(id: string, on: boolean) {
    const next = new Set(selected.value)
    if (on)
      next.add(id)
    else
      next.delete(id)
    selected.value = next
  }

  function selectAll() {
    selected.value = new Set(filtered.value.map(t => t.id))
  }

  function invert() {
    const next = new Set(selected.value)
    for (const t of filtered.value) {
      if (next.has(t.id))
        next.delete(t.id)
      else
        next.add(t.id)
    }
    selected.value = next
  }

  function clearSelection() {
    selected.value = new Set()
  }

  return {
    tags,
    loading,
    error,
    keyword,
    selected,
    filtered,
    selectedIds,
    selectedCount,
    load,
    create,
    update,
    remove,
    removeBatch,
    checkName,
    setKeyword,
    isSelected,
    toggle,
    selectAll,
    invert,
    clearSelection,
  }
})
