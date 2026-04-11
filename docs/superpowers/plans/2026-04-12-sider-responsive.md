# Sider 响应式优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为移动端添加可访问的 Sider 抽屉导航，通过右下角汉堡按钮触发

**Architecture:** 将现有 Sider 拆分为 DesktopSider 和 MobileSider 两个组件，Sider 主组件根据响应式断点渲染对应版本。MobileSider 包含汉堡按钮和左侧滑出抽屉。

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, @iconify/vue

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `Sider/Links.tsx` | 创建 | 可复用的链接列表组件 |
| `Sider/DesktopSider.tsx` | 创建 | PC 端侧边栏组件 |
| `Sider/MobileSider.tsx` | 创建 | 移动端抽屉组件 |
| `Sider/Sider.tsx` | 修改 | 主组件，响应式渲染 |
| `Sider/index.ts` | 修改 | 导出更新 |

---

## Task 1: 创建 Links 组件

提取链接列表为独立可复用组件。

**Files:**
- Create: `apps/monkey/src/components/Sider/Links.tsx`

- [ ] **Step 1: 创建 Links.tsx 组件**

```tsx
import type { SlotsType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'
import PKG from '@/../package.json'
import { useSponsorDialog } from '@/components/Sponsor/useSponsorDialog'
import { ICON_GITHUB, ICON_QA, ICON_SPONSOR } from '@/icons'

interface ExternalLinkItem {
  icon?: string
  text?: string
  title?: string
  href?: string
  onClick?: () => void
}

const Links = defineComponent({
  name: 'Links',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup(_, { slots }) {
    const openSponsor = useSponsorDialog()

    const links: ExternalLinkItem[] = [
      {
        icon: ICON_GITHUB,
        href: PKG.homepage,
        title: 'GitHub',
      },
      {
        icon: ICON_SPONSOR,
        title: '赞助',
        onClick: openSponsor,
      },
      {
        icon: ICON_QA,
        href: `${PKG.homepage}/discussions/categories/q-a`,
        title: 'Q&A',
      },
      {
        href: `${PKG.homepage}/releases/tag/v${PKG.version}`,
        title: `V${PKG.version} Release Notes`,
        text: `V${PKG.version}`,
      },
    ]

    return () => (
      <div class="flex flex-wrap gap-2">
        {slots.default?.()}
        {links.map(item => item.onClick
          ? (
              <button
                key={item.title}
                class="flex cursor-pointer items-center justify-between text-xs"
                title={item.title}
                onClick={item.onClick}
              >
                {item.icon && <Icon class="text-lg" icon={item.icon} />}
                {item.text && <span class="text-base-content/50">{item.text}</span>}
              </button>
            )
          : (
              <a
                key={item.href}
                class="flex items-baseline-last justify-between text-xs"
                href={item.href}
                target="_blank"
                title={item.title}
              >
                {item.icon && <Icon class="text-lg" icon={item.icon} />}
                {item.text && <span class="text-base-content/50">{item.text}</span>}
              </a>
            ),
        )}
      </div>
    )
  },
})

export default Links
```

- [ ] **Step 2: Commit**

```bash
git add apps/monkey/src/components/Sider/Links.tsx
git commit -m "feat(Sider): add reusable Links component"
```

---

## Task 2: 创建 DesktopSider 组件

将现有 Sider 的 PC 端逻辑抽离到独立组件。

**Files:**
- Create: `apps/monkey/src/components/Sider/DesktopSider.tsx`

- [ ] **Step 1: 创建 DesktopSider.tsx**

```tsx
import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import Links from './Links'

const DesktopSider = defineComponent({
  name: 'DesktopSider',
  slots: Object as SlotsType<{
    default: () => void
    left: () => void
    right: () => void
  }>,
  setup(_, { slots }) => {
    return () => (
      <div
        class="
          border-base-content/5 bg-base-100/30
          fixed
          top-0 bottom-0
          left-0 z-100
          flex
          w-(--sider-width)
          flex-col
          border-r
          px-4
          pb-4
          shadow-2xl
          max-sm:hidden
        "
      >
        {slots.default?.()}
        <Links>
          {slots.left?.()}
        </Links>
      </div>
    )
  },
})

export default DesktopSider
```

- [ ] **Step 2: Commit**

```bash
git add apps/monkey/src/components/Sider/DesktopSider.tsx
git commit -m "feat(Sider): add DesktopSider component"
```

---

## Task 3: 创建 MobileSider 组件

创建移动端汉堡按钮 + 抽屉组件。

**Files:**
- Create: `apps/monkey/src/components/Sider/MobileSider.tsx`

- [ ] **Step 1: 创建 MobileSider.tsx**

```tsx
import type { SlotsType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent, ref } from 'vue'
import Links from './Links'

const MobileSider = defineComponent({
  name: 'MobileSider',
  slots: Object as SlotsType<{
    default: () => void
    left: () => void
    right: () => void
  }>,
  setup(_, { slots }) => {
    const isOpen = ref(false)
    const open = () => isOpen.value = true
    const close = () => isOpen.value = false

    return () => (
      <>
        {/* 汉堡按钮 */}
        <button
          type="button"
          aria-label="打开菜单"
          class="
            sm:hidden
            fixed bottom-4 right-4 z-110
            h-12 w-12
            flex items-center justify-center
            rounded-full
            bg-primary text-primary-content
            shadow-lg
            transition-transform
            hover:scale-105
            active:scale-95
          "
          onClick={open}
        >
          <Icon icon="lucide:menu" class="text-xl" />
        </button>

        {/* 遮罩层 */}
        {isOpen.value && (
          <div
            class="
              sm:hidden
              fixed inset-0 z-120
              bg-black/50
              transition-opacity duration-300
            "
            style={{ opacity: isOpen.value ? 1 : 0 }}
            onClick={close}
          />
        )}

        {/* 抽屉 */}
        <div
          class="
            sm:hidden
            border-base-content/5 bg-base-100/30
            fixed
            top-0 bottom-0
            left-0 z-130
            flex
            w-[70vw]
            flex-col
            border-r
            px-4
            pb-4
            shadow-2xl
            transition-transform duration-300 ease-out
            backdrop-blur-sm
          "
          style={{
            transform: isOpen.value ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          {/* 关闭按钮 */}
          <div class="flex justify-end pt-4 pb-2">
            <button
              type="button"
              aria-label="关闭菜单"
              class="p-2 -mr-2"
              onClick={close}
            >
              <Icon icon="lucide:x" class="text-xl" />
            </button>
          </div>

          {slots.default?.()}
          <Links>
            {slots.left?.()}
          </Links>
        </div>
      </>
    )
  },
})

export default MobileSider
```

- [ ] **Step 2: Commit**

```bash
git add apps/monkey/src/components/Sider/MobileSider.tsx
git commit -m "feat(Sider): add MobileSider component with drawer"
```

---

## Task 4: 重构 Sider 主组件

整合 DesktopSider 和 MobileSider。

**Files:**
- Modify: `apps/monkey/src/components/Sider/Sider.tsx`

- [ ] **Step 1: 重写 Sider.tsx**

```tsx
import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import DesktopSider from './DesktopSider'
import MobileSider from './MobileSider'

const Sider = defineComponent({
  name: 'Sider',
  slots: Object as SlotsType<{
    default: () => void
    left: () => void
    right: () => void
  }>,
  setup(_, { slots }) => {
    return () => (
      <>
        <DesktopSider>
          {{ default: slots.default, left: slots.left }}
        </DesktopSider>
        <MobileSider>
          {{ default: slots.default, left: slots.left }}
        </MobileSider>
      </>
    )
  },
})

export default Sider
```

- [ ] **Step 2: Commit**

```bash
git add apps/monkey/src/components/Sider/Sider.tsx
git commit -m "refactor(Sider): integrate DesktopSider and MobileSider"
```

---

## Task 5: 更新导出文件

确保新组件正确导出。

**Files:**
- Modify: `apps/monkey/src/components/Sider/index.ts`

- [ ] **Step 1: 更新 index.ts**

```ts
export { default as Sider } from './Sider'
export { default as DesktopSider } from './DesktopSider'
export { default as MobileSider } from './MobileSider'
export { default as Links } from './Links'
```

- [ ] **Step 2: Commit**

```bash
git add apps/monkey/src/components/Sider/index.ts
git commit -m "chore(Sider): update exports"
```

---

## Task 6: 类型检查与验证

确保代码无类型错误。

- [ ] **Step 1: 运行类型检查**

```bash
cd /Users/caibinghong/resource/github_my/115master
pnpm type-check
```

Expected: 无类型错误

- [ ] **Step 2: 运行 lint**

```bash
pnpm lint
```

Expected: 无 lint 错误

- [ ] **Step 3: 构建项目**

```bash
pnpm build
```

Expected: 构建成功

- [ ] **Step 4: Commit（如有自动修复）**

```bash
git diff --quiet || (git add -A && git commit -m "style: fix lint errors")
```

---

## 手动测试清单

完成所有任务后，进行以下手动测试：

1. **PC 端测试** (`>=640px`)
   - [ ] 侧边栏正常显示在左侧
   - [ ] 链接可点击，跳转正确
   - [ ] 赞助对话框正常弹出

2. **移动端测试** (`<640px`)
   - [ ] 右下角显示汉堡按钮
   - [ ] 点击汉堡按钮，抽屉从左侧滑出
   - [ ] 遮罩层显示，背景变暗
   - [ ] 点击遮罩层，抽屉关闭
   - [ ] 点击抽屉内 X 按钮，抽屉关闭
   - [ ] 抽屉内链接可点击

3. **响应式切换**
   - [ ] 调整浏览器窗口大小，PC/移动端模式正确切换

---

## 自审查

**1. Spec 覆盖率检查：**
- ✅ 移动端汉堡按钮（右下角）- Task 3
- ✅ 左侧 70% 宽度抽屉 - Task 3
- ✅ 半透明背景 - Task 3
- ✅ 遮罩层点击关闭 - Task 3
- ✅ 过渡动画 300ms - Task 3
- ✅ PC 端保持现有行为 - Task 2

**2. Placeholder 扫描：** 无 TBD/TODO/占位符

**3. 类型一致性：** 所有组件使用相同的 SlotsType 定义
