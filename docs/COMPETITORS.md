# 竞品分析

## 1. CyberChef

- **地址**：https://github.com/gchq/CyberChef
- **Stars**：31,000+
- **开发者**：GCHQ（英国政府通信总部）
- **协议**：Apache 2.0
- **技术栈**：JavaScript（非框架），Webpack

### 核心优势
- 操作种类极多（数百种编解码/加密/数据处理操作）
- 管道式操作链（Recipe），可串联任意操作
- 纯客户端处理，支持离线
- 活跃开发维护，社区庞大

### 不足
- **UI 复杂**，学习门槛高，拖拽操作面板不够直观
- **不面向安全攻击场景**——没有 Payload 模板、反弹 Shell 生成器
- **无多平台版本**——只有 Web 和 Docker 部署
- **不支持全局变量**——每次都要手动输入 IP/端口

### 可借鉴
- Recipe（编解码链）概念
- 操作搜索和分类体系
- 大量编解码实现可作为参考

---

## 2. HackTools

- **地址**：https://github.com/LasCC/HackTools
- **Stars**：6,600+
- **开发者**：Ludovic COULON & Riadh BOUCHAHOUA
- **协议**：MIT
- **技术栈**：TypeScript + React（浏览器扩展）

### 核心优势
- 反弹 Shell 生成器做得好，多语言支持
- XSS / SQLi / LFI 基础 Payload 内置
- 浏览器扩展直接在 DevTools 中使用，效率高
- 命令面板（Cmd+K）交互体验好

### 不足
- **正在痛苦转型**——从浏览器扩展转向 Web 应用，开发停滞
- **Payload 数据量有限**——远不如 PayloadsAllTheThings 全面
- **没有 WAF 绕过功能**
- **没有编解码链**——只有单层 Base64
- **不支持 uTools**
- **不支持全局变量**——每个工具独立输入

### 可借鉴
- 反弹 Shell 生成器的 UI 设计和语言覆盖
- 命令面板交互
- Cheat Sheet 的组织方式

---

## 3. PayloadsAllTheThings

- **地址**：https://github.com/swisskyrepo/PayloadsAllTheThings
- **Stars**：75,400+
- **开发者**：swisskyrepo
- **协议**：MIT
- **格式**：Markdown 文档库

### 核心优势
- **数据最全**——覆盖 Web 安全几乎所有攻击类型
- **社区贡献活跃**——持续更新新漏洞和绕过方式
- **有配套网站**——swisskyrepo.github.io/PayloadsAllTheThings/

### 不足
- **纯文档，不可交互**——无法参数化替换、无法过滤搜索
- **没有工具功能**——只是参考资料，不能直接生成 Payload
- **复制使用不便**——需要手动替换 IP/端口等参数

### 可借鉴
- 数据分类体系和命名规范
- Payload 数据本身（MIT 协议可直接引用）
- 攻击类型的覆盖范围作为功能规划参考

---

## 4. Ctool-sec

- **地址**：https://github.com/wpsec/Ctool-sec
- **Stars**：0
- **开发者**：wpsec
- **协议**：MIT
- **技术栈**：基于 Ctool（Vue 3 + TypeScript）

### 核心优势
- 已经跑通了 Ctool + 安全功能的整合
- 支持 uTools 平台
- 有 WAF/EDR 模式切换概念
- 有全局变量替换概念

### 不足
- **功能粗糙**——本质上只是把 Payloader 数据塞进去
- **Payload 数据有限**——远不如 PayloadsAllTheThings
- **没有编解码链**
- **没有反弹 Shell 生成器**
- **UI 未优化**
- **零社区影响力**（0 star）

### 可借鉴
- 验证了 uTools 安全工具有市场需求（17 用户）
- WAF/EDR 模式切换的概念可以做得更好
- 全局变量替换是好功能点

---

## 5. SecurityToolkit

- **地址**：https://securitytoolkit.github.io/
- **类型**：交互式速查表网站

### 简述
一个安全工具分类索引网站，按 AD/Web/OSINT/提权/扫描/密码学/移动安全等分类整理了 GitHub 上的安全工具。偏向工具推荐而非工具本身。

---

## 6. Penflow

- **地址**：https://github.com/rb-x/penflow（HackTools 作者新项目）
- **类型**：安全测试伴侣工具

### 简述
HackTools 作者的新作，定位为"安全测试伴侣"。目前处于早期阶段，值得持续关注，可能成为未来的直接竞品。

---

## 竞争定位总结

```
                    数据丰富度
                       ↑
  PayloadsAllTheThings │  
         ★★★★★        │
                       │         SecTool (目标定位)
                       │              ★★★★
                       │
    Ctool-sec          │        HackTools
      ★★              │          ★★★
                       │
                       │
       ──────────────────────────────→ 交互性/工具化
                       │
                       │    CyberChef
                       │      ★★★★
                       │  (编解码强，但不面向安全攻击)
```

SecTool 的目标象限：**高数据丰富度 + 高交互性**，填补右上角的市场空白。

## 差异化策略

1. **数据来源**：以 PayloadsAllTheThings（MIT）为数据基础，做交互化和参数化
2. **交互体验**：借鉴 HackTools 的即用即走体验 + CyberChef 的管道概念
3. **多平台覆盖**：复用 Ctool 架构，直接支持 6 个平台（竞品最多 3 个）
4. **WAF 绕过**：独有功能，自动生成绕过变体
5. **全局变量**：一处配置，所有工具联动
