/**
 * 将 SRT 格式转换为 VTT 格式
 */
export function srtToVtt(srt: string): string {
  let vtt = 'WEBVTT\n\n'

  const blocks = srt.split(/\n\s*\n/)

  blocks.forEach((block) => {
    if (!block.trim())
      return

    const lines = block.trim().split('\n')
    if (lines.length < 2)
      return

    // 部分 SRT 不带序号，需遍历查找时间码行
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

    // 找不到时间码则是空块或格式损坏，跳过
    if (
      timeCodeIndex === 0
      && !lines[0].match(
        /^\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}$/,
      )
    ) {
      return
    }

    const vttTimecode = lines[timeCodeIndex].replace(/,/g, '.')
    const text = lines.slice(timeCodeIndex + 1).join('\n')

    if (text.trim()) {
      vtt += `${vttTimecode}\n${text}\n\n`
    }
  })

  return vtt
}
