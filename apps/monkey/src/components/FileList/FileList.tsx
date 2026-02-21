import type { PropType, Ref } from 'vue'
import { defineComponent } from 'vue'

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
  },
  setup: (props, { slots }) => {
    return () => (
      <div
        ref={props.containerRef}
        class={[
          'relative w-full px-5 pt-5 pb-10 focus-within:outline-none',
          // card
          'data-[view-type=card]:grid data-[view-type=card]:grid-cols-2',
          'data-[view-type=card]:items-stretch data-[view-type=card]:gap-3',
          // list
          'data-[view-type=list]:grid data-[view-type=list]:w-full',
          'data-[view-type=list]:grid-cols-1 data-[view-type=list]:gap-1',
          // card
          'data-[view-type=card]:sm:grid-cols-2 data-[view-type=card]:sm:gap-5',
          'data-[view-type=card]:lg:grid-cols-3',
          'data-[view-type=card]:xl:grid-cols-4',
          'data-[view-type=card]:2xl:grid-cols-5',
        ].join(' ')}
        data-view-type={props.viewType}
        tabindex="0"
      >
        {slots.default?.()}
      </div>
    )
  },
})

export default FileList
