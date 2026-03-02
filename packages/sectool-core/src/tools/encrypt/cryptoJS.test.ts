import CryptoJS from "crypto-js"
import {
    aes,
    des,
    tripleDES,
    rc4,
    rabbit,
    modeLists,
    paddingLists,
    keySizeLists,
} from "./cryptoJS"

describe("AES", () => {
    // Simple 模式：加密后解密还原
    it("simple 模式加密解密还原", () => {
        const plainBase64 = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("hello"),
        )
        const encrypted = aes.encrypt(plainBase64, { key: "test-key" })
        expect(encrypted).toBeTruthy()
        const decrypted = aes.decrypt(encrypted, { key: "test-key" })
        expect(decrypted).toBe(plainBase64)
    })

    // Advanced 模式 CBC
    it("advanced CBC 模式加密解密", () => {
        const plainBase64 = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("hello world"),
        )
        const opts = {
            key: "1234567890123456",
            iv: "1234567890123456",
            mode: "CBC" as const,
            key_size: "128" as const,
            padding: "Pkcs7" as const,
            type: "advanced" as const,
            fill: true,
        }
        const encrypted = aes.encrypt(plainBase64, opts)
        const decrypted = aes.decrypt(encrypted, opts)
        expect(decrypted).toBe(plainBase64)
    })

    // Advanced 模式 ECB（无 IV）
    it("advanced ECB 模式（无 IV）", () => {
        const plainBase64 = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("test data"),
        )
        const opts = {
            key: "1234567890123456",
            mode: "ECB" as const,
            key_size: "128" as const,
            padding: "Pkcs7" as const,
            type: "advanced" as const,
        }
        const encrypted = aes.encrypt(plainBase64, opts)
        const decrypted = aes.decrypt(encrypted, opts)
        expect(decrypted).toBe(plainBase64)
    })
})

describe("DES", () => {
    it("simple 模式加密解密还原", () => {
        const plainBase64 = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("hello"),
        )
        const encrypted = des.encrypt(plainBase64, { key: "mykey123" })
        const decrypted = des.decrypt(encrypted, { key: "mykey123" })
        expect(decrypted).toBe(plainBase64)
    })

    it("advanced CBC 模式", () => {
        const plainBase64 = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("test"),
        )
        const opts = {
            key: "12345678",
            iv: "12345678",
            mode: "CBC" as const,
            padding: "Pkcs7" as const,
            type: "advanced" as const,
        }
        const encrypted = des.encrypt(plainBase64, opts)
        const decrypted = des.decrypt(encrypted, opts)
        expect(decrypted).toBe(plainBase64)
    })
})

describe("TripleDES", () => {
    it("simple 模式加密解密还原", () => {
        const plainBase64 = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("hello"),
        )
        const encrypted = tripleDES.encrypt(plainBase64, { key: "mykey123456789012" })
        const decrypted = tripleDES.decrypt(encrypted, {
            key: "mykey123456789012",
        })
        expect(decrypted).toBe(plainBase64)
    })

    it("advanced CBC 模式", () => {
        const plainBase64 = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("test data"),
        )
        const opts = {
            key: "123456789012345678901234",
            iv: "12345678",
            mode: "CBC" as const,
            padding: "Pkcs7" as const,
            type: "advanced" as const,
        }
        const encrypted = tripleDES.encrypt(plainBase64, opts)
        const decrypted = tripleDES.decrypt(encrypted, opts)
        expect(decrypted).toBe(plainBase64)
    })
})

describe("RC4", () => {
    it("加密解密还原", () => {
        const plainBase64 = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("hello"),
        )
        const encrypted = rc4.encrypt(plainBase64, { key: "secretkey" })
        const decrypted = rc4.decrypt(encrypted, { key: "secretkey" })
        expect(decrypted).toBe(plainBase64)
    })
})

describe("Rabbit", () => {
    it("加密解密还原", () => {
        const plainBase64 = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("hello"),
        )
        const encrypted = rabbit.encrypt(plainBase64, { key: "mykey123" })
        const decrypted = rabbit.decrypt(encrypted, { key: "mykey123" })
        expect(decrypted).toBe(plainBase64)
    })
})

describe("配置列表", () => {
    it("modeLists 包含 ECB, CBC, CTR, OFB, CFB", () => {
        expect(modeLists).toContain("ECB")
        expect(modeLists).toContain("CBC")
        expect(modeLists).toContain("CTR")
        expect(modeLists).toContain("OFB")
        expect(modeLists).toContain("CFB")
    })

    it("paddingLists 包含 Pkcs7, ZeroPadding, NoPadding 等", () => {
        expect(paddingLists).toContain("Pkcs7")
        expect(paddingLists).toContain("ZeroPadding")
        expect(paddingLists).toContain("NoPadding")
    })

    it("keySizeLists 包含 128, 192, 256", () => {
        expect(keySizeLists).toContain("128")
        expect(keySizeLists).toContain("192")
        expect(keySizeLists).toContain("256")
    })
})
