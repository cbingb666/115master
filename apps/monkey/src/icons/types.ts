import type { I, IconValue } from './registry'

export type IconName = keyof typeof I
export type { IconValue }

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
