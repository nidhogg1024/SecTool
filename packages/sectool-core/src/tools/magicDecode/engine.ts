/**
 * Magic 自动解码引擎
 * 尝试多种编码类型并评估置信度，类似 CyberChef 的 Magic 功能
 */
import { Base64 } from "js-base64"
import decodeUriComponent from "decode-uri-component"
import { htmlDecode } from "js-htmlencode"

export interface DecodeResult {
    encoding: string
    decoded: string
    confidence: "high" | "medium" | "low"
    /** 解码链（如 "Base64 → URL"） */
    chain?: string
}

/** 判断字符串中可打印/有效字符占比，用于置信度评估 */
function printableRatio(str: string): number {
    if (!str.length) return 1
    let ok = 0
    for (const c of str) {
        const code = c.charCodeAt(0)
        if (code >= 32 && code < 127) ok++
        else if (code === 9 || code === 10 || code === 13) ok++
        else if (code >= 0x80 && code <= 0xffff) ok++ // 常见 UTF-8 范围
    }
    return ok / str.length
}

/** 判断是否包含 replacement character（解码失败时常见） */
function hasReplacementChar(str: string): boolean {
    return str.includes("\uFFFD")
}

function classifyConfidence(str: string): "high" | "medium" | "low" {
    if (hasReplacementChar(str)) return "low"
    const ratio = printableRatio(str)
    if (ratio >= 0.95) return "high"
    if (ratio >= 0.7) return "medium"
    return "low"
}

/** Hex 解码：支持 414243、0x414243、\x41\x42\x43 等格式 */
function tryHexDecode(input: string): string | null {
    const trimmed = input.trim()
    if (!trimmed) return null

    // 格式 \xHH
    if (/\\x[0-9a-fA-F]{2}/.test(trimmed)) {
        try {
            const bytes: number[] = []
            const regex = /\\x([0-9a-fA-F]{2})/g
            let match: RegExpExecArray | null
            let lastIdx = 0
            while ((match = regex.exec(trimmed)) !== null) {
                if (match.index > lastIdx) {
                    const plain = trimmed.slice(lastIdx, match.index)
                    bytes.push(...new TextEncoder().encode(plain))
                }
                bytes.push(parseInt(match[1], 16))
                lastIdx = regex.lastIndex
            }
            if (lastIdx < trimmed.length) {
                bytes.push(...new TextEncoder().encode(trimmed.slice(lastIdx)))
            }
            return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes))
        } catch {
            return null
        }
    }

    // 格式 0xHH 或纯 hex
    const clean = trimmed.replace(/\s+/g, "").replace(/0x/gi, "")
    if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) return null
    try {
        const bytes: number[] = []
        for (let i = 0; i < clean.length; i += 2) {
            bytes.push(parseInt(clean.slice(i, i + 2), 16))
        }
        return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes))
    } catch {
        return null
    }
}

/** Unicode \uXXXX 解码 */
function tryUnicodeDecode(input: string): string | null {
    if (!/\\u[0-9a-fA-F]{4}/.test(input)) return null
    try {
        return input.replace(/\\u([0-9a-fA-F]{4})/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    } catch {
        return null
    }
}

/** 单次 Base64 解码 */
function tryBase64Decode(input: string): string | null {
    const trimmed = input.trim().replace(/\s/g, "")
    if (!/^[A-Za-z0-9+/=]+$/.test(trimmed)) return null
    try {
        return Base64.decode(trimmed)
    } catch {
        return null
    }
}

/** 单次 URL 解码 */
function tryUrlDecode(input: string): string | null {
    if (!/%[0-9a-fA-F]{2}/.test(input)) return null
    try {
        return decodeUriComponent(input)
    } catch {
        return null
    }
}

/** HTML 实体解码 */
function tryHtmlDecode(input: string): string | null {
    if (!/&[#\w]+;/.test(input)) return null
    try {
        return htmlDecode(input)
    } catch {
        return null
    }
}

/** 解码器定义：id、名称、尝试函数 */
const decoders: Array<{
    id: string
    name: string
    fn: (s: string) => string | null
}> = [
    { id: "base64", name: "Base64", fn: tryBase64Decode },
    { id: "url", name: "URL", fn: tryUrlDecode },
    { id: "hex", name: "Hex", fn: tryHexDecode },
    { id: "html", name: "HTML Entity", fn: tryHtmlDecode },
    { id: "unicode", name: "Unicode (\\uXXXX)", fn: tryUnicodeDecode },
]

/** 自动检测并解码，返回按置信度排序的结果列表 */
export function autoDetectAndDecode(input: string): DecodeResult[] {
    const results: DecodeResult[] = []
    const seen = new Set<string>()

    if (!input.trim()) return results

    // 1. 单次解码
    for (const d of decoders) {
        const decoded = d.fn(input)
        if (decoded != null && decoded !== input && !seen.has(decoded)) {
            seen.add(decoded)
            results.push({
                encoding: d.name,
                decoded,
                confidence: classifyConfidence(decoded),
                chain: d.name,
            })
        }
    }

    // 2. 双重解码链（Base64→URL、URL→Base64 等常见组合）
    const chains: Array<[string, Array<(s: string) => string | null>]> = [
        ["Base64 → URL", [tryBase64Decode, tryUrlDecode]],
        ["URL → Base64", [tryUrlDecode, tryBase64Decode]],
        ["Base64 → Base64", [tryBase64Decode, tryBase64Decode]],
        ["URL → URL", [tryUrlDecode, tryUrlDecode]],
    ]
    for (const [chainName, fns] of chains) {
        let current: string = input
        for (const fn of fns) {
            const next = fn(current)
            if (next == null || next === current) break
            current = next
        }
        if (current !== input && !seen.has(current)) {
            seen.add(current)
            results.push({
                encoding: chainName,
                decoded: current,
                confidence: classifyConfidence(current),
                chain: chainName,
            })
        }
    }

    // 按置信度排序：high > medium > low
    const order = { high: 0, medium: 1, low: 2 }
    results.sort((a, b) => order[a.confidence] - order[b.confidence])

    return results
}
