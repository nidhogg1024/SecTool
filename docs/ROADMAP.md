# SecTool 开发路线图

## Phase 1：MVP（最小可行产品）

目标：快速上线，验证市场需求。覆盖安全从业者最高频的日常操作。

### 1.1 反弹 Shell 生成器 ⭐ 优先级最高

**参考**：HackTools 的 Reverse Shell 模块

**功能清单**：
- [ ] IP 地址 + 端口输入框，全局联动
- [ ] 支持语言/工具：
  - Bash (`bash -i`, `/dev/tcp`)
  - Python (2/3 分别生成)
  - PHP (`exec`, `shell_exec`, `system`, `passthru`)
  - Ruby
  - Perl
  - Netcat (`nc -e`, `nc mkfifo`, `ncat`)
  - PowerShell (多种变体)
  - Java
  - Groovy
  - Lua
  - Golang（编译型，生成源码）
- [ ] 每个 Shell 支持多种变体（原始/Base64 编码/URL 编码）
- [ ] 一键复制按钮
- [ ] 同步生成监听端命令（`nc -lvnp PORT`、`rlwrap`、`socat`）
- [ ] Shell 升级提示（TTY Spawn：`python -c 'import pty;pty.spawn("/bin/bash")'` 等）

**数据结构设计**：
```typescript
interface ReverseShell {
  id: string
  name: string           // 如 "Bash -i"
  language: string       // 如 "bash"
  template: string       // 模板，含 {{LHOST}} {{LPORT}} 占位符
  variants?: {           // 编码变体
    base64?: boolean
    urlEncode?: boolean
  }
  platform: 'linux' | 'windows' | 'both'
  description?: string
}
```

### 1.2 XSS Payload 库

**参考**：PayloadsAllTheThings XSS 章节、PortSwigger XSS Cheat Sheet

**功能清单**：
- [ ] 按注入上下文分类：
  - HTML 标签间
  - HTML 属性值内（引号内/事件属性）
  - JavaScript 代码内（字符串/模板字符串）
  - URL 参数（`javascript:` 协议）
  - CSS 内
- [ ] 按目的分类：
  - 弹窗验证（`alert`/`prompt`/`confirm`）
  - Cookie 窃取
  - 键盘记录
  - 页面重定向
  - DOM 操作
- [ ] 支持过滤条件：
  - 标签黑名单（如 `<script>` 被过滤时，自动推荐 `<img>`, `<svg>` 等替代）
  - 事件黑名单
  - 关键字黑名单
- [ ] 每条 Payload 显示适用场景说明

### 1.3 SQL 注入速查

**参考**：PayloadsAllTheThings SQL Injection 章节

**功能清单**：
- [ ] 按数据库类型分类：
  - MySQL
  - PostgreSQL
  - MSSQL
  - Oracle
  - SQLite
- [ ] 按注入类型分类：
  - 联合查询注入（UNION）
  - 布尔盲注
  - 时间盲注
  - 报错注入
  - 堆叠查询
  - 带外通道（OOB）
- [ ] 常用操作速查：
  - 版本探测
  - 当前用户/数据库
  - 列举数据库/表/列
  - 读文件/写文件
  - 命令执行（`xp_cmdshell`, `INTO OUTFILE` 等）
- [ ] 注释符速查（`--`, `#`, `/**/`, `%00`）
- [ ] WAF 绕过变体（内联注释、大小写、编码）

### 1.4 编解码链

**参考**：CyberChef 管道概念（简化版）

**功能清单**：
- [ ] 支持的编解码操作：
  - URL 编码/解码（单层/双层/全字符）
  - Base64 编码/解码
  - HTML 实体编码/解码
  - Hex 编码/解码
  - Unicode 编码/解码（`\uXXXX` / `&#xXXXX;`）
  - UTF-7 编码
  - Gzip 压缩/解压
  - 八进制编码
- [ ] 管道式串联：用户可自由添加/删除/排序操作步骤
- [ ] 实时预览：输入变化时自动执行整条链
- [ ] 常用组合预设：
  - 双重 URL 编码
  - Base64 + URL 编码
  - Unicode 转义 + HTML 实体
- [ ] Recipe 保存/加载

### 1.5 哈希/加密工具

**可直接从 Ctool 复用**，额外增加：
- [ ] 哈希类型自动识别（根据长度和字符集推测可能的哈希类型）
- [ ] NTLM / LM 哈希生成
- [ ] 常见 Web 框架密码哈希格式（WordPress、Django、Laravel 等）
- [ ] 哈希对比工具

---

## Phase 2：差异化功能

目标：建立与 HackTools / CyberChef 的差异化竞争力。

### 2.1 WAF 绕过模式

**功能清单**：
- [ ] 输入原始 Payload → 自动输出多种绕过变体
- [ ] 绕过技术库：
  - 大小写混淆（`SeLeCt`）
  - 内联注释（`SEL/**/ECT`）
  - URL 编码（单层/双层/选择性）
  - Unicode 替代字符
  - 空白字符替代（`%09`, `%0a`, `%0d`, `/**/`）
  - 垃圾数据填充（超长参数绕过长度限制）
  - HPP（HTTP 参数污染）
  - 分块传输编码
- [ ] 可配置的 WAF 规则模拟（用户定义哪些关键字/模式被拦截）

### 2.2 更多 Payload 类型

#### LFI / 路径遍历
- [ ] 自动生成 `../` 嵌套路径（深度可调）
- [ ] Linux / Windows 常见敏感文件列表
- [ ] 编码绕过变体（URL 编码、双重编码、UTF-8 overlong）
- [ ] PHP Wrapper（`php://filter`, `php://input`, `data://`）
- [ ] 空字节截断（`%00`）

#### SSRF
- [ ] 内网 IP 段扫描模板（`127.0.0.1`, `10.x`, `172.16-31.x`, `192.168.x`）
- [ ] 协议利用（`file://`, `gopher://`, `dict://`）
- [ ] 重定向绕过
- [ ] DNS 重绑定
- [ ] IPv6 地址变体

#### XXE
- [ ] 基础文件读取
- [ ] SSRF via XXE
- [ ] OOB 外带（Blind XXE）
- [ ] 参数实体利用
- [ ] 不同解析器的差异

#### SSTI
- [ ] 按模板引擎分类：Jinja2 / Twig / Freemarker / Velocity / Mako / Smarty
- [ ] 探测语法（`{{7*7}}` / `${7*7}` / `<%= 7*7 %>`）
- [ ] RCE Payload
- [ ] 沙箱逃逸

#### 命令注入
- [ ] 分隔符变体（`;`, `|`, `||`, `&&`, `\n`, `\r\n`, `` ` ``）
- [ ] 空格绕过（`${IFS}`, `$IFS$9`, `%09`, `{cmd,arg}`）
- [ ] 关键字绕过（通配符 `?`, `*`, `''`, `""`, `\`, `$@`）
- [ ] 时间盲注（`sleep`, `ping -c`）

### 2.3 JWT 攻击工具

**在 Ctool JWT 解码基础上增强**：
- [ ] 解码（Header / Payload / Signature 分栏展示）
- [ ] 修改 Payload 并重签
- [ ] None 算法攻击
- [ ] 密钥爆破（常见弱密钥字典）
- [ ] RS256 → HS256 算法混淆攻击
- [ ] JKU/X5U 注入提示

### 2.4 反序列化工具

- [ ] Java 反序列化数据分析（识别 `aced0005` 魔数）
- [ ] PHP 序列化/反序列化格式转换
- [ ] Python Pickle 数据分析
- [ ] 常见 Gadget Chain 参考

---

## Phase 3：生态与体验

目标：提升用户粘性和社区价值。

### 3.1 全局变量系统

- [ ] 预定义变量：`LHOST`, `LPORT`, `RHOST`, `RPORT`, `TARGET`, `DOMAIN`, `USERNAME`, `PASSWORD`
- [ ] 所有工具中的占位符自动替换
- [ ] 变量配置持久化（localStorage）
- [ ] 支持多套变量配置切换（多目标场景）

### 3.2 收藏与自定义

- [ ] 用户可收藏任意 Payload
- [ ] 用户可添加自定义 Payload
- [ ] 收藏夹分组管理
- [ ] 导出/导入收藏数据

### 3.3 编解码 Recipe

- [ ] 保存编解码操作链为 Recipe
- [ ] 内置常用 Recipe 模板
- [ ] Recipe 分享（URL hash 编码）

### 3.4 命令速查手册

- [ ] Nmap 常用参数速查
- [ ] Metasploit 常用模块速查
- [ ] SQLMap 参数速查
- [ ] ffuf / gobuster / dirsearch 参数速查
- [ ] Hydra / Medusa 暴力破解命令
- [ ] Burp Suite 插件推荐
- [ ] Linux 提权检查清单（SUID/SUDO/Capabilities/Cron/可写文件）
- [ ] Windows 提权检查清单
- [ ] 端口转发命令（SSH/Chisel/Socat/Netsh）

### 3.5 端口与服务对照表

- [ ] 常见端口 → 服务映射
- [ ] 服务 → 默认弱口令
- [ ] 服务 → 常见漏洞提示

---

## 里程碑时间线（参考）

| 里程碑 | 目标 | 预期交付 |
|--------|------|---------|
| M1 - 项目骨架 | Fork Ctool 架构，搭建工具注册机制，跑通多平台构建 | - |
| M2 - MVP Alpha | 反弹 Shell + XSS + SQLi + 编解码链 + 哈希 | - |
| M3 - MVP Beta | 修复 Bug，优化 UI/UX，首次发布 uTools | - |
| M4 - Phase 2 | WAF 绕过 + LFI/SSRF/XXE/SSTI/命令注入 + JWT | - |
| M5 - Phase 3 | 全局变量 + 收藏 + Recipe + 命令速查 | - |

> 时间线暂不填写具体日期，根据实际开发进度调整。
