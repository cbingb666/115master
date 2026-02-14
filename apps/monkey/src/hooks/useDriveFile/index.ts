import type { Ref } from 'vue'
import type { UseDriveFileOptions } from '@/hooks/useDriveFile/types'
import type { WebApi } from '@/utils/drive115/api'
import { toReactive, useAsyncState } from '@vueuse/core'
import { computed, ref, shallowRef } from 'vue'
import { drive115 } from '@/utils/drive115'

/** 分页 */
function useDrivePagination(options: {
  page: Ref<number>
  size: Ref<number>
}) {
  const total = shallowRef(0)
  const pageCount = computed(() => Math.ceil(total.value / options.size.value))

  const state = {
    page: options.page,
    size: options.size,
    total,
    pageCount,
  }

  const changePage = (changePage: number) => {
    if (changePage !== state.page.value) {
      state.page.value = changePage
    }
  }

  const changeSize = (changeSize: number) => {
    if (changeSize !== state.size.value) {
      state.size.value = changeSize
      state.page.value = 1
    }
  }

  return {
    state: toReactive(state),
    changePage,
    changeSize,
  }
}

/** 排序 */
function useDriveSorter({
  onChange,
}: {
  onChange: (order: WebApi.Entity.Sorter['o'], asc: WebApi.Entity.Sorter['asc'], fc_mix: WebApi.Entity.Sorter['fc_mix']) => void
}) {
  const order = shallowRef<WebApi.Entity.Sorter['o']>()
  const asc = shallowRef<WebApi.Entity.Sorter['asc']>()
  const fc_mix = shallowRef<WebApi.Entity.Sorter['fc_mix']>()

  const state = {
    order,
    asc,
    fc_mix,
  }

  const change = (changeOrder: WebApi.Entity.Sorter['o'], changeAsc: WebApi.Entity.Sorter['asc'], changeFcMix: WebApi.Entity.Sorter['fc_mix']) => {
    if (changeOrder !== state.order.value
      || changeAsc !== state.asc.value
      || changeFcMix !== state.fc_mix.value) {
      order.value = changeOrder
      asc.value = changeAsc
      fc_mix.value = changeFcMix
      onChange(changeOrder, changeAsc, changeFcMix)
    }
  }

  return {
    state: toReactive(state),
    change,
  }
}

/** 选中 */
function useDriveItemChecked() {
  /** 选中值 Set */
  const checkedSet = ref<Set<WebApi.Entity.FilesItem>>(new Set())
  /** 选中值 Array */
  const checkedValues = computed(() => Array.from(checkedSet.value))
  /** 选中数量 */
  const checkedCount = computed(() => checkedSet.value.size)
  /** 是否有选中 */
  const anyChecked = computed(() => checkedSet.value.size > 0)
  const hasMultiChecked = computed(() => checkedSet.value.size > 1)

  /** 是否选中 */
  function hasChecked(item: WebApi.Entity.FilesItem) {
    return checkedSet.value.has(item)
  }

  /** 清空所有选中 */
  function clearAllChecked() {
    checkedSet.value.clear()
  }

  /** 更新选中值 */
  function updateChecked(item: WebApi.Entity.FilesItem, checked: boolean) {
    if (checked) {
      checkedSet.value.add(item)
    }
    else {
      checkedSet.value.delete(item)
    }
  }

  function radioChecked(item: WebApi.Entity.FilesItem) {
    checkedSet.value.clear()
    checkedSet.value.add(item)
  }

  return {
    checkedSet,
    checkedValues,
    checkedCount,
    anyChecked,
    hasMultiChecked,
    clearAllChecked,
    hasChecked,
    updateChecked,
    radioChecked,
  }
}

/** 创建驱动 */
export function useDriveFile(options: UseDriveFileOptions) {
  /** 列表数据 */
  const list = useAsyncState((): Promise<WebApi.Res.Files | WebApi.Res.GetFilesSearch> => {
    if (options.area?.value === 'search') {
      return getSearchData()
    }
    else {
      return getListData()
    }
  }, null, { immediate: false, resetOnExecute: false })

  const pagination = useDrivePagination({
    page: options.page,
    size: options.size,
  })

  const sorter = useDriveSorter({
    onChange: () => {
      pagination.changePage(1)
      list.execute(undefined)
    },
  })
  const itemChecked = useDriveItemChecked()

  const path = computed((): WebApi.Entity.PathItem[] => {
    if (options.area?.value === 'search') {
      return [
        {
          cid: '0',
          name: '全部',
          aid: '0',
          pid: '',
          isp: '',
          iss: '',
          fv: '',
          fvs: '',
          p_cid: '',
        },
        {
          cid: '0',
          name: '搜索结果',
          aid: '0',
          pid: '',
          isp: '',
          iss: '',
          fv: '',
          fvs: '',
          p_cid: '',
        },
      ]
    }
    if (list.state.value) {
      return (list.state.value as WebApi.Res.Files).path ?? []
    }
    return []
  })

  /** 上一级路径 */
  const prevLevelPath = computed((): WebApi.Entity.PathItem | undefined => {
    if (list.state.value) {
      const path = (list.state.value as WebApi.Res.Files).path ?? []
      return path[path.length - 2] ?? undefined
    }
  })

  /** 获取数据 */
  async function getListData() {
    const page = Number(pagination.state.page)
    const size = Number(pagination.state.size)
    const cid = options.cid.value || '0'
    const area = options.area?.value || 'all'

    const offset = (page - 1) * size
    const limit = size
    const params: WebApi.Req.GetFiles = {
      aid: 1,
      cid,
      show_dir: 1,
      offset,
      limit,
      format: 'json',
      natsort: 1,
      custom_order: 0,
    }

    // 自定义排序
    if (sorter.state.order || sorter.state.asc || sorter.state.fc_mix) {
      params.custom_order = 1
      params.o = sorter.state.order
      params.asc = sorter.state.asc
      params.fc_mix = sorter.state.fc_mix
    }

    // 星标
    if (area === 'star') {
      params.star = 1
    }

    // 文件后缀
    if (options.suffix?.value) {
      params.suffix = options.suffix.value as string
    }

    // 文件类型
    if (options.type?.value) {
      params.type = Number(options.type.value)
    }

    // 不显示文件夹
    if (options.nf?.value) {
      params.nf = options.nf.value
    }

    let res: WebApi.Res.Files

    res = await drive115.webApiGetFiles(params)
    if (!res.state) {
      // 默认接口错误时使用 aps 接口获取数据，并且将文件排序设置为 aps 接口的排序
      params.o = res.order
      params.asc = res.is_asc
      res = await drive115.ApsGetNatsortFiles(params)
      if (!res.state) {
        throw new Error(res.error)
      }
    }

    pagination.state.total = res.count
    sorter.state.order = res.order
    sorter.state.asc = res.is_asc
    if (res.fc_mix !== undefined) {
      sorter.state.fc_mix = res.fc_mix
    }

    return res
  }

  /** 获取搜索数据 */
  async function getSearchData() {
    const page = Number(pagination.state.page)
    const size = Number(pagination.state.size)
    const cid = options.cid.value || '0'
    const area = options.area?.value || 'search'
    const keyword = options.keyword?.value || ''

    const offset = (page - 1) * size
    const limit = size
    const params: WebApi.Req.GetFilesSearch = {
      aid: 1,
      cid,
      show_dir: 1,
      offset,
      limit,
      format: 'json',
      fc_mix: 0,
      search_value: keyword,
    }

    // 自定义排序
    if (sorter.state.order || sorter.state.asc) {
      params.o = sorter.state.order
      params.asc = sorter.state.asc
    }

    // 星标
    if (area === 'star') {
      params.star = 1
    }

    // 文件后缀
    if (options.suffix?.value) {
      params.suffix = options.suffix.value as string
    }

    // 文件类型
    if (options.type?.value) {
      params.type = Number(options.type.value)
    }

    const res = await drive115.webApiGetFilesSearch(params)

    if (!res.state) {
      throw new Error(res.error)
    }

    pagination.state.total = res.count
    sorter.state.order = res.order
    sorter.state.asc = res.is_asc

    return res
  }

  /** 刷新数据 */
  const refresh = () => {
    list.execute(undefined)
  }

  return {
    options,
    list,
    path,
    prevLevelPath,
    itemChecked,
    pagination,
    sorter,
    refresh,
  }
}
