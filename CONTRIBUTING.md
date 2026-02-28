# 贡献指南

感谢你对 SecTool 的关注！欢迎提交 Issue、Pull Request 或参与讨论。

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/nidhogg1024/SecTool.git
cd SecTool

# 安装依赖（需要 pnpm）
pnpm install

# 启动开发服务器
pnpm --filter sectool-core run dev
```

## 提交 Issue

- **Bug 报告**：请使用 Bug Report 模板，附上复现步骤和浏览器/系统信息
- **功能建议**：请使用 Feature Request 模板，描述使用场景和预期效果
- 提交前请先搜索是否已有相同 Issue

## 提交 PR

1. Fork 本仓库并创建分支：`git checkout -b feat/your-feature`
2. 确保代码通过构建：`pnpm --filter sectool-core run build`
3. 提交信息请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：
   - `feat: 新增 XXX 工具`
   - `fix: 修复 XXX 问题`
   - `refactor: 重构 XXX 模块`
   - `docs: 更新文档`
4. 提交 PR 并描述改动内容

## 添加新工具

SecTool 的工具是模块化的，添加新工具的步骤：

1. 在 `packages/sectool-core/src/tools/` 下创建工具目录
2. 创建 Vue 组件和 `i18n/` 多语言文件（至少 `zh_CN.json5` 和 `en.json5`）
3. 在 `packages/sectool-config/src/config.ts` 中注册工具和分类
4. 在 `packages/sectool-core/src/helper/router.ts` 中添加路由

## 代码规范

- 使用 TypeScript，组件使用 Vue 3 Composition API
- 添加中文注释说明非显而易见的逻辑
- 变量和函数使用 camelCase，组件使用 PascalCase
- 提交前确保没有 TypeScript 编译错误

## 多语言

- 所有用户可见文本必须通过 i18n（`$t('key')`）引用
- 至少提供中文（`zh_CN`）和英文（`en`）两种语言

## 行为准则

参与本项目即表示同意遵守 [行为准则](CODE_OF_CONDUCT.md)。
