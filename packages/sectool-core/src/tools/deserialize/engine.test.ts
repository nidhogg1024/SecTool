import {
    phpSerialize,
    phpUnserialize,
    detectJavaSerialized,
    detectPickle,
    filterChainsByLanguage,
    searchChains,
    getLanguages,
} from "./engine"

describe("phpSerialize / phpUnserialize", () => {
    it("null 序列化为 N; 并可反序列化还原", () => {
        const serialized = phpSerialize(null)
        expect(serialized).toBe("N;")
        expect(phpUnserialize(serialized)).toBe(null)
    })

    it("true 序列化为 b:1; 并可反序列化还原", () => {
        const serialized = phpSerialize(true)
        expect(serialized).toBe("b:1;")
        expect(phpUnserialize(serialized)).toBe(true)
    })

    it("false 序列化为 b:0; 并可反序列化还原", () => {
        const serialized = phpSerialize(false)
        expect(serialized).toBe("b:0;")
        expect(phpUnserialize(serialized)).toBe(false)
    })

    it("整数 42 序列化为 i:42; 并可反序列化还原", () => {
        const serialized = phpSerialize(42)
        expect(serialized).toBe("i:42;")
        expect(phpUnserialize(serialized)).toBe(42)
    })

    it("浮点数 3.14 序列化为 d:3.14; 并可反序列化还原", () => {
        const serialized = phpSerialize(3.14)
        expect(serialized).toBe("d:3.14;")
        expect(phpUnserialize(serialized)).toBe(3.14)
    })

    it("字符串 'hello' 序列化为 s:5:\"hello\"; 并可反序列化还原", () => {
        const serialized = phpSerialize("hello")
        expect(serialized).toBe('s:5:"hello";')
        expect(phpUnserialize(serialized)).toBe("hello")
    })

    it("数组 [1,2,3] 序列化并可反序列化还原", () => {
        const arr = [1, 2, 3]
        const serialized = phpSerialize(arr)
        expect(serialized).toBe("a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}")
        expect(phpUnserialize(serialized)).toEqual([1, 2, 3])
    })

    it("对象 {a:1, b:'test'} 序列化并可反序列化还原", () => {
        const obj = { a: 1, b: "test" }
        const serialized = phpSerialize(obj)
        expect(phpUnserialize(serialized)).toEqual(obj)
    })

    it("嵌套结构可正确序列化与反序列化", () => {
        const nested = { a: [1, { b: "nested" }] }
        const serialized = phpSerialize(nested)
        expect(phpUnserialize(serialized)).toEqual(nested)
    })

    it("PHP O: 格式对象反序列化，保留 __className", () => {
        // EvilClass 有 9 个字符
        const phpObj = 'O:9:"EvilClass":1:{s:3:"cmd";s:2:"id";}'
        const result = phpUnserialize(phpObj)
        expect(result).toEqual({ __className: "EvilClass", cmd: "id" })
    })
})

describe("detectJavaSerialized", () => {
    it("'aced0005...' 识别为 true", () => {
        expect(detectJavaSerialized("aced0005")).toBe(true)
        expect(detectJavaSerialized("aced0005737200116a6176612e7574696c2e48617368536574")).toBe(true)
    })

    it("'ACED0005...' 大小写不敏感，识别为 true", () => {
        expect(detectJavaSerialized("ACED0005")).toBe(true)
    })

    it("'aced 0005...' 支持空格，识别为 true", () => {
        expect(detectJavaSerialized("aced 0005 73")).toBe(true)
    })

    it("'00000000' 识别为 false", () => {
        expect(detectJavaSerialized("00000000")).toBe(false)
    })

    it("空字符串识别为 false", () => {
        expect(detectJavaSerialized("")).toBe(false)
    })
})

describe("detectPickle", () => {
    it("'8002...' v2 协议识别为 true", () => {
        expect(detectPickle("8002")).toBe(true)
        expect(detectPickle("800273")).toBe(true)
    })

    it("'8004...' v4 协议识别为 true", () => {
        expect(detectPickle("8004")).toBe(true)
    })

    it("'28...' v0 以 ( 开头识别为 true", () => {
        expect(detectPickle("28")).toBe(true)
        expect(detectPickle("280a")).toBe(true)
    })

    it("以 2e 结尾（STOP opcode）识别为 true", () => {
        expect(detectPickle("6162632e")).toBe(true)
    })

    it("'0000' 识别为 false", () => {
        expect(detectPickle("0000")).toBe(false)
    })
})

describe("filterChainsByLanguage", () => {
    it("'all' 返回全部 chain", () => {
        const result = filterChainsByLanguage("all")
        expect(result.length).toBeGreaterThan(0)
        // 应包含多种语言
        const langs = [...new Set(result.map(c => c.language))]
        expect(langs.length).toBeGreaterThan(1)
    })

    it("'java' 仅返回 java 类型的 chain，且数量大于 0", () => {
        const result = filterChainsByLanguage("java")
        expect(result.length).toBeGreaterThan(0)
        expect(result.every(c => c.language === "java")).toBe(true)
    })

    it("'php' 仅返回 php 类型的 chain", () => {
        const result = filterChainsByLanguage("php")
        expect(result.length).toBeGreaterThan(0)
        expect(result.every(c => c.language === "php")).toBe(true)
    })

    it("'nonexistent' 返回空数组", () => {
        const result = filterChainsByLanguage("nonexistent")
        expect(result).toEqual([])
    })
})

describe("searchChains", () => {
    it("'Commons' 匹配多个 Java chain", () => {
        const result = searchChains("Commons")
        expect(result.length).toBeGreaterThan(1)
        expect(result.some(c => c.name.includes("Commons"))).toBe(true)
    })

    it("'CVE-2015' 匹配至少一个 chain", () => {
        const result = searchChains("CVE-2015")
        expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it("空字符串返回全部 chain", () => {
        const all = filterChainsByLanguage("all")
        const result = searchChains("")
        expect(result.length).toBe(all.length)
    })

    it("'xyznonexistent' 返回空数组", () => {
        const result = searchChains("xyznonexistent")
        expect(result).toEqual([])
    })
})

describe("getLanguages", () => {
    it("返回包含 java、php、python、dotnet 的排序数组", () => {
        const langs = getLanguages()
        expect(langs).toContain("java")
        expect(langs).toContain("php")
        expect(langs).toContain("python")
        expect(langs).toContain("dotnet")
        // 应为排序后的数组
        const sorted = [...langs].sort()
        expect(langs).toEqual(sorted)
    })
})
