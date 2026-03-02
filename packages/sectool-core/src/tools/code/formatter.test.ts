import formatter from "./formatter"

describe("formatter", () => {
    it("isEnable 始终返回 false", () => {
        expect(formatter.isEnable("js", "beautify")).toBe(false)
        expect(formatter.isEnable("", "")).toBe(false)
    })

    it("simple 返回原始内容", async () => {
        const result = await formatter.simple("js", "beautify", "const x = 1")
        expect(result).toBe("const x = 1")
    })
})
