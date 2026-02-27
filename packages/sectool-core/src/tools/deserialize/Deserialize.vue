<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 模式选择 -->
                    <Select
                        v-model="action.current.mode"
                        :label="$t('deserialize_mode')"
                        :options="modeOptions"
                    />
                    <!-- 分析模式：十六进制数据输入 -->
                    <template v-if="action.current.mode === 'analyze'">
                        <Textarea
                            v-model="action.current.hexInput"
                            :height="120"
                            :placeholder="$t('deserialize_hex_placeholder')"
                        />
                    </template>
                    <!-- PHP 序列化模式：JSON 输入 -->
                    <template v-if="action.current.mode === 'php_serialize'">
                        <Textarea
                            v-model="action.current.jsonInput"
                            :height="120"
                            :placeholder="$t('deserialize_json_placeholder')"
                        />
                    </template>
                    <!-- PHP 反序列化模式：PHP 序列化字符串输入 -->
                    <template v-if="action.current.mode === 'php_unserialize'">
                        <Textarea
                            v-model="action.current.phpInput"
                            :height="120"
                            :placeholder="$t('deserialize_php_placeholder')"
                        />
                    </template>
                    <!-- Gadget 参考模式：语言过滤 + 搜索 -->
                    <template v-if="action.current.mode === 'gadget_reference'">
                        <Select
                            v-model="action.current.language"
                            :label="$t('deserialize_language')"
                            :options="languageOptions"
                        />
                        <Input
                            v-model="action.current.search"
                            :label="$t('deserialize_search')"
                            :placeholder="$t('deserialize_search_placeholder')"
                        />
                    </template>
                </Align>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <!-- 分析模式输出 -->
                <template v-if="action.current.mode === 'analyze'">
                    <template v-if="analyzeResult">
                        <div class="sectool-deser-section-title">{{ $t('deserialize_detect_result') }}</div>
                        <Textarea :model-value="analyzeResult" :height="200" copy />
                    </template>
                </template>
                <!-- PHP 序列化输出 -->
                <template v-if="action.current.mode === 'php_serialize'">
                    <div class="sectool-deser-section-title">{{ $t('deserialize_php_serial_output') }}</div>
                    <Textarea :model-value="phpSerializeResult" :height="80" copy />
                    <!-- PHP 对象注入参考 -->
                    <div class="sectool-deser-section-title" style="margin-top:10px">
                        {{ $t('deserialize_php_injection_ref') }}
                    </div>
                    <template v-for="item in phpInjectionPayloads" :key="item.name">
                        <Textarea
                            :model-value="item.payload"
                            :height="52"
                            :placeholder="item.name + ' — ' + item.description"
                            :copy="item.name"
                        />
                    </template>
                </template>
                <!-- PHP 反序列化输出 -->
                <template v-if="action.current.mode === 'php_unserialize'">
                    <div class="sectool-deser-section-title">{{ $t('deserialize_php_unserial_output') }}</div>
                    <Textarea :model-value="phpUnserializeResult" :height="200" copy />
                </template>
                <!-- Gadget Chain 参考列表 -->
                <template v-if="action.current.mode === 'gadget_reference'">
                    <div class="sectool-deser-count">
                        {{ $t('deserialize_chain_count', [filteredGadgets.length]) }}
                    </div>
                    <template v-for="chain in filteredGadgets" :key="chain.id">
                        <div class="sectool-deser-chain-card">
                            <div class="sectool-deser-chain-header">
                                <span class="sectool-deser-chain-name">{{ chain.name }}</span>
                                <span class="sectool-deser-chain-lang">{{ chain.language }}</span>
                                <span v-if="chain.cve" class="sectool-deser-chain-cve">{{ chain.cve }}</span>
                            </div>
                            <div class="sectool-deser-chain-lib">{{ chain.library }}</div>
                            <div class="sectool-deser-chain-desc">{{ chain.description }}</div>
                            <Textarea
                                v-if="chain.payload"
                                :model-value="chain.payload"
                                :height="42"
                                :placeholder="$t('deserialize_payload')"
                                :copy="chain.name"
                            />
                        </div>
                    </template>
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"
import {
    detectJavaSerialized,
    parseJavaSerializedInfo,
    phpSerialize,
    phpUnserialize,
    detectPickle,
    pickleOpcodeReference,
    pickleRcePayloads,
    phpInjectionPayloads,
    filterChainsByLanguage,
    searchChains,
    getLanguages,
} from "./engine"

// 模式选项
const modeOptions = [
    { value: "analyze", label: "Analyze (Java/Pickle)" },
    { value: "php_serialize", label: "PHP Serialize" },
    { value: "php_unserialize", label: "PHP Unserialize" },
    { value: "gadget_reference", label: "Gadget Reference" },
]

// 语言过滤选项
const languageOptions = [
    { value: "all", label: "All" },
    ...getLanguages().map(lang => ({ value: lang, label: lang.charAt(0).toUpperCase() + lang.slice(1) })),
]

const action = useAction(await initialize({
    mode: "analyze",
    hexInput: "",
    jsonInput: "",
    phpInput: "",
    language: "all",
    search: "",
}))

/**
 * 分析模式：自动检测 Java 序列化 / Python Pickle，并输出解析结果
 */
const analyzeResult = $computed((): string => {
    const input = action.current.hexInput.trim()
    if (!input) return ""

    const lines: string[] = []

    try {
        // 检测 Java 序列化
        if (detectJavaSerialized(input)) {
            lines.push("=== Java 序列化数据 ===")
            lines.push("")
            try {
                const info = parseJavaSerializedInfo(input)
                lines.push(`协议版本: ${info.version}`)
                if (info.className) {
                    lines.push(`顶层类名: ${info.className}`)
                }
                if (info.fields.length > 0) {
                    lines.push(`字段列表 (${info.fields.length}):`)
                    info.fields.forEach(f => lines.push(`  - ${f}`))
                }
            } catch (e) {
                lines.push(`解析详情失败: ${e instanceof Error ? e.message : String(e)}`)
            }
            return lines.join("\n")
        }

        // 检测 Python Pickle
        if (detectPickle(input)) {
            lines.push("=== Python Pickle 数据 ===")
            lines.push("")
            const cleaned = input.replace(/\s+/g, "").toLowerCase()
            if (cleaned.substring(0, 2) === "80" && cleaned.length >= 4) {
                const ver = parseInt(cleaned.substring(2, 4), 16)
                lines.push(`Pickle 协议版本: ${ver}`)
            }
            lines.push("")
            lines.push("--- Pickle Opcode 参考 ---")
            pickleOpcodeReference.forEach(op => {
                lines.push(`  0x${op.hex} ${op.opcode.padEnd(20)} ${op.description}`)
            })
            lines.push("")
            lines.push("--- Pickle RCE Payload 参考 ---")
            pickleRcePayloads.forEach(p => {
                lines.push(`\n[${p.name}] ${p.description}`)
                lines.push(p.code)
            })
            return lines.join("\n")
        }

        lines.push("未识别的序列化格式")
        lines.push("")
        lines.push("支持的格式:")
        lines.push("  - Java 序列化 (magic: aced0005)")
        lines.push("  - Python Pickle (magic: 80 XX)")
        lines.push("")
        lines.push("请输入十六进制格式的序列化数据")
    } catch (e) {
        lines.push(`分析出错: ${e instanceof Error ? e.message : String(e)}`)
    }

    return lines.join("\n")
})

/**
 * PHP 序列化模式：将 JSON 转为 PHP 序列化字符串
 */
const phpSerializeResult = $computed((): string => {
    const input = action.current.jsonInput.trim()
    if (!input) return ""
    try {
        const obj = JSON.parse(input)
        return phpSerialize(obj)
    } catch (e) {
        return `错误: ${e instanceof Error ? e.message : String(e)}`
    }
})

/**
 * PHP 反序列化模式：将 PHP 序列化字符串解析为 JSON
 */
const phpUnserializeResult = $computed((): string => {
    const input = action.current.phpInput.trim()
    if (!input) return ""
    try {
        const result = phpUnserialize(input)
        return JSON.stringify(result, null, 2)
    } catch (e) {
        return `错误: ${e instanceof Error ? e.message : String(e)}`
    }
})

/**
 * Gadget Chain 参考模式：按语言和关键词过滤
 */
const filteredGadgets = $computed(() => {
    const byLang = filterChainsByLanguage(action.current.language)
    return searchChains(action.current.search, byLang)
})
</script>

<style scoped>
.sectool-deser-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-deser-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}

.sectool-deser-chain-card {
    margin-bottom: 8px;
    padding: 6px 8px;
    border-radius: 4px;
    background: var(--sectool-bg-secondary, rgba(0, 0, 0, 0.03));
}

.sectool-deser-chain-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
}

.sectool-deser-chain-name {
    font-weight: 600;
    font-size: 13px;
    color: var(--sectool-text-primary);
}

.sectool-deser-chain-lang {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--sectool-primary-light, #e3f2fd);
    color: var(--sectool-primary, #1976d2);
}

.sectool-deser-chain-cve {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--sectool-danger-light, #fce4ec);
    color: var(--sectool-danger, #d32f2f);
}

.sectool-deser-chain-lib {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin-bottom: 2px;
}

.sectool-deser-chain-desc {
    font-size: 12px;
    color: var(--sectool-text-secondary);
    margin-bottom: 4px;
    line-height: 1.4;
}
</style>
