# Sider 响应式设计优化

## 背景

当前 Sider 组件在移动端（<640px）完全隐藏 (`max-sm:hidden`)，导致移动用户无法访问 Sider 中的导航链接（GitHub、赞助、Q&A 等）。

## 目标

为移动端提供可访问的 Sider 替代方案，保持与 PC 版一致的用户体验。

## 设计方案

### 整体架构

```
Sider/
├── Sider.tsx          # 主组件：负责响应式判断，渲染对应版本
├── MobileSider.tsx    # 移动端组件：汉堡按钮 + 抽屉
├── DesktopSider.tsx   # PC端组件：现有 Sider 逻辑抽离
└── index.ts           # 统一导出
```

### PC 端（DesktopSider）

保持现有实现不变：
- 固定在左侧
- 宽度由 CSS 变量 `--sider-width` 控制（`calc(var(--spacing)*60)` ≈ 240px）
- 半透明背景 `bg-base-100/30`
- 右侧边框分隔

### 移动端（MobileSider）

#### 汉堡按钮
- 位置：右下角固定（`fixed bottom-4 right-4`）
- 样式：圆形按钮，带阴影（`rounded-full shadow-lg`）
- 图标：菜单图标（三条横线）

#### 抽屉面板
- 位置：从左侧滑出
- 宽度：屏幕宽度的 70%
- 背景：与 PC 版一致（半透明 `bg-base-100/30`）
- 内容：复用 PC 版 Sider 的链接列表

#### 遮罩层
- 颜色：黑色半透明（`bg-black/50`）
- 点击：关闭抽屉

#### 动画效果
- 抽屉滑入：从 `translateX(-100%)` 到 `translateX(0)`
- 遮罩淡入：透明度从 0 到 1
- 时长：300ms
- 缓动函数：`cubic-bezier(0.4, 0, 0.2, 1)`（ease-out）

### 状态管理

使用 Vue `ref` 管理抽屉开关状态：

```ts
const isOpen = ref(false)
const open = () => isOpen.value = true
const close = () => isOpen.value = false
const toggle = () => isOpen.value = !isOpen.value
```

### 响应式断点

保持与现有代码一致：`sm:` 前缀（640px）
- `< sm`：显示 MobileSider
- `>= sm`：显示 DesktopSider

## 接口定义

### Sider Props

```ts
interface SiderProps {
  // 当前无 props，保持与现有接口一致
}
```

### Sider Slots

```ts
interface SiderSlots {
  default: () => void   // 主内容区域
  left: () => void      // 左侧额外内容
  right: () => void     // 右侧额外内容
}
```

## 样式规范

### Tailwind 类名

- 使用 Tailwind CSS 工具类
- 遵循项目中现有的样式约定
- 颜色使用 daisyUI 主题变量（如 `bg-base-100`）

### CSS 变量

复用现有变量：
- `--sider-width`：Sider 宽度

## 无障碍考虑

- 汉堡按钮添加 `aria-label="打开菜单"`
- 抽屉打开时，焦点应转移到抽屉内第一个可交互元素
- 抽屉关闭时，焦点返回到汉堡按钮

## 测试要点

1. 在移动端视窗（<640px）验证汉堡按钮显示
2. 点击汉堡按钮，验证抽屉滑出、遮罩层显示
3. 点击遮罩层，验证抽屉关闭
4. 在 PC 端视窗（>=640px）验证侧边栏正常显示
5. 验证链接点击功能正常

## 依赖

无新增依赖。使用现有技术栈：
- Vue 3
- Tailwind CSS
- @iconify/vue（图标）
