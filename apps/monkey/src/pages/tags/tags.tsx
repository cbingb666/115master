import type { TagFormState } from './TagFormContent'
import type { Tag } from '@/store/tagList'
import { Api, Core } from '@115master/drive115'
import { useTitle } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { computed, defineComponent, h, onBeforeMount, reactive, watch } from 'vue'
import LogoWordmark from '@/assets/logo-wordmark-inline.svg?component'
import {
  Header,
  Layout,
  LoadingError,
  Main,
  Menu,
  Progress,
  Sider,
  useDialog,
  useToast,
} from '@/components'
import { I, Icon } from '@/icons'
import { useTagStore } from '@/store/tagList'
import TagFormContent from './TagFormContent'
import TagItem from './TagItem'

const { LabelColor } = Api.TagApi.Req

const Tags = defineComponent({
  name: 'Tags',
  setup: () => {
    useTitle('标签管理 · 115Master')

    const store = useTagStore()
    const dialog = useDialog()
    const toast = useToast()

    /** URL ↔ 搜索词桥接（store 自身不依赖 router，便于 node 环境测试） */
    const keyword = useRouteQuery<string>('keyword', '', { mode: 'push' })
    watch(keyword, v => store.setKeyword(v), { immediate: true })

    onBeforeMount(() => store.load())

    const isBatch = computed(() => store.selectedCount > 0)
    const emptyText = computed(() =>
      store.keyword ? '无匹配标签' : '暂无标签，点击右上角「新建标签」',
    )

    function openTagForm(tag?: Tag) {
      const form = reactive<TagFormState>({
        name: tag?.name ?? '',
        color: tag?.color ?? LabelColor.Blank,
        error: '',
        submitting: false,
      })
      dialog.create({
        title: tag ? '编辑标签' : '新建标签',
        content: () => h(TagFormContent, { form }),
        confirmText: tag ? '保存' : '创建',
        cancelText: '取消',
        maskClosable: true,
        confirmCallback: async () => {
          if (form.submitting)
            return false
          const err = store.checkName(form.name, tag?.id)
          if (err) {
            form.error = err
            return false
          }
          form.submitting = true
          try {
            if (tag)
              await store.update(tag.id, form.name.trim(), form.color)
            else
              await store.create(form.name.trim(), form.color)
            toast.success(tag ? '已更新标签' : '已创建标签')
          }
          catch (e) {
            form.error = Core.toDrive115Error(e).message
            return false
          }
          finally {
            form.submitting = false
          }
        },
      })
    }

    async function deleteTag(tag: Tag) {
      const confirmed = await dialog.confirm({
        title: '删除标签',
        content: `确定删除「${tag.name}」吗？该标签会从所有关联文件移除，且不可恢复。`,
        confirmText: '删除',
        cancelText: '取消',
      })
      if (!confirmed)
        return
      try {
        await store.remove(tag.id)
        toast.success('已删除标签')
      }
      catch (e) {
        toast.error(Core.toDrive115Error(e).message)
      }
    }

    async function deleteBatch() {
      const ids = store.selectedIds
      if (ids.length === 0)
        return
      const confirmed = await dialog.confirm({
        title: '批量删除标签',
        content: `将删除 ${ids.length} 个标签，并从所有关联文件移除，且不可恢复。`,
        confirmText: '删除',
        cancelText: '取消',
      })
      if (!confirmed)
        return
      const failed = await store.removeBatch(ids)
      if (failed.length === 0) {
        toast.success(`已删除 ${ids.length} 个标签`)
        return
      }
      const names = failed
        .map(f => store.tags.find(t => t.id === f.id)?.name ?? f.id)
        .join('、')
      toast.error(`${failed.length} 个删除失败：${names}`)
    }

    function SiderContent() {
      return (
        <>
          <div class="flex items-center justify-center pt-7 pb-4">
            <LogoWordmark role="img" aria-label="115Master" class="text-base-content h-10 w-auto" />
          </div>
          <div class="bg-base-content/5 mb-3 h-px w-full" />
          <Menu class="flex-1" />
        </>
      )
    }

    function SearchInput() {
      return (
        <div class="bg-base-content/10 flex h-9 items-center gap-2 rounded-full px-3 sm:w-64">
          <Icon name={I.SEARCH} size="sm" class="text-base-content/50 flex-none" />
          <input
            class="h-full w-full bg-transparent text-sm outline-none"
            value={keyword.value}
            placeholder="搜索标签"
            onInput={e => keyword.value = (e.target as HTMLInputElement).value}
          />
          {keyword.value && (
            <button
              type="button"
              class="text-base-content/50 hover:text-base-content flex-none"
              title="清除"
              onClick={() => keyword.value = ''}
            >
              <Icon name={I.CLOSE} size="xs" />
            </button>
          )}
        </div>
      )
    }

    function ListHeader() {
      if (isBatch.value) {
        return (
          <Header>
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                class="btn btn-circle btn-ghost btn-sm"
                title="退出选择"
                onClick={() => store.clearSelection()}
              >
                <Icon name={I.CLOSE} />
              </button>
              <span class="font-medium">{`已选 ${store.selectedCount} 项`}</span>
            </div>
            <div class="flex flex-none items-center gap-0.5">
              <button type="button" class="btn btn-ghost btn-sm gap-1" title="全选" onClick={() => store.selectAll()}>
                <Icon name={I.SELECT_ALL} size="sm" />
                <span class="hidden sm:inline">全选</span>
              </button>
              <button type="button" class="btn btn-ghost btn-sm gap-1" title="反选" onClick={() => store.invert()}>
                <Icon name={I.INVERT} size="sm" />
                <span class="hidden sm:inline">反选</span>
              </button>
              <button
                type="button"
                class="btn btn-error btn-sm gap-1"
                title="删除选中"
                onClick={() => deleteBatch()}
              >
                <Icon name={I.DELETE} size="sm" />
                <span class="hidden sm:inline">删除</span>
              </button>
            </div>
          </Header>
        )
      }
      return (
        <Header>
          <div class="flex min-w-0 flex-1 items-center gap-2.5">
            <Icon name={I.TAG} class="text-xl" />
            <span class="truncate text-lg font-medium">标签管理</span>
            <span class="text-base-content/50 flex-none text-sm">{store.tags.length}</span>
          </div>
          <div class="flex flex-none items-center gap-2">
            <SearchInput />
            <button
              type="button"
              class="btn btn-primary btn-sm gap-1"
              onClick={() => openTagForm()}
            >
              <Icon name={I.PLUS} size="sm" />
              <span class="hidden sm:inline">新建标签</span>
            </button>
          </div>
        </Header>
      )
    }

    function ListArea() {
      if (store.error) {
        return (
          <div class="flex flex-1 items-center justify-center pt-20">
            <LoadingError
              message={store.error}
              retryable
              retryText="重试"
              onRetry={() => store.load()}
            />
          </div>
        )
      }
      const list = store.filtered
      return (
        <div class="relative flex-1 px-3 pb-24 sm:px-5">
          <Progress active={store.loading} />
          {!store.loading && list.length === 0 && (
            <div class="text-base-content/60 flex flex-col items-center justify-center gap-3 pt-24">
              <Icon name={I.TAG} class="text-base-content/25 text-6xl" />
              <span>{emptyText.value}</span>
            </div>
          )}
          {!store.loading && list.length > 0 && (
            <ul class="grid grid-cols-1 gap-1.5 pt-3 sm:gap-1">
              {list.map(tag => (
                <TagItem
                  key={tag.id}
                  tag={tag}
                  selected={store.isSelected(tag.id)}
                  onToggle={on => store.toggle(tag.id, on)}
                  onEdit={() => openTagForm(tag)}
                  onDelete={() => deleteTag(tag)}
                />
              ))}
            </ul>
          )}
        </div>
      )
    }

    return () => (
      <div class="flex h-full flex-col">
        <Layout>
          <Sider>
            <SiderContent />
          </Sider>
          <Main class="relative flex min-h-screen flex-col">
            <ListHeader />
            <ListArea />
          </Main>
        </Layout>
      </div>
    )
  },
})

export default Tags
