/**
 * XOR 编解码工具函数
 * 密钥按字节循环使用，与输入逐字节 XOR
 */

/**
 * 将明文按 UTF-8 编码后与密钥逐字节 XOR，结果输出为十六进制字符串
 */
export function xorEncrypt(input: string, key: Uint8Array): string {
    const encoder = new TextEncoder()
    const inputBytes = encoder.encode(input)
    if (key.length === 0) throw new Error("Key cannot be empty")

    const out: number[] = []
    for (let i = 0; i < inputBytes.length; i++) {
        out.push(inputBytes[i] ^ key[i % key.length])
    }
    return Array.from(out)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
}

/**
 * 将十六进制字符串解析为字节，与密钥逐字节 XOR 后按 UTF-8 解码为字符串
 */
export function xorDecrypt(hexInput: string, key: Uint8Array): string {
    const clean = hexInput.replace(/\s+/g, "").replace(/^0x/gi, "")
    if (!/^[0-9a-fA-F]*$/.test(clean)) {
        throw new Error("Invalid hex input")
    }
    if (clean.length % 2 !== 0) {
        throw new Error("Hex input must have even length")
    }
    if (key.length === 0) throw new Error("Key cannot be empty")

    const bytes: number[] = []
    for (let i = 0; i < clean.length; i += 2) {
        bytes.push(parseInt(clean.slice(i, i + 2), 16))
    }

    const decoded: number[] = []
    for (let i = 0; i < bytes.length; i++) {
        decoded.push(bytes[i] ^ key[i % key.length])
    }

    const decoder = new TextDecoder("utf-8", { fatal: true })
    return decoder.decode(new Uint8Array(decoded))
}
