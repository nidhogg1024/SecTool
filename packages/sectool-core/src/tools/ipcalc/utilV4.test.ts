/**
 * ipcalc/utilV4 单元测试
 * Vitest globals 已启用，describe/it/expect 无需导入
 */
import IpCalc, {
  ipConvert,
  wildcardToMask,
  WildcardCalc,
  getMaskBitByAvailable,
  isContiguousWildcard,
} from "./utilV4";

describe("ipConvert", () => {
  it("decimal to binary: ipConvert('192.168.1.1', 2) → '11000000.10101000.00000001.00000001'", () => {
    expect(ipConvert("192.168.1.1", 2)).toBe(
      "11000000.10101000.00000001.00000001",
    );
  });

  it("decimal to hex: ipConvert('192.168.1.1', 16) → 'C0.A8.01.01'", () => {
    expect(ipConvert("192.168.1.1", 16)).toBe("C0.A8.01.01");
  });

  it("decimal to octal: ipConvert('192.168.1.1', 8) → something reasonable", () => {
    const result = ipConvert("192.168.1.1", 8);
    // 八进制：192=0300, 168=0250, 1=0001, 1=0001
    expect(result).toBe("0300.0250.0001.0001");
  });

  it("identity: ipConvert('10.0.0.1', 10) → '10.0.0.1'", () => {
    expect(ipConvert("10.0.0.1", 10)).toBe("10.0.0.1");
  });
});

describe("wildcardToMask", () => {
  it("'0.0.0.255' → '255.255.255.0'", () => {
    expect(wildcardToMask("0.0.0.255")).toBe("255.255.255.0");
  });

  it("'0.0.255.255' → '255.255.0.0'", () => {
    expect(wildcardToMask("0.0.255.255")).toBe("255.255.0.0");
  });

  it("'0.0.0.0' → '255.255.255.255'", () => {
    expect(wildcardToMask("0.0.0.0")).toBe("255.255.255.255");
  });

  it("'0.0.63.255' → '255.255.192.0'", () => {
    expect(wildcardToMask("0.0.63.255")).toBe("255.255.192.0");
  });
});

describe("isContiguousWildcard", () => {
  it("'0.0.0.255' → true (standard /24)", () => {
    expect(isContiguousWildcard("0.0.0.255")).toBe(true);
  });

  it("'0.0.255.255' → true (standard /16)", () => {
    expect(isContiguousWildcard("0.0.255.255")).toBe(true);
  });

  it("'0.0.0.0' → true (/32)", () => {
    expect(isContiguousWildcard("0.0.0.0")).toBe(true);
  });
});

describe("getMaskBitByAvailable", () => {
  it("254 → 24 (a /24 has 254 usable hosts)", () => {
    expect(getMaskBitByAvailable(254)).toBe(24);
  });

  it("65534 → 16 (a /16 has 65534 usable hosts)", () => {
    expect(getMaskBitByAvailable(65534)).toBe(16);
  });

  it("1 → should return a valid bit value", () => {
    const result = getMaskBitByAvailable(1);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(32);
    expect(result).toBe(30);
  });
});

describe("IPv4 Calculator (default class)", () => {
  it("/24 subnet: base, broadcast, first, last, size, available, ipInfo, maskInfo", () => {
    const calc = new IpCalc("192.168.1.100", "24");
    expect(calc.base()).toBe("192.168.1.0");
    expect(calc.broadcast()).toBe("192.168.1.255");
    expect(calc.first()).toBe("192.168.1.1");
    expect(calc.last()).toBe("192.168.1.254");
    expect(calc.size()).toBe(256);
    expect(calc.available()).toBe(254);
    expect(calc.ipInfo().ip).toBe("192.168.1.100");
    expect(calc.maskInfo().bit).toBe("24");
    expect(calc.maskInfo().mask).toBe("255.255.255.0");
  });

  it("/16 subnet: base and size", () => {
    const calc2 = new IpCalc("10.0.5.100", "16");
    expect(calc2.base()).toBe("10.0.0.0");
    expect(calc2.size()).toBe(65536);
  });

  it("/32 single host: size and available", () => {
    const calc3 = new IpCalc("8.8.8.8", "32");
    expect(calc3.size()).toBe(1);
    expect(calc3.available()).toBe(0);
  });
});

describe("WildcardCalc", () => {
  it("192.168.1.0/0.0.0.255: wildcardBits, matchCount, firstMatch, lastMatch", () => {
    const wc = new WildcardCalc("192.168.1.0", "0.0.0.255");
    expect(wc.wildcardBits()).toBe(8);
    expect(wc.matchCount()).toBe(256);
    expect(wc.firstMatch()).toBe("192.168.1.0");
    expect(wc.lastMatch()).toBe("192.168.1.255");
  });
});
