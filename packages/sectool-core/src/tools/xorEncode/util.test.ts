/**
 * XOR 编解码工具单元测试
 */
import { xorEncrypt, xorDecrypt } from "./util"

describe("xorEncrypt", () => {
    it("使用 ASCII 密钥加密简单文本", () => {
        const key = new TextEncoder().encode("key")
        const result = xorEncrypt("ABC", key)
        // A(0x41) ^ k(0x6b) = 0x2a, B(0x42) ^ e(0x65) = 0x27, C(0x43) ^ y(0x79) = 0x3a
        expect(result).toBe("2a273a")
    })

    it("密钥循环使用", () => {
        const key = new Uint8Array([0xff])
        const result = xorEncrypt("AB", key)
        // A(0x41) ^ 0xff = 0xbe, B(0x42) ^ 0xff = 0xbd
        expect(result).toBe("bebd")
    })

    it("空密钥抛出异常", () => {
        expect(() => xorEncrypt("test", new Uint8Array(0))).toThrow()
    })

    it("空输入返回空字符串", () => {
        const key = new TextEncoder().encode("key")
        expect(xorEncrypt("", key)).toBe("")
    })
})

describe("xorDecrypt", () => {
    it("加密再解密还原原文", () => {
        const key = new TextEncoder().encode("mysecret")
        const text = "Hello, World!"
        const encrypted = xorEncrypt(text, key)
        const decrypted = xorDecrypt(encrypted, key)
        expect(decrypted).toBe(text)
    })

    it("支持 0x 前缀的 hex 输入", () => {
        const key = new TextEncoder().encode("key")
        const hex = xorEncrypt("ABC", key)
        const result = xorDecrypt("0x" + hex, key)
        expect(result).toBe("ABC")
    })

    it("非法 hex 输入抛出异常", () => {
        const key = new TextEncoder().encode("k")
        expect(() => xorDecrypt("ZZZZ", key)).toThrow("Invalid hex input")
    })

    it("奇数长度 hex 抛出异常", () => {
        const key = new TextEncoder().encode("k")
        expect(() => xorDecrypt("abc", key)).toThrow("even length")
    })

    it("空密钥抛出异常", () => {
        expect(() => xorDecrypt("4142", new Uint8Array(0))).toThrow()
    })
})

describe("XOR 加解密对称性", () => {
    const testCases = [
        { text: "hello world", key: "secret" },
        { text: "<script>alert(1)</script>", key: "xor" },
        { text: "SELECT * FROM users WHERE 1=1", key: "bypass" },
        { text: "中文测试", key: "test" },
    ]

    testCases.forEach(({ text, key: keyStr }) => {
        it(`"${text}" 加密解密还原 (key="${keyStr}")`, () => {
            const key = new TextEncoder().encode(keyStr)
            const encrypted = xorEncrypt(text, key)
            expect(encrypted).not.toBe("")
            expect(xorDecrypt(encrypted, key)).toBe(text)
        })
    })
})
