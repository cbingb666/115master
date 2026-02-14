type Base<T> = {
  state: boolean
} & T

export type FilesAppChromeDownurl = Base<{
  url: string
  data: string
}>

export type AndroidFilesImglist = Base<unknown>
