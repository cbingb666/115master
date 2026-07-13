import { useCloudDownloadAction } from './useCloudDownloadAction'
import { useDeleteAction } from './useDeleteAction'
import { useFileAction } from './useFileAction'
import { useMoveAction } from './useMoveAction'
import { useTagAction } from './useTagAction'

/** 操作 */
export function useDriveAction() {
  const { topBatch, starBatch, renameItem, newFolder } = useFileAction()
  const { moveBatch, dragMove, improve } = useMoveAction()
  const { deleteBatch } = useDeleteAction()
  const { cloudDownload } = useCloudDownloadAction()
  const { tagBatch } = useTagAction()

  return {
    topBatch,
    starBatch,
    moveBatch,
    dragMove,
    improve,
    deleteBatch,
    renameItem,
    newFolder,
    cloudDownload,
    tagBatch,
  }
}
