import radixConvert from "./radix"
import { defaultAlphabet } from "./radix"
import convent from "./nameConvert"
import { convent as conventDirect } from "./nameConvert"
import {
    uuid,
    instanceOfInput,
    instanceOfOutput,
    instanceOfInputOutput,
    instanceOfHistorySerializable,
    objectInObject,
    getInArrayOnlyOneItem,
} from "./util"

describe("radix - 进制转换", () => {
    it("十进制转二进制: 10 -> 1010", () => {
        expect(radixConvert(10, 10, 2)).toBe("1010")
        expect(radixConvert("10", 10, 2)).toBe("1010")
    })

    it("十进制转十六进制: 255 -> ff", () => {
        expect(radixConvert(255, 10, 16)).toBe("ff")
        // 36 进制及以下输入会统一转小写
        expect(radixConvert("FF", 16, 10)).toBe("255")
    })

    it("十六进制转十进制: ff -> 255", () => {
        expect(radixConvert("ff", 16, 10)).toBe("255")
        expect(radixConvert("FF", 16, 10)).toBe("255")
    })

    it("二进制转十进制: 1010 -> 10", () => {
        expect(radixConvert("1010", 2, 10)).toBe("10")
    })

    it("边界: 0 在任意进制下均为 0", () => {
        expect(radixConvert(0, 10, 2)).toBe("0")
        expect(radixConvert(0, 10, 16)).toBe("0")
        expect(radixConvert("0", 2, 10)).toBe("0")
    })

    it("大数转换: 支持高精度", () => {
        const big = "12345678901234567890"
        expect(radixConvert(big, 10, 16)).toBe("ab54a98ceb1f0ad2")
        expect(radixConvert("ab54a98ceb1f0ad2", 16, 10)).toBe(big)
    })

    it("无效输入时抛出异常", () => {
        // 二进制不能包含 2
        expect(() => radixConvert("102", 2, 10)).toThrow()
        // 十六进制不能包含 g
        expect(() => radixConvert("gg", 16, 10)).toThrow()
    })

    it("defaultAlphabet 导出正确", () => {
        expect(defaultAlphabet).toContain("0123456789")
        expect(defaultAlphabet).toContain("abcdefghijklmnopqrstuvwxyz")
    })
})

describe("nameConvert - 命名格式转换", () => {
    describe("camelCase <-> snake_case", () => {
        it("camelCase 转 snake_case", () => {
            const conv = convent("helloWorld")
            expect(conv.lowerSnakeCase()).toBe("hello_world")
            expect(conventDirect("helloWorld", "lowerSnakeCase")).toBe("hello_world")
        })

        it("snake_case 转 camelCase", () => {
            const conv = convent("hello_world")
            expect(conv.camelCase()).toBe("helloWorld")
            expect(conventDirect("hello_world", "camelCase")).toBe("helloWorld")
        })
    })

    describe("PascalCase 相关", () => {
        it("PascalCase 转 camelCase", () => {
            const conv = convent("HelloWorld")
            expect(conv.camelCase()).toBe("helloWorld")
        })

        it("snake_case 转 PascalCase (通过 upperSnakeCase 链)", () => {
            const conv = convent("HELLO_WORLD")
            expect(conv.pascalCase()).toBe("HelloWorld")
        })
    })

    describe("kebab-case 相关", () => {
        it("kebab-case 转 SNAKE_CASE", () => {
            const conv = convent("hello-world")
            expect(conv.upperSnakeCase()).toBe("HELLO_WORLD")
        })

        it("kebab-case 转 camelCase (链式: kebab -> UPPER_SNAKE -> PascalCase -> camelCase)", () => {
            const conv = convent("hello-world")
            expect(conv.camelCase()).toBe("helloWorld")
        })
    })

    describe("space case 相关", () => {
        it("space case 转 Camel Case", () => {
            const conv = convent("hello world")
            expect(conv.pascalCaseSpace()).toBe("Hello World")
        })

        it("snake_case 转 space case", () => {
            const conv = convent("hello_world")
            expect(conv.spaceCase()).toBe("hello world")
        })
    })

    describe("边界情况", () => {
        it("全小写无分隔符: 保持不变", () => {
            const conv = convent("helloworld")
            expect(conv.lowerSnakeCase()).toBe("helloworld")
        })

        it("全大写无分隔符: 转小写", () => {
            const conv = convent("HELLOWORLD")
            expect(conv.lowerSnakeCase()).toBe("helloworld")
        })

        it("空字符串或仅空格", () => {
            const conv = convent("   ")
            expect(conv.camelCase()).toBe("")
        })
    })
})

describe("util - 工具函数", () => {
    describe("uuid", () => {
        it("返回符合 UUID v4 格式的小写字符串", () => {
            const id = uuid()
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
            expect(id).toBe(id.toLowerCase())
        })

        it("每次调用生成不同的 UUID", () => {
            const a = uuid()
            const b = uuid()
            expect(a).not.toBe(b)
        })
    })

    describe("instanceOfInput", () => {
        it("对象带有 _ === '_input_' 时返回 true", () => {
            expect(instanceOfInput({ _: "_input_" })).toBe(true)
        })

        it("对象带有 _ === '_output_' 时返回 false", () => {
            expect(instanceOfInput({ _: "_output_" })).toBe(false)
        })

        it("普通对象返回 false", () => {
            expect(instanceOfInput({})).toBe(false)
            expect(instanceOfInput({ a: 1 })).toBe(false)
        })

        it("非对象返回 false", () => {
            expect(instanceOfInput(null)).toBe(false)
            expect(instanceOfInput(undefined)).toBe(false)
            expect(instanceOfInput("")).toBe(false)
        })
    })

    describe("instanceOfOutput", () => {
        it("对象带有 _ === '_output_' 时返回 true", () => {
            expect(instanceOfOutput({ _: "_output_" })).toBe(true)
        })

        it("对象带有 _ === '_input_' 时返回 false", () => {
            expect(instanceOfOutput({ _: "_input_" })).toBe(false)
        })
    })

    describe("instanceOfInputOutput", () => {
        it("Input 或 Output 均返回 true", () => {
            expect(instanceOfInputOutput({ _: "_input_" })).toBe(true)
            expect(instanceOfInputOutput({ _: "_output_" })).toBe(true)
        })

        it("普通对象返回 false", () => {
            expect(instanceOfInputOutput({})).toBe(false)
        })
    })

    describe("instanceOfHistorySerializable", () => {
        it("对象带有 __ === '_history_serializable_' 时返回 true", () => {
            expect(instanceOfHistorySerializable({ __: "_history_serializable_" })).toBe(true)
        })

        it("普通对象返回 false", () => {
            expect(instanceOfHistorySerializable({})).toBe(false)
        })
    })

    describe("objectInObject", () => {
        it("A 是 B 的子集时返回 true", () => {
            const B = { a: 1, b: 2, c: 3 }
            const A = { a: 1, b: 2 }
            expect(objectInObject(A, B)).toBe(true)
        })

        it("A 与 B 完全相同时返回 true", () => {
            const obj = { a: 1, b: 2 }
            expect(objectInObject(obj, obj)).toBe(true)
        })

        it("A 包含 B 没有的键时返回 false", () => {
            const A = { a: 1, b: 2, d: 4 }
            const B = { a: 1, b: 2 }
            expect(objectInObject(A, B)).toBe(false)
        })

        it("A 中某键的值与 B 不同时返回 false", () => {
            const A = { a: 1, b: 99 }
            const B = { a: 1, b: 2 }
            expect(objectInObject(A, B)).toBe(false)
        })
    })

    describe("getInArrayOnlyOneItem", () => {
        it("仅有唯一包含 value 的项时返回该项", () => {
            const lists = ["abc", "def", "ghi"]
            expect(getInArrayOnlyOneItem("de", lists)).toBe("def")
        })

        it("无匹配项时返回空字符串", () => {
            const lists = ["abc", "def"]
            expect(getInArrayOnlyOneItem("x", lists)).toBe("")
        })

        it("多匹配项时返回空字符串", () => {
            const lists = ["abc", "abd", "abx"]
            expect(getInArrayOnlyOneItem("ab", lists)).toBe("")
        })

        it("恰好一项完全等于 value 时", () => {
            const lists = ["abc", "def"]
            expect(getInArrayOnlyOneItem("abc", lists)).toBe("abc")
        })
    })
})
