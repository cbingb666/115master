import { expect, it } from 'vitest'

it('imports the narrow runtime contract without browser globals', async () => {
  expect(Object.keys(await import('@115master/ui')).sort()).toEqual([
    'Button',
    'ContextMenu',
    'Dialog',
    'DialogHost',
    'NavigationStack',
    'OverlayHost',
    'Pill',
    'Tooltip',
    'Watermark',
    'createDialogService',
    'scrollbar',
    'useDialog',
  ])
})
