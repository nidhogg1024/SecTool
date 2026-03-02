<template>
    <HeightResize v-slot="{ height }">
        <div class="sectool-page">
            <Card :title="$t('xorEncode_tool')">
                <div class="sectool-page-option">
                    <Align>
                        <Input
                            v-model="action.current.key"
                            :label="$t('xorEncode_key')"
                            :placeholder="$t('xorEncode_key')"
                        />
                        <Select
                            v-model="action.current.keyFormat"
                            :label="$t('xorEncode_key_format')"
                            :options="keyFormatOptions"
                        />
                        <Select
                            v-model="action.current.mode"
                            :label="$t('xorEncode_mode')"
                            :options="modeOptions"
                        />
                    </Align>
                </div>
                <Display :position="'bottom-right'" :text="displayButtonText" @click="handle">
                    <Textarea
                        v-model="action.current.input"
                        :height="height / 2 - 60"
                        :placeholder="action.current.mode === 'encode' ? $t('xorEncode_input') : 'Hex...'"
                    />
                </Display>
                <Textarea
                    :model-value="output"
                    :height="height / 2 - 60"
                    :placeholder="$t('xorEncode_output')"
                    :copy="!!output"
                />
            </Card>
        </div>
    </HeightResize>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"
import { xorEncrypt, xorDecrypt } from "./util"

const action = useAction(await initialize({
    input: "",
    key: "",
    keyFormat: "ascii" as "ascii" | "hex" | "decimal",
    mode: "encode" as "encode" | "decode",
}))

const keyFormatOptions = [
    { value: "ascii", label: $t('xorEncode_format_ascii') },
    { value: "hex", label: $t('xorEncode_format_hex') },
    { value: "decimal", label: $t('xorEncode_format_dec') },
]

const modeOptions = [
    { value: "encode", label: $t('xorEncode_mode_encode') },
    { value: "decode", label: $t('xorEncode_mode_decode') },
]

const displayButtonText = $computed(() =>
    action.current.mode === "encode" ? $t("xorEncode_encrypt") : $t("xorEncode_decrypt"),
)

// 密钥解析：按格式转为字节数组
function parseKeyToBytes(key: string, format: string): Uint8Array {
    if (!key.trim()) return new Uint8Array(0)
    if (format === "ascii") {
        return new TextEncoder().encode(key)
    }
    if (format === "hex") {
        let clean = key.replace(/\s+/g, "").replace(/^0x/gi, "")
        if (clean.length % 2 === 1) clean = "0" + clean
        const bytes: number[] = []
        for (let i = 0; i < clean.length; i += 2) {
            bytes.push(parseInt(clean.slice(i, i + 2), 16))
        }
        return new Uint8Array(bytes)
    }
    if (format === "decimal") {
        const parts = key.split(/[\s,]+/).filter(Boolean)
        return new Uint8Array(parts.map(p => {
            const n = parseInt(p, 10)
            if (isNaN(n) || n < 0 || n > 255) throw new Error(`Invalid byte: ${p}`)
            return n
        }))
    }
    throw new Error(`Unknown key format: ${format}`)
}

function handle() {}

const output = $computed(() => {
    const input = action.current.input.trim()
    const keyStr = action.current.key
    if (!input || !keyStr.trim()) return ""
    try {
        const keyBytes = parseKeyToBytes(keyStr, action.current.keyFormat)
        if (keyBytes.length === 0) return ""
        return action.current.mode === "encode"
            ? xorEncrypt(input, keyBytes)
            : xorDecrypt(input, keyBytes)
    } catch {
        return ""
    }
})
</script>
