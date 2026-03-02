/**
 * Magic 自动解码引擎单元测试
 */
import { autoDetectAndDecode } from "./engine"
import { Base64 } from "js-base64"

describe("autoDetectAndDecode", () => {
    it("空输入返回空数组", () => {
        expect(autoDetectAndDecode("")).toEqual([])
        expect(autoDetectAndDecode("   ")).toEqual([])
    })

    it("检测 Base64 编码", () => {
        const encoded = Base64.encode("hello world")
        const results = autoDetectAndDecode(encoded)
        const base64Result = results.find(r => r.encoding === "Base64")
        expect(base64Result).toBeDefined()
        expect(base64Result!.decoded).toBe("hello world")
        expect(base64Result!.confidence).toBe("high")
    })

    it("检测 URL 编码", () => {
        const results = autoDetectAndDecode("hello%20world%21")
        const urlResult = results.find(r => r.encoding === "URL")
        expect(urlResult).toBeDefined()
        expect(urlResult!.decoded).toBe("hello world!")
    })

    it("检测 Hex 编码 (\\xHH 格式)", () => {
        const results = autoDetectAndDecode("\\x48\\x65\\x6c\\x6c\\x6f")
        const hexResult = results.find(r => r.encoding === "Hex")
        expect(hexResult).toBeDefined()
        expect(hexResult!.decoded).toBe("Hello")
    })

    it("检测纯 hex 编码", () => {
        const results = autoDetectAndDecode("48656c6c6f")
        const hexResult = results.find(r => r.encoding === "Hex")
        expect(hexResult).toBeDefined()
        expect(hexResult!.decoded).toBe("Hello")
    })

    it("检测 Unicode 编码 (\\uXXXX)", () => {
        const results = autoDetectAndDecode("\\u0048\\u0065\\u006c\\u006c\\u006f")
        const unicodeResult = results.find(r => r.encoding.includes("Unicode"))
        expect(unicodeResult).toBeDefined()
        expect(unicodeResult!.decoded).toBe("Hello")
    })

    it("检测 HTML 实体编码", () => {
        const results = autoDetectAndDecode("&lt;script&gt;alert(1)&lt;/script&gt;")
        const htmlResult = results.find(r => r.encoding === "HTML Entity")
        expect(htmlResult).toBeDefined()
        expect(htmlResult!.decoded).toContain("<script>")
    })

    it("纯文本不产生结果（或低置信度）", () => {
        const results = autoDetectAndDecode("just plain text")
        // 纯文本可能不匹配任何编码，或仅产生低置信度结果
        const highResults = results.filter(r => r.confidence === "high")
        expect(highResults.length).toBe(0)
    })

    it("结果按置信度排序", () => {
        const encoded = Base64.encode("hello")
        const results = autoDetectAndDecode(encoded)
        if (results.length >= 2) {
            const order = { high: 0, medium: 1, low: 2 }
            for (let i = 1; i < results.length; i++) {
                expect(order[results[i].confidence]).toBeGreaterThanOrEqual(
                    order[results[i - 1].confidence],
                )
            }
        }
    })

    it("不产生重复的解码结果", () => {
        const encoded = Base64.encode("test")
        const results = autoDetectAndDecode(encoded)
        const decodedValues = results.map(r => r.decoded)
        expect(new Set(decodedValues).size).toBe(decodedValues.length)
    })
})
