import { expect, it } from 'vitest'

it('imports the narrow runtime contract without browser globals', async () => {
  expect(Object.keys(await import('@115master/ui')).sort()).toEqual([
    'Button',
    'ContextMenu',
    'Dialog',
    'DialogHost',
    'Header',
    'HeaderEnd',
    'HeaderStart',
    'NavigationStack',
    'OverlayHost',
    'Pill',
    'Progress',
    'Tooltip',
    'Watermark',
    'createDialogService',
    'scrollbar',
    'useDialog',
  ])
})
