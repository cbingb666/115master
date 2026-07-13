/**
 * 文件打标签的增量 diff 纯函数。
 *
 * 底层 `drive115.tag.setFileLabels(fileId, labelIds)` 是全量替换语义——
 * 传哪些 id，文件最终只剩哪些。为满足「加 / 减、保留其他」的用户语义，
 * 靠客户端 diff 实现：以「选中文件标签交集」为初始勾选，final 为用户调整后的勾选，
 * added / removed 据此推导，每文件的目标集只动 added / removed，其余保留。
 *
 * 刻意不依赖 pinia / drive115 / DOM，便于在 node 环境单测。
 */

/** 单个文件应传给 `setFileLabels` 的目标标签集 */
export interface FileTagChange {
  fileId: string
  labelIds: string[]
}

/** 选中文件的标签输入（`id` = `getFilesItemId`，`tagIds` = `fl` 的 id 集） */
export interface FileTagInput {
  id: string
  tagIds: string[]
}

/** 两个 string 集合是否相等（与顺序无关） */
export function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size)
    return false
  for (const id of a) {
    if (!b.has(id))
      return false
  }
  return true
}

/**
 * 选中文件 tagId 集合的交集。
 *
 * 单文件即其全部标签；任一文件无标签则交集为空。
 * 用于弹窗的初始勾选态。
 */
export function intersectTagIds(files: FileTagInput[]): Set<string> {
  if (files.length === 0)
    return new Set()
  const first = new Set(files[0]!.tagIds)
  return files.slice(1).reduce(
    (acc, file) => {
      const set = new Set(file.tagIds)
      return new Set([...acc].filter(id => set.has(id)))
    },
    first,
  )
}

/**
 * 计算每个文件应传给 `setFileLabels` 的目标 `labelIds`。
 *
 * - `added = final − 交集`：新勾选的、不在交集里的标签，加到所有文件。
 * - `removed = 交集 − final`：被取消的交集标签，从所有文件移除。
 * - 每个文件目标 = `(当前 − removed) ∪ added`，其余标签保留。
 * - `fl` 为空 / undefined（即 `tagIds` 为空数组）当空集参与计算。
 * - 与当前相同的目标被省略以省请求；没有任何勾选变化时返回空数组。
 */
export function resolveFileTagChanges(files: FileTagInput[], final: Set<string>): FileTagChange[] {
  const intersection = intersectTagIds(files)
  const added = new Set([...final].filter(id => !intersection.has(id)))
  const removed = new Set([...intersection].filter(id => !final.has(id)))
  if (added.size === 0 && removed.size === 0)
    return []

  const changes: FileTagChange[] = []
  for (const file of files) {
    const target = new Set(file.tagIds)
    for (const id of removed)
      target.delete(id)
    for (const id of added)
      target.add(id)
    // 与当前相同则省略（某文件已自然满足目标时无需写回）
    if (sameSet(target, new Set(file.tagIds)))
      continue
    changes.push({ fileId: file.id, labelIds: [...target] })
  }
  return changes
}
