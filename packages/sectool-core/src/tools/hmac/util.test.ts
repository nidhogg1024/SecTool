/**
 * HMAC 工具函数单元测试
 * 测试各种算法的 HMAC 计算
 */
import { vi } from "vitest";
import hmacFn, { methods } from "./util";

// 模拟 Text 类，需支持 toBase64/toHexString（HMAC 计算用）
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
                return btoa(
                    String.fromCharCode(...new TextEncoder().encode(this.str)),
                );
            }

            toString() {
                return this.str;
            }

            toHex() {
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

describe("HMAC 计算", () => {
    it("HMAC-MD5", () => {
        const result = hmacFn(
            "md5",
            Text.fromString("hello"),
            Text.fromString("key"),
        );
        expect(result).toHaveLength(32);
        expect(result).toMatch(/^[a-f0-9]+$/);
    });

    it("HMAC-SHA256", () => {
        const result = hmacFn(
            "sha256",
            Text.fromString("hello"),
            Text.fromString("key"),
        );
        expect(result).toHaveLength(64);
    });

    it("不存在的算法抛出异常", () => {
        expect(() =>
            hmacFn("invalid" as any, Text.fromString("hello"), Text.fromString("key")),
        ).toThrow();
    });

    it("methods 包含 6 种算法", () => {
        expect(methods).toEqual([
            "md5",
            "sha1",
            "sha256",
            "sha512",
            "sm3",
            "ripemd160",
        ]);
    });
});
