import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import { computed, defineComponent } from 'vue'

export type WatermarkContent = string | readonly string[]
export type WatermarkGap = readonly [horizontal: number, vertical: number]
export type WatermarkOffset = readonly [x: number, y: number]

const props = {
  content: {
    type: [String, Array] as PropType<WatermarkContent>,
    required: true,
  },
  color: {
    type: String,
    default: '#64748b',
  },
  opacity: {
    type: Number,
    default: 0.18,
  },
  fontSize: {
    type: Number,
    default: 16,
  },
  fontFamily: {
    type: String,
    default: 'system-ui, sans-serif',
  },
  fontWeight: {
    type: [String, Number] as PropType<string | number>,
    default: 500,
  },
  rotate: {
    type: Number,
    default: -22,
  },
  gap: {
    type: Array as unknown as PropType<WatermarkGap>,
    default: () => [96, 72],
  },
  offset: {
    type: Array as unknown as PropType<WatermarkOffset>,
    default: () => [0, 0],
  },
} as const

export type WatermarkProps = ExtractPublicPropTypes<typeof props>

function finite(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function escape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function measure(value: string, size: number) {
  return Array.from(value).reduce(
    (width, character) => width + size * ((character.codePointAt(0) ?? 0) > 0xFF ? 1 : 0.62),
    0,
  )
}

/**
 * A decorative, repeated text watermark that stays inert above its content.
 * It discourages casual reuse but is not a data-protection boundary.
 */
export const Watermark = defineComponent({
  name: 'Watermark',

  props,

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { slots }) {
    const lines = computed(() => (
      typeof props.content === 'string'
        ? props.content.split('\n')
        : props.content
    ).map(line => line.trim()).filter(Boolean))
    const mark = computed(() => {
      if (lines.value.length === 0)
        return undefined

      const size = Math.max(1, finite(props.fontSize, 16))
      const leading = size * 1.4
      const width = Math.max(...lines.value.map(line => measure(line, size))) + size * 2
      const height = lines.value.length * leading
      const tileWidth = width + Math.max(0, finite(props.gap[0], 96))
      const tileHeight = height + Math.max(0, finite(props.gap[1], 72))
      const center = tileHeight / 2 - (lines.value.length - 1) * leading / 2
      const text = lines.value.map((line, index) => (
        `<text x="${tileWidth / 2}" y="${center + index * leading}">${escape(line)}</text>`
      )).join('')
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileWidth}" height="${tileHeight}" viewBox="0 0 ${tileWidth} ${tileHeight}"><g transform="rotate(${finite(props.rotate, -22)} ${tileWidth / 2} ${tileHeight / 2})" fill="${escape(props.color)}" fill-opacity="${clamp(finite(props.opacity, 0.18), 0, 1)}" font-family="${escape(props.fontFamily)}" font-size="${size}" font-weight="${escape(String(props.fontWeight))}" text-anchor="middle" dominant-baseline="middle">${text}</g></svg>`

      return {
        image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        height: tileHeight,
        width: tileWidth,
      }
    })
    const style = computed(() => mark.value
      ? {
          '--ui-watermark-image': mark.value.image,
          '--ui-watermark-offset-x': `${finite(props.offset[0], 0)}px`,
          '--ui-watermark-offset-y': `${finite(props.offset[1], 0)}px`,
          '--ui-watermark-size': `${mark.value.width}px ${mark.value.height}px`,
        }
      : undefined)

    return () => (
      <div class="ui-watermark" data-ui-watermark="">
        {slots.default?.()}
        {style.value && (
          <div
            class={['ui-watermark__mark', 'ui-z-cover']}
            data-ui-watermark-mark=""
            aria-hidden="true"
            style={style.value}
          />
        )}
      </div>
    )
  },
})
