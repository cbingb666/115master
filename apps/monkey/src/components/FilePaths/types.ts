import type { WebApi } from '@/utils/drive115/api'

export interface HeaderPathsProps {
  path: WebApi.Res.Files['path']
  onPathClick?: (path: WebApi.Res.Files['path'][number]) => void
}
