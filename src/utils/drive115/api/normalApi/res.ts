type ResBase<T> = {
  state: boolean
  code: number
  errNo: number
  error: string
} & T

export type VideoM3u8 = ResBase<string>

export type FilesDownload = ResBase<{
  file_url: string
}>
