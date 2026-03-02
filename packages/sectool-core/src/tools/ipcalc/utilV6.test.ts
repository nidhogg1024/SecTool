/**
 * IPv6 工具函数单元测试
 * 测试地址规范化、缩写及校验
 */
import { vi } from "vitest";
import utilV6 from "./utilV6";

// 模拟 Vue 的 $error 宏
// @ts-ignore
globalThis.$error = (e: any) => {
    if (e instanceof Error) return e.message;
    return String(e);
};

// 模拟 serialize 辅助模块（utilV6 的 subnet 等方法会用到）
vi.mock("@/helper/serialize", () => ({
    default: {
        empty: () => ({}),
        formObject: (obj: any) => obj,
        fromError: (err: any) => ({ error: err }),
    },
}));

describe("IPv6 normalize", () => {
    it("展开缩写地址", () => {
        const result = utilV6.normalize("::1");
        expect(result).toBe(
            "0000:0000:0000:0000:0000:0000:0000:0001",
        );
    });

    it("空字符串返回空", () => {
        expect(utilV6.normalize("")).toBe("");
    });

    it("已展开的地址不变", () => {
        const full =
            "2001:0db8:0000:0000:0000:0000:0000:0001";
        expect(utilV6.normalize(full)).toBe(full);
    });
});

describe("IPv6 abbreviate", () => {
    it("缩写地址", () => {
        const result = utilV6.abbreviate(
            "0000:0000:0000:0000:0000:0000:0000:0001",
        );
        expect(result).toBe("::1");
    });

    it("空字符串返回空", () => {
        expect(utilV6.abbreviate("")).toBe("");
    });
});

describe("IPv6 validate", () => {
    it("有效地址返回 true", () => {
        expect(utilV6.validate("::1")).toBe(true);
        expect(utilV6.validate("2001:db8::1")).toBe(true);
    });
});
