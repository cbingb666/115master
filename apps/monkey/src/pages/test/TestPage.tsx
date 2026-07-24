import { defineComponent, ref } from 'vue'
import { UploadTest } from '@/components'
import Button from '@/components/Button/Button'
import { I, Icon } from '@/icons'

type TestItem = 'upload'

export default defineComponent({
  name: 'TestPage',
  setup: () => {
    const active = ref<TestItem | null>(null)

    const tests: { key: TestItem, label: string, icon: typeof I[keyof typeof I], desc: string }[] = [
      { key: 'upload' as TestItem, label: '文件上传', icon: I.FILE_UPLOAD, desc: '测试 OSS 简单上传流程' },
    ]

    return () => (
      <div class="flex h-full flex-col">
        <div class="flex items-center gap-3 px-8 py-6">
          <Icon name={I.FLASK} class="text-primary text-3xl" />
          <div>
            <h1 class="text-2xl font-bold">测试实验室</h1>
            <p class="text-base-content/60 text-sm">开发调试 & 功能验证</p>
          </div>
        </div>

        <div class="bg-base-content/5 mx-8 h-px" />

        {active.value
          ? (
              <div class="p-8">
                <Button variant="ghost" size="sm" class="mb-6" onClick={() => active.value = null}>
                  <Icon name={I.LEFT} class="text-lg" />
                  返回列表
                </Button>
                {active.value === 'upload' && <UploadTest cid="0" onClose={() => {}} />}
              </div>
            )
          : (
              <div class="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-3">
                {tests.map(t => (
                  <div
                    key={t.key}
                    class="bg-base-200/50 hover:bg-base-200 cursor-pointer rounded-xl p-6 transition-colors"
                    onClick={() => active.value = t.key}
                  >
                    <Icon name={t.icon} class="text-primary mb-3 text-3xl" />
                    <div class="font-medium">{t.label}</div>
                    <div class="text-base-content/60 mt-1 text-sm">{t.desc}</div>
                  </div>
                ))}
              </div>
            )}
      </div>
    )
  },
})
