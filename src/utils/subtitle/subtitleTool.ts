/**
 * 将srt格式转换为vtt格式
 * @param srt srt格式的字幕内容
 */
export function convertSrtToVtt(srt: string): string {
  let vtt = 'WEBVTT\n\n'

  /** 按空行分割字幕块 */
  const blocks = srt.split(/\n\s*\n/)

  blocks.forEach((block) => {
    if (!block.trim())
      return

    /** 分割每个字幕块的行 */
    const lines = block.trim().split('\n')
    if (lines.length < 2)
      return

    /** 跳过序号行 */
    let timeCodeIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].match(
          /^\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}$/,
        )
      ) {
        timeCodeIndex = i
        break
      }
    }

    if (
      timeCodeIndex === 0
      && !lines[0].match(
        /^\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}$/,
      )
    ) {
      timeCodeIndex = 1
    }

    if (timeCodeIndex >= lines.length)
      return

    /** 将时间码中的逗号替换为小数点 */
    const vttTimecode = lines[timeCodeIndex].replace(/,/g, '.')
    const text = lines.slice(timeCodeIndex + 1).join('\n')

    if (text.trim()) {
      vtt += `${vttTimecode}\n${text}\n\n`
    }
  })

  return vtt
}

/**
 * 将vtt格式转换为blob url
 * @param vtt vtt格式的字幕内容
 */
export function vttToBlobUrl(vtt: string): string {
  const blob = new Blob([vtt], { type: 'text/vtt; charset=utf-8' })
  return URL.createObjectURL(blob)
}
