/**
 * WAF 绕过引擎
 * 对用户输入的 payload 应用多种变换技术，生成绕过 WAF 的变体
 * 支持 SQL 注入、XSS 等多种场景的绕过手法
 */

// ================ 类型定义 ================ //

export interface BypassTechnique {
    /** 技术唯一标识 */
    id: string
    /** 技术中文名称 */
    name: string
    /** 技术英文名称 */
    nameEn: string
    /** 技术描述 */
    description: string
    /** 变换函数：输入原始字符串，返回一组绕过变体 */
    transform: (input: string) => string[]
}

export interface BypassResult {
    /** 使用的技术 ID */
    technique: string
    /** 该技术生成的所有变体 */
    results: string[]
}

// ================ 工具函数 ================ //

/** SQL 关键字列表，用于智能识别和变换 */
const SQL_KEYWORDS = [
    "SELECT", "UNION", "INSERT", "UPDATE", "DELETE", "DROP", "FROM", "WHERE",
    "AND", "OR", "ORDER", "GROUP", "BY", "HAVING", "LIMIT", "JOIN", "INTO",
    "VALUES", "SET", "CREATE", "ALTER", "TABLE", "DATABASE", "EXEC", "EXECUTE",
    "DECLARE", "CAST", "CONVERT", "CHAR", "VARCHAR", "CONCAT", "SUBSTRING",
    "ASCII", "BENCHMARK", "SLEEP", "WAITFOR", "DELAY", "IF", "CASE", "WHEN",
    "THEN", "ELSE", "END", "NULL", "NOT", "LIKE", "BETWEEN", "EXISTS", "IN",
    "ALL", "ANY", "SOME",
]

/**
 * 随机大小写混淆一个字符串
 * 生成多个随机大小写组合的变体
 */
function randomCaseMixing(str: string, count: number = 3): string[] {
    const results: string[] = []
    for (let n = 0; n < count; n++) {
        let result = ""
        for (let i = 0; i < str.length; i++) {
            const c = str[i]
            if (/[a-zA-Z]/.test(c)) {
                result += Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()
            } else {
                result += c
            }
        }
        // 避免和原始输入完全一致
        if (result !== str) {
            results.push(result)
        }
    }
    // 去重
    return [...new Set(results)]
}

/**
 * 在字符串中识别 SQL 关键字并在字符间插入内联注释
 */
function insertInlineComments(input: string): string[] {
    const results: string[] = []

    // 对整个输入中识别到的 SQL 关键字插入注释
    let modified = input
    for (const kw of SQL_KEYWORDS) {
        const regex = new RegExp(`\\b(${kw})\\b`, "gi")
        if (regex.test(modified)) {
            // 在关键字中间每隔一个字符插入 /**/
            modified = modified.replace(regex, (_match) => {
                return _match.split("").join("/**/")
            })
            break // 只处理第一个匹配到的关键字
        }
    }
    if (modified !== input) results.push(modified)

    // 对所有识别到的关键字都插入注释的全量版本
    let fullModified = input
    for (const kw of SQL_KEYWORDS) {
        const regex = new RegExp(`\\b(${kw})\\b`, "gi")
        fullModified = fullModified.replace(regex, (_match) => {
            return _match.split("").join("/**/")
        })
    }
    if (fullModified !== input && fullModified !== modified) {
        results.push(fullModified)
    }

    // 在空格位置插入注释
    const spaceReplaced = input.replace(/ /g, "/**/")
    if (spaceReplaced !== input) results.push(spaceReplaced)

    return [...new Set(results)]
}

/**
 * URL 编码（单次编码）
 */
function urlEncodeSingle(input: string): string {
    return input
        .split("")
        .map(c => {
            const code = c.charCodeAt(0)
            // 只编码非字母数字字符
            if (/[a-zA-Z0-9]/.test(c)) return c
            return "%" + code.toString(16).toUpperCase().padStart(2, "0")
        })
        .join("")
}

/**
 * URL 编码（全字符编码）
 */
function urlEncodeAll(input: string): string {
    return input
        .split("")
        .map(c => "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"))
        .join("")
}

/**
 * 双重 URL 编码
 */
function doubleUrlEncode(input: string): string {
    return urlEncodeSingle(urlEncodeSingle(input))
}

/**
 * 双重 URL 编码（全字符）
 */
function doubleUrlEncodeAll(input: string): string {
    return urlEncodeAll(input)
        .split("")
        .map(c => {
            if (c === "%") return "%25"
            return "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")
        })
        .join("")
}

// ================ 技术定义 ================ //

export const techniques: BypassTechnique[] = [
    {
        id: "case_mixing",
        name: "大小写混淆",
        nameEn: "Case Mixing",
        description: "随机化字符串中每个字母的大小写，绕过大小写敏感的正则匹配",
        transform: (input: string): string[] => {
            return randomCaseMixing(input, 5)
        },
    },
    {
        id: "inline_comment",
        name: "内联注释插入",
        nameEn: "Inline Comments",
        description: "在 SQL 关键字字符间及空格处插入 /**/ 注释，打断关键字匹配",
        transform: (input: string): string[] => {
            return insertInlineComments(input)
        },
    },
    {
        id: "url_encode",
        name: "URL 编码",
        nameEn: "URL Encoding",
        description: "对特殊字符进行单次 URL 编码",
        transform: (input: string): string[] => {
            const results: string[] = []
            // 特殊字符编码
            const partial = urlEncodeSingle(input)
            if (partial !== input) results.push(partial)
            // 全字符编码
            results.push(urlEncodeAll(input))
            return results
        },
    },
    {
        id: "double_url_encode",
        name: "双重 URL 编码",
        nameEn: "Double URL Encoding",
        description: "对 payload 进行两次 URL 编码，绕过只做一次 URL 解码的 WAF",
        transform: (input: string): string[] => {
            return [
                doubleUrlEncode(input),
                doubleUrlEncodeAll(input),
            ]
        },
    },
    {
        id: "unicode_sub",
        name: "Unicode 替换",
        nameEn: "Unicode Substitution",
        description: "将 ASCII 字符替换为视觉相似的 Unicode 字符（同形文字攻击）",
        transform: (input: string): string[] => {
            // 同形字符映射表
            const homoglyphs: Record<string, string> = {
                "a": "\uff41", "A": "\uff21",
                "e": "\uff45", "E": "\uff25",
                "i": "\uff49", "I": "\uff29",
                "o": "\uff4f", "O": "\uff2f",
                "u": "\uff55", "U": "\uff35",
                "s": "\uff53", "S": "\uff33",
                "c": "\uff43", "C": "\uff23",
                "l": "\uff4c", "L": "\uff2c",
                "t": "\uff54", "T": "\uff34",
                "'": "\u2018", "\"": "\u201c",
                "<": "\uff1c", ">": "\uff1e",
                "/": "\uff0f", "\\": "\uff3c",
                "(": "\uff08", ")": "\uff09",
                "=": "\uff1d", " ": "\u00a0",
            }
            // 全角字符替换
            const fullWidth = input.split("").map(c => homoglyphs[c] || c).join("")
            const results: string[] = []
            if (fullWidth !== input) results.push(fullWidth)

            // Unicode 转义序列 (\uXXXX)
            const unicodeEscape = input.split("").map(c => {
                const code = c.charCodeAt(0)
                if (code > 127 || /[a-zA-Z]/.test(c)) {
                    return "\\u" + code.toString(16).padStart(4, "0")
                }
                return c
            }).join("")
            if (unicodeEscape !== input) results.push(unicodeEscape)

            return results
        },
    },
    {
        id: "whitespace_alt",
        name: "空白符替换",
        nameEn: "Whitespace Alternatives",
        description: "将空格替换为 Tab、换行、注释等 WAF 可能忽略的空白字符",
        transform: (input: string): string[] => {
            const replacements: [string, string][] = [
                ["%09", "Tab"],
                ["%0a", "换行"],
                ["%0d", "回车"],
                ["/**/", "注释"],
                ["%a0", "NBSP"],
                ["+", "加号"],
                ["%0b", "垂直Tab"],
                ["%0c", "换页"],
            ]
            return replacements
                .map(([char]) => input.replace(/ /g, char))
                .filter(r => r !== input)
        },
    },
    {
        id: "hex_encode",
        name: "十六进制编码",
        nameEn: "Hex Encoding",
        description: "将字符串转换为 0x 十六进制格式（SQL 中常用于绕过字符串检测）",
        transform: (input: string): string[] => {
            const results: string[] = []
            // 整体 0x 编码
            const hex = "0x" + input.split("").map(c =>
                c.charCodeAt(0).toString(16).padStart(2, "0"),
            ).join("")
            results.push(hex)

            // 对 SQL 关键字部分做 0x 编码
            let modified = input
            for (const kw of SQL_KEYWORDS) {
                const regex = new RegExp(`\\b(${kw})\\b`, "gi")
                modified = modified.replace(regex, (match) => {
                    return "0x" + match.split("").map(c =>
                        c.charCodeAt(0).toString(16).padStart(2, "0"),
                    ).join("")
                })
            }
            if (modified !== input) results.push(modified)

            return [...new Set(results)]
        },
    },
    {
        id: "char_encode",
        name: "CHAR() 编码",
        nameEn: "CHAR() Encoding",
        description: "将字符串用 SQL CHAR() 函数逐字符编码，绕过字符串字面量检测",
        transform: (input: string): string[] => {
            const results: string[] = []

            // MySQL/MSSQL 风格: CHAR(xx,xx,xx)
            const charCodes = input.split("").map(c => c.charCodeAt(0))
            results.push(`CHAR(${charCodes.join(",")})`)

            // Oracle 风格: CHR(xx)||CHR(xx)
            const chrCodes = charCodes.map(c => `CHR(${c})`).join("||")
            results.push(chrCodes)

            // PostgreSQL 风格: CHR(xx)||CHR(xx)
            // 与 Oracle 相同，但添加注释说明
            // MySQL CONCAT 风格
            const concatChars = `CONCAT(${charCodes.map(c => `CHAR(${c})`).join(",")})`
            results.push(concatChars)

            return results
        },
    },
    {
        id: "concat_split",
        name: "拼接拆分",
        nameEn: "Concat Split",
        description: "将关键字拆分后通过字符串拼接函数重新组合",
        transform: (input: string): string[] => {
            const results: string[] = []

            // MySQL CONCAT 拆分
            let mysqlSplit = input
            for (const kw of SQL_KEYWORDS) {
                const regex = new RegExp(`\\b(${kw})\\b`, "gi")
                mysqlSplit = mysqlSplit.replace(regex, (match) => {
                    if (match.length < 3) return match
                    const mid = Math.floor(match.length / 2)
                    return `CONCAT('${match.slice(0, mid)}','${match.slice(mid)}')`
                })
            }
            if (mysqlSplit !== input) results.push(mysqlSplit)

            // Oracle || 拼接拆分
            let oracleSplit = input
            for (const kw of SQL_KEYWORDS) {
                const regex = new RegExp(`\\b(${kw})\\b`, "gi")
                oracleSplit = oracleSplit.replace(regex, (match) => {
                    if (match.length < 3) return match
                    const mid = Math.floor(match.length / 2)
                    return `'${match.slice(0, mid)}'||'${match.slice(mid)}'`
                })
            }
            if (oracleSplit !== input) results.push(oracleSplit)

            // MSSQL + 拼接拆分
            let mssqlSplit = input
            for (const kw of SQL_KEYWORDS) {
                const regex = new RegExp(`\\b(${kw})\\b`, "gi")
                mssqlSplit = mssqlSplit.replace(regex, (match) => {
                    if (match.length < 3) return match
                    const mid = Math.floor(match.length / 2)
                    return `'${match.slice(0, mid)}'+'${match.slice(mid)}'`
                })
            }
            if (mssqlSplit !== input) results.push(mssqlSplit)

            return [...new Set(results)]
        },
    },
    {
        id: "comment_variations",
        name: "注释符变体",
        nameEn: "Comment Variations",
        description: "在 payload 末尾添加不同风格的注释符截断后续 SQL",
        transform: (input: string): string[] => {
            const commentSuffixes = [
                "-- ",
                "--+",
                "-- -",
                "#",
                "%23",
                "/*",
                ";%00",
                "/*!*/",
                "-- /*",
            ]
            return commentSuffixes.map(suffix => `${input}${suffix}`)
        },
    },
    {
        id: "no_space_sql",
        name: "无空格 SQL",
        nameEn: "No-Space SQL",
        description: "利用括号分组消除空格需求，如 WHERE(1=1)AND(2=2)",
        transform: (input: string): string[] => {
            const results: string[] = []

            // 用括号替代 WHERE/AND/OR 前后的空格
            let parenGrouped = input
                .replace(/\s+WHERE\s+/gi, " WHERE(")
                .replace(/\s+AND\s+/gi, ")AND(")
                .replace(/\s+OR\s+/gi, ")OR(")

            // 处理末尾可能需要的闭括号
            const openCount = (parenGrouped.match(/\(/g) || []).length
            const closeCount = (parenGrouped.match(/\)/g) || []).length
            if (openCount > closeCount) {
                parenGrouped += ")".repeat(openCount - closeCount)
            }
            if (parenGrouped !== input) results.push(parenGrouped)

            // 简单去空格：替换所有空格为空（不一定总是有效但作为变体提供）
            const noSpace = input.replace(/ /g, "")
            if (noSpace !== input) results.push(noSpace)

            return results
        },
    },
    {
        id: "html_entity",
        name: "HTML 实体编码",
        nameEn: "HTML Entity Encoding",
        description: "将字符转换为 HTML 十进制/十六进制实体编码",
        transform: (input: string): string[] => {
            const results: string[] = []

            // 十进制实体编码（全字符）
            const decEntity = input.split("").map(c =>
                `&#${c.charCodeAt(0)};`,
            ).join("")
            results.push(decEntity)

            // 十六进制实体编码（全字符）
            const hexEntity = input.split("").map(c =>
                `&#x${c.charCodeAt(0).toString(16)};`,
            ).join("")
            results.push(hexEntity)

            // 只编码特殊字符和关键字母
            const partialEntity = input.split("").map(c => {
                if (/[<>"'&=();\/ ]/.test(c)) {
                    return `&#${c.charCodeAt(0)};`
                }
                return c
            }).join("")
            if (partialEntity !== decEntity) results.push(partialEntity)

            return [...new Set(results)]
        },
    },
    {
        id: "newline_injection",
        name: "换行注入",
        nameEn: "Newline Injection",
        description: "在关键字字符间插入 %0a（换行），部分解析器会忽略行内换行",
        transform: (input: string): string[] => {
            const results: string[] = []

            // 在所有字符间插入 %0a
            const fullNewline = input.split("").join("%0a")
            results.push(fullNewline)

            // 只在 SQL 关键字内插入 %0a
            let kwNewline = input
            for (const kw of SQL_KEYWORDS) {
                const regex = new RegExp(`\\b(${kw})\\b`, "gi")
                kwNewline = kwNewline.replace(regex, (match) => {
                    return match.split("").join("%0a")
                })
            }
            if (kwNewline !== input && kwNewline !== fullNewline) {
                results.push(kwNewline)
            }

            // 用 %0d%0a（CRLF）替换空格
            const crlfReplace = input.replace(/ /g, "%0d%0a")
            if (crlfReplace !== input) results.push(crlfReplace)

            return [...new Set(results)]
        },
    },
]

// ================ 技术 ID → 实例映射 ================ //

const techniqueMap = new Map<string, BypassTechnique>(
    techniques.map(t => [t.id, t]),
)

// ================ 核心生成函数 ================ //

/**
 * 对输入 payload 应用选定的绕过技术，生成变体
 * @param input - 原始 payload 字符串
 * @param selectedTechniques - 要应用的技术 ID 列表
 * @returns 每个技术对应的生成结果
 */
export function generateBypasses(
    input: string,
    selectedTechniques: string[],
): BypassResult[] {
    if (!input.trim()) return []

    return selectedTechniques
        .map(techId => {
            const tech = techniqueMap.get(techId)
            if (!tech) return null
            try {
                const results = tech.transform(input)
                return {
                    technique: techId,
                    results: results.filter(r => r && r !== input),
                }
            } catch {
                return {
                    technique: techId,
                    results: [],
                }
            }
        })
        .filter((r): r is BypassResult => r !== null && r.results.length > 0)
}
