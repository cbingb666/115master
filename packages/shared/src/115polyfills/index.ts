declare global {
  interface Window {
    /** 115 网站保存的原始 Number 构造函数 */
    OOF_NUMBER?: NumberConstructor
  }
}

if (window.OOF_NUMBER) {
  for (const key of Object.getOwnPropertyNames(window.OOF_NUMBER)) {
    if (!(key in Number)) {
      Object.defineProperty(Number, key, Object.getOwnPropertyDescriptor(window.OOF_NUMBER, key)!)
    }
  }
}
