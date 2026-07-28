import type Icon from '../icon'
import type { IconValue } from '../types'

type Equal<Left, Right> = (
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false
)

type Assert<Value extends true> = Value
type Name = NonNullable<InstanceType<typeof Icon>['$props']['name']>

export type IconNameContract = Assert<Equal<Name, IconValue>>
