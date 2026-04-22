import mitt from 'mitt'

// mitt 要求泛型参数兼容 Record<EventType, unknown>，interface 因无隐式索引签名无法满足
// eslint-disable-next-line ts/consistent-type-definitions
type Events = {
  'aria2:open-settings': void
}

export const aria2Events = mitt<Events>()
