/**
 * Payload 与 Data 文件数据完整性测试
 * 验证项目中所有 payload/data 文件的导出结构、必填字段、无重复项
 */

import { vi } from "vitest"
import { sqliDatabases } from "./sqli/payloads"
import { xssCategories, getAllPayloads as getXssPayloads } from "./xss/payloads"
import { cmdCategories, getAllPayloads as getCmdPayloads } from "./cmdInjection/payloads"
import { lfiCategories, getAllPayloads as getLfiPayloads } from "./lfi/payloads"
import { ssrfCategories, getAllPayloads as getSsrfPayloads } from "./ssrf/payloads"
import { xxeCategories, getAllXxePayloads } from "./xxe/payloads"
import { sstiEngines, getAllSstiPayloads } from "./ssti/payloads"
import { shellCategories } from "./reverseShell/shells"
import { cheatsheetData } from "./cheatsheet/data"
import { portData } from "./portService/data"

// reverseShell/shells.ts 依赖 Pinia store，测试环境需 mock
vi.mock("@/store/globalVars", () => ({
    useGlobalVars: () => ({
        replaceVars: (s: string) => s,
    }),
}))

// ============================================================
// 1. SQLi Payloads
// ============================================================
describe("sqli/payloads - SQL 注入 Payload 数据", () => {
    it("sqliDatabases 非空且有数据", () => {
        expect(sqliDatabases).toBeDefined()
        expect(Array.isArray(sqliDatabases)).toBe(true)
        expect(sqliDatabases.length).toBeGreaterThan(0)
    })

    it("每个数据库包含 id、name、sections 且非空", () => {
        for (const db of sqliDatabases) {
            expect(db.id).toBeDefined()
            expect(typeof db.id).toBe("string")
            expect(db.id.trim()).not.toBe("")
            expect(db.name).toBeDefined()
            expect(typeof db.name).toBe("string")
            expect(db.name.trim()).not.toBe("")
            expect(db.sections).toBeDefined()
            expect(Array.isArray(db.sections)).toBe(true)
            expect(db.sections.length).toBeGreaterThan(0)
        }
    })

    it("每个 section 包含 id、name、nameEn、payloads 且每个 payload 有 id、name、payload", () => {
        for (const db of sqliDatabases) {
            for (const section of db.sections) {
                expect(section.id).toBeDefined()
                expect(section.name).toBeDefined()
                expect(section.nameEn).toBeDefined()
                expect(Array.isArray(section.payloads)).toBe(true)
                for (const p of section.payloads) {
                    expect(p.id).toBeDefined()
                    expect(typeof p.id).toBe("string")
                    expect(p.id.trim()).not.toBe("")
                    expect(p.name).toBeDefined()
                    expect(typeof p.name).toBe("string")
                    expect(p.name.trim()).not.toBe("")
                    expect(p.payload).toBeDefined()
                    expect(typeof p.payload).toBe("string")
                }
            }
        }
    })

    it("SQLi 所有 payload id 无重复", () => {
        const ids: string[] = []
        for (const db of sqliDatabases) {
            for (const section of db.sections) {
                for (const p of section.payloads) {
                    ids.push(p.id)
                }
            }
        }
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
    })
})

// ============================================================
// 2. XSS Payloads
// ============================================================
describe("xss/payloads - XSS Payload 数据", () => {
    it("xssCategories 非空且有数据", () => {
        expect(xssCategories).toBeDefined()
        expect(Array.isArray(xssCategories)).toBe(true)
        expect(xssCategories.length).toBeGreaterThan(0)
    })

    it("每个 category 包含 id、name、payloads，每个 payload 有必填字段", () => {
        for (const cat of xssCategories) {
            expect(cat.id).toBeDefined()
            expect(cat.name).toBeDefined()
            expect(Array.isArray(cat.payloads)).toBe(true)
            for (const p of cat.payloads) {
                expect(p.id).toBeDefined()
                expect(p.id.trim()).not.toBe("")
                expect(p.name).toBeDefined()
                expect(p.payload).toBeDefined()
                expect(p.context).toBeDefined()
                expect(p.purpose).toBeDefined()
                expect(Array.isArray(p.tags)).toBe(true)
            }
        }
    })

    it("XSS 所有 payload id 无重复", () => {
        const payloads = getXssPayloads()
        const ids = payloads.map((p) => p.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ============================================================
// 3. CmdInjection Payloads
// ============================================================
describe("cmdInjection/payloads - 命令注入 Payload 数据", () => {
    it("cmdCategories 非空且有数据", () => {
        expect(cmdCategories).toBeDefined()
        expect(Array.isArray(cmdCategories)).toBe(true)
        expect(cmdCategories.length).toBeGreaterThan(0)
    })

    it("每个 category 和 payload 有必填字段", () => {
        for (const cat of cmdCategories) {
            expect(cat.id).toBeDefined()
            expect(cat.name).toBeDefined()
            expect(cat.nameEn).toBeDefined()
            expect(Array.isArray(cat.payloads)).toBe(true)
            for (const p of cat.payloads) {
                expect(p.id).toBeDefined()
                expect(p.id.trim()).not.toBe("")
                expect(p.name).toBeDefined()
                expect(p.payload).toBeDefined()
                expect(p.category).toBeDefined()
                expect(["all", "linux", "windows"]).toContain(p.platform)
            }
        }
    })

    it("CmdInjection 所有 payload id 无重复", () => {
        const payloads = getCmdPayloads()
        const ids = payloads.map((p) => p.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ============================================================
// 4. LFI Payloads
// ============================================================
describe("lfi/payloads - LFI 本地文件包含 Payload 数据", () => {
    it("lfiCategories 非空且有数据", () => {
        expect(lfiCategories).toBeDefined()
        expect(Array.isArray(lfiCategories)).toBe(true)
        expect(lfiCategories.length).toBeGreaterThan(0)
    })

    it("每个 category 和 payload 有必填字段", () => {
        for (const cat of lfiCategories) {
            expect(cat.id).toBeDefined()
            expect(cat.name).toBeDefined()
            expect(cat.nameEn).toBeDefined()
            expect(Array.isArray(cat.payloads)).toBe(true)
            for (const p of cat.payloads) {
                expect(p.id).toBeDefined()
                expect(p.id.trim()).not.toBe("")
                expect(p.name).toBeDefined()
                expect(p.payload).toBeDefined()
                expect(p.category).toBeDefined()
                expect(p.platform).toBeDefined()
            }
        }
    })

    it("LFI 所有 payload id 无重复", () => {
        const payloads = getLfiPayloads()
        const ids = payloads.map((p) => p.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ============================================================
// 5. SSRF Payloads
// ============================================================
describe("ssrf/payloads - SSRF Payload 数据", () => {
    it("ssrfCategories 非空且有数据", () => {
        expect(ssrfCategories).toBeDefined()
        expect(Array.isArray(ssrfCategories)).toBe(true)
        expect(ssrfCategories.length).toBeGreaterThan(0)
    })

    it("每个 category 和 payload 有必填字段", () => {
        for (const cat of ssrfCategories) {
            expect(cat.id).toBeDefined()
            expect(cat.name).toBeDefined()
            expect(cat.nameEn).toBeDefined()
            expect(Array.isArray(cat.payloads)).toBe(true)
            for (const p of cat.payloads) {
                expect(p.id).toBeDefined()
                expect(p.id.trim()).not.toBe("")
                expect(p.name).toBeDefined()
                expect(p.payload).toBeDefined()
                expect(p.category).toBeDefined()
            }
        }
    })

    it("SSRF 所有 payload id 无重复", () => {
        const payloads = getSsrfPayloads()
        const ids = payloads.map((p) => p.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ============================================================
// 6. XXE Payloads
// ============================================================
describe("xxe/payloads - XXE Payload 数据", () => {
    it("xxeCategories 非空且有数据", () => {
        expect(xxeCategories).toBeDefined()
        expect(Array.isArray(xxeCategories)).toBe(true)
        expect(xxeCategories.length).toBeGreaterThan(0)
    })

    it("每个 category 和 payload 有必填字段", () => {
        for (const cat of xxeCategories) {
            expect(cat.id).toBeDefined()
            expect(cat.name).toBeDefined()
            expect(cat.nameEn).toBeDefined()
            expect(Array.isArray(cat.payloads)).toBe(true)
            for (const p of cat.payloads) {
                expect(p.id).toBeDefined()
                expect(p.id.trim()).not.toBe("")
                expect(p.name).toBeDefined()
                expect(p.payload).toBeDefined()
                expect(p.category).toBeDefined()
            }
        }
    })

    it("XXE 所有 payload id 无重复", () => {
        const payloads = getAllXxePayloads()
        const ids = payloads.map((p) => p.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ============================================================
// 7. SSTI Payloads
// ============================================================
describe("ssti/payloads - SSTI Payload 数据", () => {
    it("sstiEngines 非空且有数据", () => {
        expect(sstiEngines).toBeDefined()
        expect(Array.isArray(sstiEngines)).toBe(true)
        expect(sstiEngines.length).toBeGreaterThan(0)
    })

    it("每个 engine 和 payload 有必填字段", () => {
        for (const engine of sstiEngines) {
            expect(engine.id).toBeDefined()
            expect(engine.name).toBeDefined()
            expect(engine.nameEn).toBeDefined()
            expect(engine.language).toBeDefined()
            expect(Array.isArray(engine.payloads)).toBe(true)
            for (const p of engine.payloads) {
                expect(p.id).toBeDefined()
                expect(p.id.trim()).not.toBe("")
                expect(p.name).toBeDefined()
                expect(p.payload).toBeDefined()
                expect(p.engine).toBeDefined()
                expect(p.purpose).toBeDefined()
            }
        }
    })

    it("SSTI 所有 payload id 无重复", () => {
        const payloads = getAllSstiPayloads()
        const ids = payloads.map((p) => p.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ============================================================
// 8. ReverseShell Shells
// ============================================================
describe("reverseShell/shells - 反弹 Shell 模板数据", () => {
    it("shellCategories 非空且有数据", () => {
        expect(shellCategories).toBeDefined()
        expect(Array.isArray(shellCategories)).toBe(true)
        expect(shellCategories.length).toBeGreaterThan(0)
    })

    it("每个 category 有 name、shells，每个 shell 有必填字段", () => {
        for (const cat of shellCategories) {
            expect(cat.name).toBeDefined()
            expect(cat.name.trim()).not.toBe("")
            expect(Array.isArray(cat.shells)).toBe(true)
            expect(cat.shells.length).toBeGreaterThan(0)
            for (const s of cat.shells) {
                expect(s.id).toBeDefined()
                expect(s.id.trim()).not.toBe("")
                expect(s.name).toBeDefined()
                expect(s.language).toBeDefined()
                expect(s.template).toBeDefined()
                expect(s.template.trim()).not.toBe("")
                expect(["linux", "windows", "both"]).toContain(s.platform)
            }
        }
    })

    it("ReverseShell 所有 shell id 无重复", () => {
        const shells = shellCategories.flatMap((c) => c.shells)
        const ids = shells.map((s) => s.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ============================================================
// 9. Cheatsheet Data
// ============================================================
describe("cheatsheet/data - 速查手册数据", () => {
    it("cheatsheetData 非空且有数据", () => {
        expect(cheatsheetData).toBeDefined()
        expect(Array.isArray(cheatsheetData)).toBe(true)
        expect(cheatsheetData.length).toBeGreaterThan(0)
    })

    it("每个 tool 有 id、name、nameEn、sections，每个 entry 有必填字段", () => {
        for (const tool of cheatsheetData) {
            expect(tool.id).toBeDefined()
            expect(tool.name).toBeDefined()
            expect(tool.nameEn).toBeDefined()
            expect(Array.isArray(tool.sections)).toBe(true)
            expect(tool.sections.length).toBeGreaterThan(0)
            for (const section of tool.sections) {
                expect(section.id).toBeDefined()
                expect(section.name).toBeDefined()
                expect(section.nameEn).toBeDefined()
                expect(Array.isArray(section.entries)).toBe(true)
                for (const entry of section.entries) {
                    expect(entry.id).toBeDefined()
                    expect(entry.id.trim()).not.toBe("")
                    expect(entry.name).toBeDefined()
                    expect(entry.command).toBeDefined()
                    expect(entry.description).toBeDefined()
                    expect(entry.descriptionEn).toBeDefined()
                    expect(Array.isArray(entry.tags)).toBe(true)
                }
            }
        }
    })

    it("Cheatsheet 所有 entry id 无重复", () => {
        const entries = cheatsheetData.flatMap((t) =>
            t.sections.flatMap((s) => s.entries)
        )
        const ids = entries.map((e) => e.id)
        expect(new Set(ids).size).toBe(ids.length)
    })
})

// ============================================================
// 10. PortService Data
// ============================================================
describe("portService/data - 端口服务对照表数据", () => {
    it("portData 非空且有数据", () => {
        expect(portData).toBeDefined()
        expect(Array.isArray(portData)).toBe(true)
        expect(portData.length).toBeGreaterThan(0)
    })

    it("每个 port entry 有必填字段且结构合法", () => {
        const validCategories = [
            "web",
            "remote_access",
            "file_transfer",
            "email",
            "database",
            "ldap_ad",
            "message_queue",
            "container",
            "monitoring",
            "other",
        ]
        for (const entry of portData) {
            expect(entry.port).toBeDefined()
            expect(typeof entry.port).toBe("number")
            expect(entry.port).toBeGreaterThanOrEqual(1)
            expect(entry.port).toBeLessThanOrEqual(65535)
            expect(entry.protocol).toBeDefined()
            expect(["tcp", "udp", "both"]).toContain(entry.protocol)
            expect(entry.service).toBeDefined()
            expect(entry.service.trim()).not.toBe("")
            expect(entry.description).toBeDefined()
            expect(entry.descriptionEn).toBeDefined()
            expect(validCategories).toContain(entry.category)
        }
    })

    it("portData 中条目包含有效的 commonVulns 或 enumCommands（若存在则为数组）", () => {
        for (const entry of portData) {
            if (entry.commonVulns !== undefined) {
                expect(Array.isArray(entry.commonVulns)).toBe(true)
            }
            if (entry.enumCommands !== undefined) {
                expect(Array.isArray(entry.enumCommands)).toBe(true)
            }
            if (entry.defaultCreds !== undefined) {
                expect(Array.isArray(entry.defaultCreds)).toBe(true)
            }
        }
    })
})
