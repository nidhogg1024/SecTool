# SecTool - 安全从业者的交互式工具箱

> 面向红队、渗透测试、Bug Bounty 的多平台安全工具集。把 PayloadsAllTheThings 的数据 + HackTools 的交互体验 + CyberChef 的编解码能力整合到一个工具中。

## 项目定位

安全从业者日常工作中需要频繁查阅 Payload、生成反弹 Shell、做多层编解码——现有工具要么是纯文档（PayloadsAllTheThings）、要么交互性有限（HackTools）、要么不面向安全场景（CyberChef）。

SecTool 的目标是**一站式解决安全从业者的日常工具需求**，同时支持 uTools / 浏览器扩展 / 桌面端 / Web 多平台。

## 核心功能

### 🔫 Payload 库（交互式）

- **XSS Payload** — 按上下文分类（HTML标签/属性/JS/URL），支持 WAF 绕过变体自动生成
- **SQL 注入** — 按数据库分类（MySQL/MSSQL/PostgreSQL/Oracle/SQLite），联合查询/盲注/报错注入
- **命令注入** — 分隔符变体、空格绕过、关键字绕过
- **LFI/路径遍历** — Linux/Windows 路径自动生成，编码绕过
- **SSRF** — 内网探测、协议绕过、重定向绕过
- **XXE** — 文件读取、SSRF、OOB 外带
- **SSTI** — 按模板引擎分类（Jinja2/Twig/Freemarker/Velocity）

### 🐚 反弹 Shell 生成器

- 支持 Bash / Python / PHP / Ruby / Perl / Netcat / PowerShell / Java / Groovy
- IP + 端口参数化输入，一键复制
- 自动 URL 编码 / Base64 编码变体
- 监听端提示命令同步生成

### 🔐 编解码链（管道式）

- 多层编解码串联：URL → Base64 → Hex → HTML Entity → Unicode
- 安全场景常用组合一键调用（如：双重 URL 编码、UTF-8 绕过）
- 可保存/分享编解码 Recipe

### 🔑 加密/哈希

- 哈希生成与识别（MD5/SHA1/SHA256/SHA512/SM3/NTLM/LM）
- 常见加密算法（AES/DES/RC4/SM4）
- Bcrypt / Scrypt 生成与验证
- JWT 解码 + 修改 + 重签（None 算法、密钥爆破）

### 🛡️ WAF 绕过模式

- 同一 Payload 自动生成多种绕过变体
- 技巧库：大小写混淆、注释插入、编码变换、Unicode 替代、垃圾数据填充
- 支持自定义 WAF 规则配置

### 📋 命令速查

- Nmap / Metasploit / Burp / ffuf / gobuster / SQLMap / Hydra
- 常用 Linux 提权命令（SUID/SUDO/Capabilities）
- Windows 提权 / 横向移动命令
- 端口转发 / 隧道搭建

### 🔧 辅助工具

- 全局变量模板（LHOST / LPORT / RHOST / TARGET / DOMAIN）
- 哈希类型自动识别
- IP 网络计算器 / 子网划分
- 常见端口与服务对照表
- HTTP 状态码速查

## 技术架构

基于 [Ctool](https://github.com/nidhogg1024/Ctool) 架构 fork 改造：

- **前端框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **项目结构**：pnpm monorepo
- **多平台适配**：uTools / Chrome / Edge / Firefox / Tauri / Web

详见 [架构设计文档](docs/ARCHITECTURE.md)。

## 与同类项目的对比

| 能力 | SecTool | HackTools | CyberChef | PayloadsAllTheThings |
|------|---------|-----------|-----------|---------------------|
| 交互式 Payload | ✅ 参数化 | ✅ 基础 | ❌ | ❌ 纯文档 |
| 编解码链 | ✅ 管道式 | ❌ 单层 | ✅ 强大 | ❌ |
| 反弹 Shell 生成 | ✅ 多语言 | ✅ 多语言 | ❌ | ❌ |
| WAF 绕过 | ✅ 自动变体 | ❌ | ❌ | ✅ 文档 |
| 多平台 | ✅ 6平台 | ⚠️ 转型中 | ✅ Web | ✅ Web |
| 离线使用 | ✅ | ✅ | ✅ | ❌ |
| uTools 支持 | ✅ | ❌ | ❌ | ❌ |
| 全局变量 | ✅ | ❌ | ❌ | ❌ |

详见 [竞品分析文档](docs/COMPETITORS.md)。

## 开发计划

- **Phase 1（MVP）**：反弹 Shell 生成器 + XSS/SQLi Payload 库 + 编解码链 + 哈希工具
- **Phase 2（差异化）**：WAF 绕过模式 + LFI/SSRF/XXE/SSTI + 命令注入 + JWT 伪造
- **Phase 3（生态）**：全局变量 + 自定义收藏 + Recipe 分享 + 命令速查手册

详见 [开发路线图](docs/ROADMAP.md)。

## 免责声明

本项目仅用于合法授权的安全测试与学习研究。使用者需遵守当地法律法规，**严禁用于未授权的攻击行为**。因使用本工具产生的任何法律责任由使用者自行承担。

## 许可证

[MIT](LICENSE)
