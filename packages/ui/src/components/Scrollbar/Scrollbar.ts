export type ScrollbarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<ScrollbarSize, string> = {
  xs: 'ui-scrollbar-xs',
  sm: 'ui-scrollbar-sm',
  md: 'ui-scrollbar-md',
  lg: 'ui-scrollbar-lg',
  xl: 'ui-scrollbar-xl',
}

/**
 * Returns the UI-owned native scrollbar classes for a scroll container.
 * Applying them to a root container also styles scrollable descendants.
 */
export function scrollbar(size: ScrollbarSize = 'md') {
  return ['ui-scrollbar', sizes[size]] as const
}
