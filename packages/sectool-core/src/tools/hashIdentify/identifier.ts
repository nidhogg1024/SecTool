import CryptoJS from "crypto-js"

export interface HashMatch {
    name: string
    hashcat: string
    john: string
    confidence: 'high' | 'medium' | 'low'
}

// 十六进制字符正则（不区分大小写）
const HEX_REGEX = /^[a-fA-F0-9]+$/
// 纯大写十六进制
const HEX_UPPER_REGEX = /^[A-F0-9]+$/
// Base64 特征正则
const BASE64_REGEX = /^[A-Za-z0-9+/]+=?=?$/

/**
 * 通过前缀模式识别哈希类型
 * 优先级最高，因为前缀特征唯一性强
 */
function identifyByPrefix(hash: string): HashMatch[] {
    // bcrypt: $2a$, $2b$, $2y$
    if (/^\$2[aby]\$.{53,}$/.test(hash)) {
        return [{ name: 'bcrypt', hashcat: '3200', john: 'bcrypt', confidence: 'high' }]
    }

    // MD5 Crypt: $1$
    if (/^\$1\$.+/.test(hash)) {
        return [{ name: 'MD5 Crypt', hashcat: '500', john: 'md5crypt', confidence: 'high' }]
    }

    // SHA256 Crypt: $5$
    if (/^\$5\$.+/.test(hash)) {
        return [{ name: 'SHA256 Crypt', hashcat: '7400', john: 'sha256crypt', confidence: 'high' }]
    }

    // SHA512 Crypt: $6$
    if (/^\$6\$.+/.test(hash)) {
        return [{ name: 'SHA512 Crypt', hashcat: '1800', john: 'sha512crypt', confidence: 'high' }]
    }

    // APR1: $apr1$
    if (/^\$apr1\$.+/.test(hash)) {
        return [{ name: 'APR1 (Apache MD5)', hashcat: '1600', john: 'md5apr1', confidence: 'high' }]
    }

    // WordPress / phpBB: $P$ 或 $H$
    if (/^\$(P|H)\$.+/.test(hash)) {
        return [{ name: 'WordPress (phpass)', hashcat: '400', john: 'phpass', confidence: 'high' }]
    }

    // Django PBKDF2 SHA256: pbkdf2_sha256$
    if (/^pbkdf2_sha256\$.+/.test(hash)) {
        return [{ name: 'Django PBKDF2-SHA256', hashcat: '10000', john: 'django', confidence: 'high' }]
    }

    // MySQL 4.x/5.x: * + 40 hex chars
    if (/^\*[a-fA-F0-9]{40}$/.test(hash)) {
        return [{ name: 'MySQL 4.x/5.x (SHA1)', hashcat: '300', john: 'mysql-sha1', confidence: 'high' }]
    }

    return []
}

/**
 * 通过十六进制长度识别哈希类型
 */
function identifyByHexLength(hash: string): HashMatch[] {
    if (!HEX_REGEX.test(hash)) {
        return []
    }

    const len = hash.length
    const isUpperOnly = HEX_UPPER_REGEX.test(hash)
    const matches: HashMatch[] = []

    switch (len) {
        case 8:
            matches.push({ name: 'CRC32', hashcat: '11500', john: 'crc32', confidence: 'high' })
            break

        case 16:
            matches.push({ name: 'MySQL 3.x', hashcat: '200', john: 'mysql', confidence: 'high' })
            break

        case 32:
            // 32位十六进制：MD5 最常见，其次 NTLM、MD4
            matches.push({ name: 'MD5', hashcat: '0', john: 'raw-md5', confidence: 'high' })
            matches.push({ name: 'NTLM', hashcat: '1000', john: 'nt', confidence: 'medium' })
            matches.push({ name: 'MD4', hashcat: '900', john: 'raw-md4', confidence: 'low' })
            // LM 哈希通常是纯大写
            if (isUpperOnly) {
                matches.push({ name: 'LM', hashcat: '3000', john: 'lm', confidence: 'medium' })
            } else {
                matches.push({ name: 'LM', hashcat: '3000', john: 'lm', confidence: 'low' })
            }
            break

        case 40:
            matches.push({ name: 'SHA1', hashcat: '100', john: 'raw-sha1', confidence: 'high' })
            matches.push({ name: 'RIPEMD-160', hashcat: '6000', john: 'ripemd-160', confidence: 'low' })
            break

        case 56:
            matches.push({ name: 'SHA224', hashcat: '1300', john: 'raw-sha224', confidence: 'high' })
            break

        case 64:
            matches.push({ name: 'SHA256', hashcat: '1400', john: 'raw-sha256', confidence: 'high' })
            break

        case 96:
            matches.push({ name: 'SHA384', hashcat: '10800', john: 'raw-sha384', confidence: 'high' })
            break

        case 128:
            matches.push({ name: 'SHA512', hashcat: '1700', john: 'raw-sha512', confidence: 'high' })
            matches.push({ name: 'Whirlpool', hashcat: '6100', john: 'whirlpool', confidence: 'low' })
            break
    }

    return matches
}

/**
 * 检测 Base64 编码的哈希
 */
function identifyBase64(hash: string): HashMatch[] {
    if (hash.length > 10 && BASE64_REGEX.test(hash) && (hash.endsWith('=') || hash.endsWith('=='))) {
        return [{ name: 'Base64 Encoded Hash', hashcat: '', john: '', confidence: 'low' }]
    }
    return []
}

/**
 * 识别哈希类型
 * 返回所有可能匹配的哈希类型，按置信度排序
 */
export function identifyHash(hash: string): HashMatch[] {
    const trimmed = hash.trim()
    if (!trimmed) return []

    // 前缀匹配优先级最高
    const prefixMatches = identifyByPrefix(trimmed)
    if (prefixMatches.length > 0) return prefixMatches

    // 十六进制长度匹配
    const hexMatches = identifyByHexLength(trimmed)
    if (hexMatches.length > 0) return hexMatches

    // Base64 检测
    const base64Matches = identifyBase64(trimmed)
    if (base64Matches.length > 0) return base64Matches

    return []
}

/**
 * 生成 NTLM 哈希
 * NTLM = MD4(UTF-16LE(password))
 */
export function generateNTLM(password: string): string {
    if (!password) return ''
    const utf16le = CryptoJS.enc.Utf16LE.parse(password)
    return (CryptoJS as any).MD4(utf16le).toString()
}
