import type { WebApi } from '@115master/drive115'

export interface HeaderPathsProps {
  path: WebApi.Res.Files['path']
  onPathClick?: (path: WebApi.Res.Files['path'][number]) => void
}
