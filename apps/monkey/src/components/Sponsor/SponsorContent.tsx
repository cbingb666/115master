import { Icon } from '@iconify/vue'
import { ICON_SPONSOR } from '@/icons'

export default function SponsorContent() {
  return (
    <div class="flex flex-col items-center gap-4 pt-6">
      <Icon icon={ICON_SPONSOR} class="pt-2 pb-4 text-7xl"></Icon>
      <div class="text-base-content/80 text-md space-y-4 px-4 leading-relaxed">
        <p class="font-bold">"115Master 始于作者的痛点、好奇心和对完美的执着。"</p>
        <p>去年持续不断在打磨播放器，如今已趋近成熟，缩略图丝般顺滑指哪打哪，绝大部分视频播放告别了黑屏和卡顿。</p>
        <p>如今是时候可以向新的板块迈进，补齐文件浏览这块短板。</p>
        <p>
          这个新的方向需要更多的时间和精力投入，而你的每一份赞助都是我前行的动力，让
          <span class="font-bold">115Master</span>
          {' '}
          永存！
        </p>
      </div>
    </div>
  )
}
