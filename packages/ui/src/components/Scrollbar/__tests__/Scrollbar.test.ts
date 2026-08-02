import { describe, expect, it } from 'vitest'
import { scrollbar } from '../Scrollbar'

describe('scrollbar', () => {
  it('defaults to the md size', () => {
    expect(scrollbar()).toEqual(['ui-scrollbar', 'ui-scrollbar-md'])
  })

  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)('maps %s to the public size class', (size) => {
    expect(scrollbar(size)).toEqual(['ui-scrollbar', `ui-scrollbar-${size}`])
  })
})
