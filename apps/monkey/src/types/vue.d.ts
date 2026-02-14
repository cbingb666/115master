declare module '*.vue' {

  export default component
}

type DefineProps<T> = {
  onClickCapture?: (event: MouseEvent) => void
} & T
