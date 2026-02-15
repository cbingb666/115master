import type { WebApi } from '@115master/drive115'
import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { computed, defineComponent } from 'vue'
import { formatFileSize, formatYMDHM } from '@/utils/format'

const FileListItemContent = defineComponent({
  name: 'FileListItemContent',
  props: {
    data: {
      type: Object as PropType<WebApi.Entity.FilesItem>,
      required: true,
    },
    pathSelect: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    function formatTime(data: typeof props.data): string {
      const time = data.t
      const timeNum = Number(time)
      if (timeNum) {
        return formatYMDHM(timeNum * 1000)
      }
      return formatYMDHM(time)
    }

    const isStarred = computed(() =>
      props.data.m === 1 || props.data.m === '1',
    )

    return () => (
      <div
        class="
          flex-1
          group-data-[view-type=card]:grid group-data-[view-type=card]:min-w-0
          group-data-[view-type=card]:grid-cols-[1fr_auto]
          group-data-[view-type=card]:grid-rows-[auto_auto_auto]
          group-data-[view-type=card]:gap-1 group-data-[view-type=card]:p-3
          group-data-[view-type=list]:min-w-0 group-data-[view-type=list]:flex-col
          group-data-[view-type=list]:items-center group-data-[view-type=list]:gap-4
          sm:group-data-[view-type=list]:flex sm:group-data-[view-type=list]:flex-row
        "
      >
        {/* 文件名区域 */}
        <span
          class="
            relative flex-1
            group-data-[view-type=card]:col-span-2 group-data-[view-type=card]:row-start-1
            group-data-[view-type=list]:space-x-2
          "
        >
          {/* 文件名 */}
          <span
            class="
              text-base wrap-anywhere text-neutral-100
              group-data-[view-type=card]:line-clamp-4 group-data-[view-type=card]:font-medium
              group-data-[view-type=list]:truncate group-data-[view-type=list]:max-sm:block
            "
            title={props.data.ns ?? props.data.n}
            v-html={props.data.ns ?? props.data.n}
          >
          </span>
          {/* 星标 */}
          {isStarred.value && (
            <Icon
              class="
                inline-flex
                group-data-[view-type=card]:size-4
                group-data-[view-type=list]:size-5
              "
              icon="material-icon-theme:github-sponsors"
            />
          )}
        </span>

        {/* 标签 */}
        <span
          class="
            flex flex-wrap items-center
            group-data-[view-type=card]:col-span-2
            group-data-[view-type=card]:row-start-2
            group-data-[view-type=card]:gap-1
            group-data-[view-type=list]:max-w-50
            group-data-[view-type=list]:justify-end
            group-data-[view-type=list]:gap-2
          "
          v-show={(props.data.fl?.length ?? 0) > 0}
        >
          {
            props.data.fl?.map(tag => (
              <span
                key={tag.id}
                class="
                  badge bg-base-content/10 group-data-[view-type=card]:badge-xs
                  group-data-[view-type=list]:badge-sm
                  border-none
                "
                style={{
                  backgroundColor: `color-mix(in oklab, ${tag.color} 70%, transparent)`,
                }}
              >
                { tag.name }
              </span>
            ))
          }
        </span>

        {/* 文件大小 */}
        {
          !props.pathSelect && props.data.s
            ? (
                <span
                  class="
                    text-base-content/60
                    group-data-[view-type=card]:col-start-2
                    group-data-[view-type=card]:row-start-3
                    group-data-[view-type=card]:text-right
                    group-data-[view-type=card]:text-xs
                    group-data-[view-type=list]:w-24
                    group-data-[view-type=list]:text-xs
                    sm:group-data-[view-type=list]:text-sm
                  "
                >
                  { formatFileSize(Number(props.data.s)) }
                </span>
              )
            : null
        }

        {/* 修改时间 */}
        <span
          class="
            text-base-content/60
            group-data-[view-type=card]:col-start-1
            group-data-[view-type=card]:row-start-3
            group-data-[view-type=card]:text-xs
            group-data-[view-type=list]:w-60
            group-data-[view-type=list]:text-xs
            sm:group-data-[view-type=list]:text-sm
          "
          v-show={!props.pathSelect}
          data-tip="修改时间"
        >
          { formatTime(props.data) }
        </span>
      </div>
    )
  },
})

export default FileListItemContent
