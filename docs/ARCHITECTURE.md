# SecTool 架构设计

## 概述

SecTool 基于 [Ctool](https://github.com/nidhogg1024/Ctool) 的 monorepo 架构 fork 改造。保留其多平台适配能力和工程化基建，将通用开发工具替换为安全工具。

## 项目结构

```
SecTool/
├── packages/
│   ├── sectool-config/          # 工具配置（分类、注册、元数据）
│   ├── sectool-core/            # 核心功能（Vue 应用 + 所有工具实现）
│   │   └── src/
│   │       ├── tools/           # 各工具组件
│   │       │   ├── reverseShell/    # 反弹 Shell 生成器
│   │       │   ├── xss/            # XSS Payload 库
│   │       │   ├── sqli/           # SQL 注入速查
│   │       │   ├── encodeChain/    # 编解码链
│   │       │   ├── hash/           # 哈希/加密
│   │       │   ├── wafBypass/      # WAF 绕过
│   │       │   ├── lfi/            # LFI/路径遍历
│   │       │   ├── ssrf/           # SSRF
│   │       │   ├── xxe/            # XXE
│   │       │   ├── ssti/           # SSTI
│   │       │   ├── cmdInjection/   # 命令注入
│   │       │   ├── jwt/            # JWT 攻击
│   │       │   ├── deserialize/    # 反序列化
│   │       │   └── cheatsheet/     # 命令速查
│   │       ├── data/            # Payload 数据文件
│   │       ├── components/      # 通用 UI 组件
│   │       └── utils/           # 工具函数
│   ├── sectool-site/            # GitHub Pages 站点
│   └── sectool-adapter/         # 平台适配器
│       ├── base/                    # 适配器基类
│       ├── chrome/                  # Chrome 扩展
│       ├── edge/                    # Edge 扩展
│       ├── firefox/                 # Firefox 扩展
│       ├── utools/                  # uTools 插件
│       ├── tauri/                   # 桌面应用
│       └── web/                     # Web 版
├── docs/                        # 项目文档
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 技术选型

| 类别 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3 + Composition API | 与 Ctool 一致 |
| 类型系统 | TypeScript | 与 Ctool 一致 |
| 构建工具 | Vite | 与 Ctool 一致 |
| 包管理 | pnpm workspace | monorepo 管理 |
| 桌面端 | Tauri | 跨平台桌面应用 |
| 代码规范 | ESLint + Prettier | 与 Ctool 一致 |

## 核心设计

### 工具注册机制

沿用 Ctool 的 `ctool-config` 设计思路。每个工具通过配置文件注册到全局：

```typescript
// sectool-config 中定义工具元数据
interface ToolDefinition {
  name: string                    // 工具标识
  label: Record<string, string>   // 多语言名称 { zh: "反弹 Shell", en: "Reverse Shell" }
  category: ToolCategory          // 所属分类
  icon: string                    // 图标
  component: () => Promise<any>   // 懒加载组件
  keywords: string[]              // 搜索关键词
}

// 工具分类
type ToolCategory =
  | 'payload'       // Payload 库（XSS/SQLi/CMDi/LFI/SSRF/XXE/SSTI）
  | 'shell'         // Shell 工具（反弹 Shell/Shell 升级）
  | 'encode'        // 编解码（编解码链/Base64/URL/Hex/Unicode）
  | 'crypto'        // 加密/哈希
  | 'attack'        // 攻击工具（JWT/反序列化/WAF 绕过）
  | 'cheatsheet'    // 速查手册
  | 'utility'       // 辅助工具
```

### Payload 数据层设计

Payload 数据与 UI 组件分离，便于独立更新和社区贡献：

```typescript
// 通用 Payload 数据结构
interface PayloadEntry {
  id: string
  name: string
  description: Record<string, string>  // 多语言描述
  payload: string                       // Payload 模板（支持占位符）
  context?: string                      // 适用上下文
  tags: string[]                        // 标签（用于搜索和过滤）
  references?: string[]                 // 参考链接
  wafBypass?: boolean                   // 是否为 WAF 绕过变体
  platform?: 'linux' | 'windows' | 'both'
}

// Payload 集合
interface PayloadCollection {
  category: string                      // 如 "xss", "sqli"
  subcategory: string                   // 如 "union_based", "blind"
  entries: PayloadEntry[]
}
```

数据文件按类型组织在 `sectool-core/src/data/` 目录下：

```
data/
├── xss/
│   ├── basic.ts          # 基础 XSS Payload
│   ├── waf-bypass.ts     # WAF 绕过变体
│   ├── dom.ts            # DOM XSS
│   └── blind.ts          # Blind XSS
├── sqli/
│   ├── mysql.ts
│   ├── mssql.ts
│   ├── postgresql.ts
│   ├── oracle.ts
│   └── sqlite.ts
├── reverse-shell/
│   └── shells.ts         # 所有反弹 Shell 模板
├── lfi/
├── ssrf/
├── xxe/
├── ssti/
├── cmd-injection/
└── cheatsheet/
    ├── nmap.ts
    ├── metasploit.ts
    └── ...
```

### 编解码链（管道）设计

```typescript
// 编解码操作定义
interface EncoderOperation {
  id: string
  name: string
  type: 'encode' | 'decode'
  fn: (input: string, options?: Record<string, any>) => string
  options?: OptionDefinition[]        // 可配置项
}

// 编解码链（Recipe）
interface EncoderRecipe {
  name: string
  steps: Array<{
    operationId: string
    options?: Record<string, any>
  }>
}

// 内置 Recipe 示例
const doubleUrlEncode: EncoderRecipe = {
  name: "双重 URL 编码",
  steps: [
    { operationId: "url-encode", options: { encodeAll: true } },
    { operationId: "url-encode", options: { encodeAll: true } }
  ]
}
```

### 全局变量系统

```typescript
// 全局变量管理
interface GlobalVariables {
  LHOST: string       // 攻击者 IP
  LPORT: string       // 攻击者端口
  RHOST: string       // 目标 IP
  RPORT: string       // 目标端口
  TARGET: string      // 目标域名/URL
  DOMAIN: string      // 域名
  USERNAME: string    // 用户名
  PASSWORD: string    // 密码
  [key: string]: string  // 自定义变量
}

// 在所有 Payload 模板中使用 {{VARIABLE}} 占位符
// 运行时通过全局替换引擎统一替换
function renderPayload(template: string, vars: GlobalVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`)
}
```

## 从 Ctool Fork 的改造要点

### 保留
- monorepo 结构和 pnpm workspace 配置
- 多平台适配器架构（utools / chrome / edge / firefox / tauri / web）
- 构建脚本和 CI/CD 流程（GitHub Actions）
- UI 基础组件（输入框、复制按钮、标签页等）
- 国际化框架（i18n）
- 主题切换（亮色/暗色）

### 移除
- 所有通用开发工具组件（JSON、时间戳、正则等）
- ctool-config 中的旧工具注册
- ctool-site 相关的宣传页面内容

### 新增
- Payload 数据层
- 编解码链引擎
- 全局变量系统
- WAF 绕过变体生成引擎
- 安全工具分类体系

## 平台适配注意事项

### uTools
- 关键词搜索映射：每个工具注册对应的 uTools feature 关键词
- 离线可用：所有 Payload 数据内置，无需网络
- 包体大小控制：Payload 数据按需加载（dynamic import）

### 浏览器扩展
- Content Security Policy 限制：不使用 `eval` 或内联脚本
- 弹出窗口尺寸限制：考虑 popup 和 devtools panel 两种模式
- 审核合规：Chrome Web Store 可能对安全工具有额外审核要求

### Tauri 桌面端
- 可以放宽限制，支持文件读写
- 考虑支持本地字典文件导入（如 JWT 密钥爆破字典）

### Web
- 全客户端处理，无服务端组件
- 支持 PWA 离线使用
