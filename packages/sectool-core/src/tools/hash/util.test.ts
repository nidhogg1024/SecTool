/**
 * hash 工具函数单元测试
 * 测试哈希计算及表达式解析功能
 */
import { vi } from "vitest";
import hashFn, { methods } from "./util";

// 模拟 Text 类，避免复杂依赖；需支持 toBase64/toString/toHex/toHexString
vi.mock("@/helper/text", () => {
    return {
        default: class MockText {
            private str: string;

            constructor(str: string) {
                this.str = str;
            }

            static fromString(s: string) {
                return new MockText(s);
            }

            toBase64() {
                // 使用 Buffer 风格：UTF-8 字节转 base64
                return btoa(
                    String.fromCharCode(...new TextEncoder().encode(this.str)),
                );
            }

            toString() {
                return this.str;
            }

            toHex(_opts?: { type?: string }) {
                return Array.from(new TextEncoder().encode(this.str))
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join("");
            }

            toHexString() {
                return this.toHex();
            }
        },
    };
});

import Text from "@/helper/text";

describe("methods", () => {
    it("包含 5 种哈希算法", () => {
        expect(methods).toEqual(["md5", "sha1", "sha256", "sha512", "sm3"]);
    });
});

describe("hash 计算", () => {
    it("MD5 哈希", () => {
        const result = hashFn("md5", Text.fromString("hello"));
        expect(result).toBe("5d41402abc4b2a76b9719d911017c592");
    });

    it("SHA1 哈希", () => {
        const result = hashFn("sha1", Text.fromString("hello"));
        expect(result).toBe("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
    });

    it("SHA256 哈希", () => {
        const result = hashFn("sha256", Text.fromString("hello"));
        expect(result).toBe(
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
        );
    });

    it("SHA512 哈希", () => {
        const result = hashFn("sha512", Text.fromString("hello"));
        expect(result).toHaveLength(128);
    });

    it("不存在的算法抛出异常", () => {
        expect(() => hashFn("invalid" as any, Text.fromString("hello"))).toThrow();
    });
});

describe("expression 解析", () => {
    it("简单哈希（无表达式）", () => {
        const result = hashFn("md5", Text.fromString("hello"), "", "");
        expect(result).toBe("5d41402abc4b2a76b9719d911017c592");
    });

    it("表达式 hash($input)", () => {
        const result = hashFn("md5", Text.fromString("hello"), "", "hash($input)");
        expect(result).toBe("5d41402abc4b2a76b9719d911017c592");
    });

    it("表达式 hash($input.$salt)", () => {
        const result = hashFn(
            "md5",
            Text.fromString("hello"),
            "world",
            "hash($input.$salt)",
        );
        // MD5("helloworld")
        expect(result).toBeTruthy();
        expect(result).toHaveLength(32);
    });

    it("表达式 hash(hash($input))", () => {
        const result = hashFn("md5", Text.fromString("hello"), "", "hash(hash($input))");
        // MD5(MD5("hello"))
        expect(result).toHaveLength(32);
        expect(result).not.toBe("5d41402abc4b2a76b9719d911017c592");
    });
});
