# 贡献指南

感谢你对 115Master 的关注！欢迎提交 Issue 和 Pull Request。

## 环境要求

| 要求         | 版本                          | 说明                 |
| ------------ | ----------------------------- | -------------------- |
| Node.js      | >= 20.12                      | 运行时环境           |
| pnpm         | >= 9.15.9                     | 包管理器（强制使用） |
| Tampermonkey | >= 5.3.3                      | 用户脚本管理器       |
| Browser      | Chrome 130+ 或 115Browser 35+ | 目标浏览器           |

## 快速开始

```bash
# 安装依赖（必须使用 pnpm）
pnpm install

# 启动开发环境（热重载）
pnpm dev

# 构建
pnpm build
```

## 常用命令

```bash
pnpm type-check       # TypeScript 类型检查
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm test             # 运行测试
pnpm test:coverage    # 测试覆盖率报告
pnpm analyze          # 构建分析
```

## 测试

```bash
pnpm test          # 运行所有测试
pnpm test:watch    # 监听模式运行测试
pnpm test:coverage # 运行测试并生成覆盖率报告
```

覆盖率使用 `v8` provider，输出 `text` 和 `html` 两种报告格式。运行 `pnpm test:coverage` 后，各包的覆盖率报告会生成在对应包的 `coverage/` 目录下。提交 PR 前建议先运行覆盖率检查，确保核心逻辑有测试覆盖。

## 版本管理

本项目使用 [Changesets](https://github.com/changesets/changesets) 管理版本和 CHANGELOG。

### 工作流

1. 开发完功能或修复后，运行：

   ```bash
   pnpm changeset
   ```

2. 按提示选择受影响的包（`@115master/monkey`、`@115master/shared`）

3. 选择版本类型：
   - `patch` — Bug 修复
   - `minor` — 新功能
   - `major` — 破坏性变更

4. 填写变更描述，会在 `.changeset/` 下生成一个 markdown 文件

5. **将生成的 changeset 文件与代码一起提交**

> **Note**: `pnpm version-packages`（消费 changesets、更新版本号和 CHANGELOG）已由 [Release workflow](.github/workflows/release.yml) 自动处理，无需手动运行。

## 提交 Pull Request

1. Fork 本仓库并创建分支
2. 完成开发和测试
3. 运行 `pnpm changeset` 添加变更记录
4. 确保 `pnpm type-check`、`pnpm lint` 和 `pnpm test` 通过
5. 建议运行 `pnpm test:coverage` 检查测试覆盖情况
6. 提交 PR
