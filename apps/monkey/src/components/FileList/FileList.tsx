import type { PropType, Ref } from 'vue'
import { defineComponent } from 'vue'
import Empty from '../Empty/Empty'
import LoadingError from '../LoadingError/LoadingError'
import Progress from '../Progress/Progress'

const FileList = defineComponent({
  name: 'FileList',
  props: {
    viewType: {
      type: String as PropType<'card' | 'list'>,
      default: 'list',
    },
    containerRef: {
      type: Object as PropType<Ref<HTMLElement | undefined>>,
      default: undefined,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Object as PropType<Error | string | null>,
      default: null,
    },
    empty: {
      type: Boolean,
      default: false,
    },
    emptyDescription: {
      type: String,
      default: '没有文件',
    },
  },
  setup: (props, { slots }) => {
    return () => (
      <div class="relative w-full" data-view-type={props.viewType}>
        {/* Error State */}
        {props.error && (
          <LoadingError
            class="absolute inset-0 m-auto"
            message={props.error}
            size="mini"
          />
        )}

        {/* Loading State */}
        {!props.error && <Progress active={props.loading} />}

        {/* Empty State */}
        {!props.error && !props.loading && props.empty && (
          <Empty
            class="absolute inset-0 m-auto"
            description={props.emptyDescription}
          />
        )}

        {/* Content */}
        {!props.error && !props.loading && !props.empty && (
          <div
            ref={props.containerRef}
            class={[
              'relative w-full focus-within:outline-none',
              // card
              'data-[view-type=card]:grid data-[view-type=card]:grid-cols-2',
              'data-[view-type=card]:items-stretch data-[view-type=card]:gap-3',
              // list
              'data-[view-type=list]:grid data-[view-type=list]:w-full',
              'data-[view-type=list]:grid-cols-1 data-[view-type=list]:gap-1',
              // card
              'data-[view-type=card]:sm:grid-cols-4 data-[view-type=card]:sm:gap-5',
              'data-[view-type=card]:xl:grid-cols-4',
              'data-[view-type=card]:2xl:grid-cols-5',
            ].join(' ')}
            data-view-type={props.viewType}
            tabindex="0"
          >
            {slots.default?.()}
          </div>
        )}
      </div>
    )
  },
})

export default FileList
