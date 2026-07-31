/**
 * 文件列表 fixture：模拟 webapi.115.com/files 的目录数据
 * 字段对齐 @115master/drive115 的 Share.Entity.FilesItem
 */

/** 文件项（fc=1 文件 / fc=0 目录，字段名与 115 API 一致） */
export interface Item {
  /** 星标 */
  m: 0 | 1
  /** 文件名 */
  n: string
  /** 文件名（搜索高亮用，直接同 n） */
  ns: string
  /** pickcode */
  pc: string
  /** 文件大小 */
  s: number
  /** 创建时间 */
  t: number
  /** 更新时间 */
  tu: number
  /** 已播放时长 */
  play_long: number
  current_time: number
  /** sha1 */
  sha: string
  /** 是否视频 */
  iv: 0 | 1
  /** 0 目录 / 1 文件 */
  fc: 0 | 1
  /** 后缀 */
  ico: string
  /** 父级 ID */
  pid: string
  /** 清晰度 */
  vdi: number
  is_top: 0 | 1
  /** 缩略图 */
  u: string
  score: number
  /** 文件 ID */
  fid?: string
  /** 目录 ID */
  cid?: string
}

/** 一个目录的 fixture */
export interface Dir {
  cid: string
  name: string
  items: Item[]
}

let fidSeq = 900000000000000000

/** 造一个视频文件 */
export function video(n: string, pid: string): Item {
  const seq = ++fidSeq
  return {
    m: 0,
    n,
    ns: n,
    pc: `e2e${seq.toString(16)}pick`,
    s: 1500000000 + (seq % 1000) * 1000000,
    t: 1753000000,
    tu: 1753000000,
    play_long: 0,
    current_time: 0,
    sha: seq.toString(16).padStart(40, '0').toUpperCase(),
    iv: 1,
    fc: 1,
    ico: 'mp4',
    pid,
    vdi: 4,
    is_top: 0,
    u: '',
    score: 0,
    fid: String(seq),
  }
}

/** 造一个目录 */
export function folder(cid: string, n: string, pid: string): Item {
  return {
    m: 0,
    n,
    ns: n,
    pc: '',
    s: 0,
    t: 1752000000,
    tu: 1752500000,
    play_long: 0,
    current_time: 0,
    sha: '',
    iv: 0,
    fc: 0,
    ico: '',
    pid,
    vdi: 0,
    is_top: 0,
    u: '',
    score: 0,
    cid,
  }
}

/** 造一个普通文件（非视频） */
export function doc(n: string, pid: string): Item {
  return { ...video(n, pid), iv: 0, ico: 'pdf', vdi: 0 }
}

/** 目录注册表：根目录 + 两个子目录（根目录 43 项，够多页切片） */
export const dirs: Record<string, Dir> = {
  0: {
    cid: '0',
    name: '根目录',
    items: [
      folder('1001', '动漫', '0'),
      folder('1002', '电影', '0'),
      ...Array.from({ length: 40 }, (_, i) =>
        video(`演示视频 ${String(i + 1).padStart(2, '0')}.mp4`, '0')),
      doc('说明文档.pdf', '0'),
    ],
  },
  1001: {
    cid: '1001',
    name: '动漫',
    items: Array.from({ length: 12 }, (_, i) =>
      video(`动漫 第${String(i + 1).padStart(2, '0')}话.mp4`, '1001')),
  },
  1002: {
    cid: '1002',
    name: '电影',
    items: Array.from({ length: 5 }, (_, i) =>
      video(`电影 ${i + 1}.mp4`, '1002')),
  },
}

/** 目录路径（path 字段） */
function pathOf(dir: Dir) {
  const path = [{ cid: '0', name: '根目录', aid: '0', pid: '', p_cid: '', isp: '', iss: '', fv: '', fvs: '' }]
  if (dir.cid === '0')
    return path
  return [...path, { cid: dir.cid, name: dir.name, aid: '0', pid: '0', p_cid: '0', isp: '', iss: '', fv: '', fvs: '' }]
}

/** 按 115 /files 响应形状出数据（支持 offset/limit 分页） */
export function filesRes(dir: Dir, offset: number, limit: number) {
  const items = dir.items
  return {
    state: true,
    count: items.length,
    file_count: items.filter(i => i.fc === 1).length,
    folder_count: items.filter(i => i.fc === 0).length,
    is_asc: 1,
    order: 'file_name',
    fc_mix: 0,
    offset,
    cur: Math.floor(offset / limit) + 1,
    data: items.slice(offset, offset + limit),
    path: pathOf(dir),
  }
}

/** 按 115 /files/search 响应形状出数据（全库按文件名包含过滤） */
export function searchRes(keyword: string, offset: number, limit: number) {
  const all = Object.values(dirs).flatMap(d => d.items)
  const hits = keyword
    ? all.filter(i => i.n.toLowerCase().includes(keyword.toLowerCase()))
    : []
  return {
    state: true,
    count: hits.length,
    is_asc: 1,
    order: 'file_name',
    offset,
    cur: Math.floor(offset / limit) + 1,
    data: hits.slice(offset, offset + limit),
  }
}
