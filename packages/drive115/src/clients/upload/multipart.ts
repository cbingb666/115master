function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

/**
 * 构建 multipart/form-data 流式正文
 *
 * 通过 ReadableStream 的 pull() 协议逐块输出，自动处理 backpressure：
 * 下游消费者不读取时 pull() 不被调用，文件流自然暂停。
 *
 * 输出顺序：表单字段 chunks → 文件头 → 文件内容 → 结束边界
 */
export function multipartStream(
  fields: Array<{ name: string, value: string }>,
  fileStream: ReadableStream<Uint8Array>,
  filename: string,
  boundary: string,
): ReadableStream<Uint8Array> {
  const fieldChunks = fields.map(
    f => enc(`--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"\r\n\r\n${f.value}\r\n`),
  )
  const fileHeader = enc(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
  )
  const trailer = enc(`\r\n--${boundary}--\r\n`)

  let fieldIdx = 0
  let sentFileHeader = false
  let sentTrailer = false
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  let fileDone = false

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (fieldIdx < fieldChunks.length) {
        controller.enqueue(fieldChunks[fieldIdx])
        fieldIdx++
        return
      }
      if (!sentFileHeader) {
        controller.enqueue(fileHeader)
        sentFileHeader = true
        return
      }
      if (!fileDone) {
        if (!reader) reader = fileStream.getReader()
        const { done, value } = await reader.read()
        if (done) {
          fileDone = true
        }
        else {
          controller.enqueue(value)
          return
        }
      }
      if (!sentTrailer) {
        controller.enqueue(trailer)
        sentTrailer = true
        return
      }
      controller.close()
    },
    cancel() {
      reader?.cancel()
    },
  })
}

/**
 * 计算 multipart/form-data 正文总字节数
 *
 * 应与 multipartStream() 实际输出的字节数精确匹配，用于设置 Content-Length。
 */
export function multipartBodySize(
  fields: Array<{ name: string, value: string }>,
  fileSize: number,
  filename: string,
  boundary: string,
): number {
  let size = 0
  for (const f of fields) {
    size += enc(`--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"\r\n\r\n${f.value}\r\n`).length
  }
  size += enc(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
  ).length
  size += fileSize
  size += enc(`\r\n--${boundary}--\r\n`).length
  return size
}
