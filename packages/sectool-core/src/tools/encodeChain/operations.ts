import CryptoJS from "crypto-js"
import {Base64} from "js-base64"
import {htmlEncode, htmlDecode} from "js-htmlencode"

// ================ 类型定义 ================ //

export interface EncodeOperation {
    id: string
    name: string
    nameEn: string
    type: 'encode' | 'decode' | 'both'
    fn: (input: string) => string
}

export interface EncodePreset {
    id: string
    name: string
    nameEn: string
    steps: string[]
}

// ================ 辅助函数 ================ //

/**
 * 全字符 URL 编码：将每个字符（含字母数字）转为 %XX 形式
 */
const urlEncodeFull = (str: string): string => {
    return Array.from(str).map(char => {
        const encoded = encodeURIComponent(char)
        if (encoded.startsWith('%')) {
            return encoded
        }
        const code = char.charCodeAt(0)
        return `%${code.toString(16).toUpperCase().padStart(2, '0')}`
    }).join('')
}

/**
 * Hex 编码：将字符串转为 \xHH 序列（UTF-8 字节）
 */
const hexEncode = (str: string): string => {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    return Array.from(bytes).map(b => `\\x${b.toString(16).padStart(2, '0')}`).join('')
}

/**
 * Hex 解码：将 \xHH 序列还原为字符串
 */
const hexDecode = (str: string): string => {
    const bytes: number[] = []
    const regex = /\\x([0-9a-fA-F]{2})/g
    let match: RegExpExecArray | null
    let lastIndex = 0

    while ((match = regex.exec(str)) !== null) {
        // 非 hex 转义部分原样保留（转为 UTF-8 字节）
        if (match.index > lastIndex) {
            const plain = str.slice(lastIndex, match.index)
            const encoder = new TextEncoder()
            bytes.push(...encoder.encode(plain))
        }
        bytes.push(parseInt(match[1], 16))
        lastIndex = regex.lastIndex
    }

    if (lastIndex < str.length) {
        const plain = str.slice(lastIndex)
        const encoder = new TextEncoder()
        bytes.push(...encoder.encode(plain))
    }

    const decoder = new TextDecoder()
    return decoder.decode(new Uint8Array(bytes))
}

/**
 * Unicode 编码：将字符转为 \uXXXX 格式
 */
const unicodeEncode = (str: string): string => {
    return Array.from(str).map(char => {
        const code = char.codePointAt(0) || 0
        if (code > 0xFFFF) {
            // 超出 BMP 的字符使用代理对
            const hi = Math.floor((code - 0x10000) / 0x400) + 0xD800
            const lo = ((code - 0x10000) % 0x400) + 0xDC00
            return `\\u${hi.toString(16).padStart(4, '0')}\\u${lo.toString(16).padStart(4, '0')}`
        }
        return `\\u${code.toString(16).padStart(4, '0')}`
    }).join('')
}

/**
 * Unicode 解码：将 \uXXXX 格式还原为字符
 */
const unicodeDecode = (str: string): string => {
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => {
        return String.fromCharCode(parseInt(hex, 16))
    })
}

// ================ 操作定义 ================ //

export const operations: EncodeOperation[] = [
    {
        id: 'url_encode',
        name: 'URL 编码 (标准)',
        nameEn: 'URL Encode (Standard)',
        type: 'encode',
        fn: (input: string) => encodeURIComponent(input),
    },
    {
        id: 'url_encode_full',
        name: 'URL 编码 (全字符)',
        nameEn: 'URL Encode (Full)',
        type: 'encode',
        fn: (input: string) => urlEncodeFull(input),
    },
    {
        id: 'url_decode',
        name: 'URL 解码',
        nameEn: 'URL Decode',
        type: 'decode',
        fn: (input: string) => decodeURIComponent(input),
    },
    {
        id: 'base64_encode',
        name: 'Base64 编码',
        nameEn: 'Base64 Encode',
        type: 'encode',
        fn: (input: string) => Base64.encode(input),
    },
    {
        id: 'base64_decode',
        name: 'Base64 解码',
        nameEn: 'Base64 Decode',
        type: 'decode',
        fn: (input: string) => Base64.decode(input),
    },
    {
        id: 'html_entity_encode',
        name: 'HTML 实体编码',
        nameEn: 'HTML Entity Encode',
        type: 'encode',
        fn: (input: string) => htmlEncode(input),
    },
    {
        id: 'html_entity_decode',
        name: 'HTML 实体解码',
        nameEn: 'HTML Entity Decode',
        type: 'decode',
        fn: (input: string) => htmlDecode(input),
    },
    {
        id: 'hex_encode',
        name: 'Hex 编码 (\\xHH)',
        nameEn: 'Hex Encode (\\xHH)',
        type: 'encode',
        fn: hexEncode,
    },
    {
        id: 'hex_decode',
        name: 'Hex 解码',
        nameEn: 'Hex Decode',
        type: 'decode',
        fn: hexDecode,
    },
    {
        id: 'unicode_encode',
        name: 'Unicode 编码 (\\uXXXX)',
        nameEn: 'Unicode Encode (\\uXXXX)',
        type: 'encode',
        fn: unicodeEncode,
    },
    {
        id: 'unicode_decode',
        name: 'Unicode 解码',
        nameEn: 'Unicode Decode',
        type: 'decode',
        fn: unicodeDecode,
    },
    {
        id: 'uppercase',
        name: '转大写',
        nameEn: 'Uppercase',
        type: 'both',
        fn: (input: string) => input.toUpperCase(),
    },
    {
        id: 'lowercase',
        name: '转小写',
        nameEn: 'Lowercase',
        type: 'both',
        fn: (input: string) => input.toLowerCase(),
    },
    {
        id: 'reverse',
        name: '反转字符串',
        nameEn: 'Reverse String',
        type: 'both',
        fn: (input: string) => Array.from(input).reverse().join(''),
    },
    {
        id: 'md5',
        name: 'MD5 哈希',
        nameEn: 'MD5 Hash',
        type: 'encode',
        fn: (input: string) => CryptoJS.MD5(input).toString(),
    },
    {
        id: 'sha1',
        name: 'SHA1 哈希',
        nameEn: 'SHA1 Hash',
        type: 'encode',
        fn: (input: string) => CryptoJS.SHA1(input).toString(),
    },
    {
        id: 'sha256',
        name: 'SHA256 哈希',
        nameEn: 'SHA256 Hash',
        type: 'encode',
        fn: (input: string) => CryptoJS.SHA256(input).toString(),
    },
]

// ================ 预设定义 ================ //

export const presets: EncodePreset[] = [
    {
        id: 'double_url_encode',
        name: '双重 URL 编码',
        nameEn: 'Double URL Encode',
        steps: ['url_encode_full', 'url_encode_full'],
    },
    {
        id: 'base64_url',
        name: 'Base64 + URL 编码',
        nameEn: 'Base64 + URL Encode',
        steps: ['base64_encode', 'url_encode'],
    },
    {
        id: 'html_url',
        name: 'HTML 实体 + URL 编码',
        nameEn: 'HTML Entity + URL Encode',
        steps: ['html_entity_encode', 'url_encode'],
    },
    {
        id: 'unicode_url',
        name: 'Unicode 转义 + URL 编码',
        nameEn: 'Unicode + URL Encode',
        steps: ['unicode_encode', 'url_encode'],
    },
    {
        id: 'hex_only',
        name: 'Hex 编码',
        nameEn: 'Hex Encode',
        steps: ['hex_encode'],
    },
]

// ================ 管线执行引擎 ================ //

const operationMap = new Map<string, EncodeOperation>(
    operations.map(op => [op.id, op])
)

export interface ChainResult {
    stepResults: string[]
    finalResult: string
    error?: string
}

/**
 * 按顺序执行编解码操作链
 * @param input 原始输入
 * @param operationIds 操作 ID 列表（按执行顺序）
 * @returns 每步中间结果 + 最终结果，出错时返回错误信息
 */
export function runChain(input: string, operationIds: string[]): ChainResult {
    const stepResults: string[] = []
    let current = input

    for (let i = 0; i < operationIds.length; i++) {
        const op = operationMap.get(operationIds[i])
        if (!op) {
            return {
                stepResults,
                finalResult: current,
                error: `步骤 ${i + 1}: 未知操作 "${operationIds[i]}"`,
            }
        }
        try {
            current = op.fn(current)
            stepResults.push(current)
        } catch (e) {
            return {
                stepResults,
                finalResult: current,
                error: `步骤 ${i + 1} (${op.name}): ${e instanceof Error ? e.message : String(e)}`,
            }
        }
    }

    return {stepResults, finalResult: current}
}
