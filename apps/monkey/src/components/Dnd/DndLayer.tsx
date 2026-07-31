import { computed, defineComponent } from 'vue'
import { useDnd } from './useDnd'

/** 跟随图锚点：触摸时上抬，避免被手指遮挡（iOS 惯例） */
const TOUCH_LIFT = 64

/**
 * 拖拽跟随图层：渲染 session.ghost() 跟随指针
 * 须挂在 #my-app 内（主题变量继承）
 */
const DndLayer = defineComponent({
  name: 'DndLayer',
  setup: () => {
    const dnd = useDnd()
    const style = computed(() => {
      const s = dnd.session.value
      if (!s)
        return undefined
      const lift = s.pointerType === 'touch' ? TOUCH_LIFT : 0
      return `position:fixed;left:${s.x - s.offset.x}px;top:${s.y - s.offset.y - lift}px;pointer-events:none;z-index:var(--ui-z-dnd)`
    })
    return () => {
      const s = dnd.session.value
      if (!s)
        return null
      return <div style={style.value}>{s.ghost()}</div>
    }
  },
})

export default DndLayer
