import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import { format } from '@115master/utils'
import { computed, defineComponent } from 'vue'
import { I, Icon } from '@/icons'

const FileItemContent = defineComponent({
  name: 'FileItemContent',
  props: {
    data: {
      type: Object as PropType<Share.Entity.FilesItem>,
      required: true,
    },
    pathSelect: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const isStarred = computed(() =>
      props.data.m === 1 || props.data.m === '1',
    )
    const isTop = computed(() => props.data.is_top === 1)

    return () => (
      <div
        class="
          flex-1
          group-data-[view-type=card]:grid
          group-data-[view-type=card]:min-w-0
          group-data-[view-type=card]:grid-cols-[1fr_auto]
          group-data-[view-type=card]:grid-rows-[auto_1fr_auto]
          group-data-[view-type=card]:gap-1 group-data-[view-type=card]:p-3
          group-data-[view-type=list]:min-w-0 group-data-[view-type=list]:flex-col
          group-data-[view-type=list]:items-center group-data-[view-type=list]:gap-4
          sm:group-data-[view-type=list]:flex sm:group-data-[view-type=list]:flex-row
        "
      >
        {/* 文件名区域 */}
        <span
          class="
            relative min-w-0 flex-1
            group-data-[view-type=card]:col-span-2 group-data-[view-type=card]:row-start-1
            group-data-[view-type=list]:flex
            group-data-[view-type=list]:items-center group-data-[view-type=list]:gap-2
          "
        >
          {/* 置顶（list 视图内联在文件名前） */}
          {isTop.value && (
            <Icon
              class="
                text-primary hidden shrink-0
                group-data-[view-type=list]:-mr-1
                group-data-[view-type=list]:inline-flex
                group-data-[view-type=list]:size-4
              "
              name={I.TOP_SOLID}
            />
          )}
          {/* 文件名 */}
          <span
            class="
              text-base-content min-w-0 wrap-anywhere
              group-data-[view-type=card]:line-clamp-4
              group-data-[view-type=card]:text-sm
              group-data-[view-type=card]:font-medium
              group-data-[view-type=list]:shrink
              group-data-[view-type=list]:truncate
              group-data-[view-type=list]:text-sm
            "
          >
            {/* 置顶（card 视图内联在文件名前） */}
            {isTop.value && (
              <Icon
                class="
                  text-primary hidden
                  group-data-[view-type=card]:mr-0.5
                  group-data-[view-type=card]:inline-block
                  group-data-[view-type=card]:size-4
                  group-data-[view-type=card]:align-[-0.125em]
                "
                name={I.TOP_SOLID}
              />
            )}
            <span
              title={props.data.ns ?? props.data.n}
              v-html={props.data.ns ?? props.data.n}
            >
            </span>
            {isStarred.value && (
              <Icon
                class="
                  text-primary hidden
                  group-data-[view-type=card]:ml-1
                  group-data-[view-type=card]:inline-block
                  group-data-[view-type=card]:size-4
                  group-data-[view-type=card]:align-[-0.125em]
                "
                name={I.STAR_FILL}
              />
            )}
          </span>
          {/* 星标 */}
          {isStarred.value && (
            <Icon
              class="
                text-primary hidden shrink-0
                group-data-[view-type=list]:inline-flex
                group-data-[view-type=list]:size-5
              "
              name={I.STAR_FILL}
            />
          )}
        </span>

        {/* 标签 */}
        <span
          class="
            flex flex-wrap items-center gap-1
            group-data-[view-type=card]:col-span-2
            group-data-[view-type=card]:row-start-2
            group-data-[view-type=list]:max-w-50
            group-data-[view-type=list]:justify-end
          "
          v-show={(props.data.fl?.length ?? 0) > 0}
        >
          {
            props.data.fl?.map(tag => (
              <span
                key={tag.id}
                class="
                  badge bg-base-content/10 badge-sm
                  border-none
                "
                style={{ backgroundColor: tag.color }}
              >
                { tag.name }
              </span>
            ))
          }
        </span>

        {/* 文件大小 */}
        {
          props.data.s
            ? (
                <span
                  class="
                    app-font-file-size
                    text-base-content/50
                    group-data-[view-type=card]:col-start-2
                    group-data-[view-type=card]:row-start-3
                    group-data-[view-type=card]:hidden
                    group-data-[view-type=card]:text-xs
                    group-data-[view-type=list]:w-20
                    group-data-[view-type=list]:text-xs
                    sm:group-data-[view-type=list]:text-sm
                  "
                >
                  { format.fileSize(Number(props.data.s)) }
                </span>
              )
            : null
        }

        {/* 修改时间 */}
        <span
          class="
            text-base-content/50
            app-font-time
            group-data-[view-type=card]:col-start-1
            group-data-[view-type=card]:row-start-3
            group-data-[view-type=card]:hidden
            group-data-[view-type=card]:text-xs
            group-data-[view-type=list]:w-36
            group-data-[view-type=list]:text-right
            group-data-[view-type=list]:text-xs
            sm:group-data-[view-type=list]:text-sm
          "
          data-tip="修改时间"
        >
          { format.recentDateTime(props.data.t) }
        </span>
      </div>
    )
  },
})

export default FileItemContent
