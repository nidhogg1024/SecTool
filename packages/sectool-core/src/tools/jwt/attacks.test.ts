/**
 * jwt/attacks 单元测试
 * Vitest globals 已启用，describe/it/expect 无需导入
 */
import {
  noneAlgorithmAttack,
  commonWeakKeys,
  rs256ToHs256Description,
  jkuInjectionDescription,
} from "./attacks";

// 有效测试 JWT (HS256, secret="secret")
const validJWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("noneAlgorithmAttack", () => {
  it("valid JWT → result ends with '.', header part decodes to alg=\"none\"", () => {
    const result = noneAlgorithmAttack(validJWT);
    expect(result.endsWith(".")).toBe(true);

    // 解析 header 部分（Base64URL 解码），验证 alg 为 "none"
    const [headerB64] = result.split(".");
    let base64 = headerB64.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    base64 += "=".repeat(padLen);
    const headerJson = atob(base64);
    const header = JSON.parse(headerJson);
    expect(header.alg).toBe("none");
  });

  it("invalid JWT (not 3 parts) → throws error", () => {
    expect(() => noneAlgorithmAttack("invalid")).toThrow();
    expect(() => noneAlgorithmAttack("a.b")).toThrow();
  });

  it("result has exactly 3 parts when split by '.'", () => {
    const result = noneAlgorithmAttack(validJWT);
    const parts = result.split(".");
    expect(parts).toHaveLength(3);
  });

  it("payload part is preserved from original token", () => {
    const result = noneAlgorithmAttack(validJWT);
    const [, payloadPart] = result.split(".");
    const [, originalPayload] = validJWT.split(".");
    expect(payloadPart).toBe(originalPayload);
  });
});

describe("commonWeakKeys", () => {
  it("array length > 100", () => {
    expect(commonWeakKeys.length).toBeGreaterThan(100);
  });

  it("includes 'secret', 'password', '123456', 'admin'", () => {
    expect(commonWeakKeys).toContain("secret");
    expect(commonWeakKeys).toContain("password");
    expect(commonWeakKeys).toContain("123456");
    expect(commonWeakKeys).toContain("admin");
  });

  it("all items are strings", () => {
    commonWeakKeys.forEach((item) => {
      expect(typeof item).toBe("string");
    });
  });

  it("no duplicates", () => {
    const unique = [...new Set(commonWeakKeys)];
    expect(unique.length).toBe(commonWeakKeys.length);
  });
});

describe("rs256ToHs256Description", () => {
  it("returns non-empty string", () => {
    const result = rs256ToHs256Description();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("contains key terms like 'RS256', 'HS256', 'jwt_tool'", () => {
    const result = rs256ToHs256Description();
    expect(result).toContain("RS256");
    expect(result).toContain("HS256");
    expect(result).toContain("jwt_tool");
  });
});

describe("jkuInjectionDescription", () => {
  it("returns non-empty string", () => {
    const result = jkuInjectionDescription();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("contains 'jku', 'x5u', 'kid'", () => {
    const result = jkuInjectionDescription();
    expect(result).toContain("jku");
    expect(result).toContain("x5u");
    expect(result).toContain("kid");
  });
});
