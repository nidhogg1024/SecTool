// ================ 安全工具分类定义 ================ //
// payload: Payload 库（XSS/SQLi/CMDi/LFI/SSRF/XXE/SSTI）
// shell: Shell 工具（反弹 Shell / Shell 升级）
// encode: 编解码（编解码链 / Base64 / URL / Hex / Unicode / HTML / Gzip）
// crypto: 加密/哈希（Hash / HMAC / AES / DES / SM4 / Bcrypt 等）
// attack: 攻击工具（JWT / WAF 绕过 / 反序列化）
// cheatsheet: 速查手册
// utility: 辅助工具（IP 计算器等）
const _categories = ["shell", "payload", "encode", "crypto", "attack", "cheatsheet", "utility"] as const;

// ================ 工具 - 功能 - 父目录 定义 ================ //
export const _tools = {
    // === Shell 工具 ===
    reverseShell: {
        feature: ["reverseShell"],
        parent_directory: "",
    },

    // === Payload 库 ===
    // （Phase 2 新增：xss / sqli / cmdInjection / lfi / ssrf / xxe / ssti）

    // === 编解码 ===
    base64: {
        feature: ["encoder", "decoder"],
        parent_directory: "",
    },
    url: {
        feature: ["encoder", "decoder"],
        parent_directory: "",
    },
    unicode: {
        feature: ["encoder", "decoder"],
        parent_directory: "",
    },
    hexString: {
        feature: ["stringToHex", "hexToString"],
        parent_directory: "",
    },
    html: {
        feature: ["html"],
        parent_directory: "",
    },
    gzip: {
        feature: ["encoder", "decoder"],
        parent_directory: "",
    },

    // === 加密/哈希 ===
    hash: {
        feature: ["hash"],
        parent_directory: "",
    },
    hmac: {
        feature: ["hmac"],
        parent_directory: "",
    },
    aes: {
        feature: ["encrypt", "decrypt"],
        parent_directory: "encrypt",
    },
    des: {
        feature: ["encrypt", "decrypt"],
        parent_directory: "encrypt",
    },
    tripleDes: {
        feature: ["encrypt", "decrypt"],
        parent_directory: "encrypt",
    },
    rc4: {
        feature: ["encrypt", "decrypt"],
        parent_directory: "encrypt",
    },
    rabbit: {
        feature: ["encrypt", "decrypt"],
        parent_directory: "encrypt",
    },
    sm2: {
        feature: ["encrypt", "decrypt", "sign", "verify"],
        parent_directory: "encrypt",
    },
    sm4: {
        feature: ["encrypt", "decrypt"],
        parent_directory: "encrypt",
    },
    rsa: {
        feature: ["encrypt", "decrypt"],
        parent_directory: "encrypt",
    },
    bcrypt: {
        feature: ["bcrypt"],
        parent_directory: "",
    },

    // === 攻击工具 ===
    jwt: {
        feature: ["decoder", "encoder"],
        parent_directory: "",
    },

    // === 辅助工具 ===
    ipcalc: {
        feature: ["ipv4", "ipv6"],
        parent_directory: "",
    },
} as const;

// ================ 分类 → 工具映射 ================ //
export const _categoryTool: Record<CategoryType, ToolType[]> = {
    shell: ["reverseShell"],
    payload: [],
    encode: ["base64", "url", "unicode", "hexString", "html", "gzip"],
    crypto: ["hash", "hmac", "aes", "des", "tripleDes", "rc4", "rabbit", "sm2", "sm4", "rsa", "bcrypt"],
    attack: ["jwt"],
    cheatsheet: [],
    utility: ["ipcalc"],
};

// 默认常用工具（首页快捷入口）
export const _common: ToolType[] = ["reverseShell", "hash", "base64", "url", "jwt", "ipcalc"];


// ================ 类型定义 ================ //
export type ToolType = keyof typeof _tools
export type FeatureType<T extends ToolType = ToolType> = typeof _tools[T]["feature"][number]
export type CategoryType = typeof _categories[number]

export interface ToolInterface<T extends ToolType = ToolType> {
    name: T,
    features: FeatureInterface<T>[]
    categories: CategoryInterface[]
    directory: string;
    root: string;
    parentDirectory: string;

    addFeature(feature: FeatureInterface<T>): void;

    addCategory(category: CategoryInterface): void;

    inCategory(name: string): name is CategoryType

    existFeature(name: string): name is FeatureType<T>

    getFeature(name: FeatureType<T>): FeatureInterface<T>

    firstCategory(): CategoryInterface

    firstFeature(): FeatureInterface<T>

    isSimple(): boolean
}

export interface CategoryInterface<T extends CategoryType = CategoryType> {
    name: T,
    tools: ToolInterface[]

    existTool(name: string): boolean

    addTool(tool: ToolInterface): void;

    firstTool(): ToolInterface
}

export interface FeatureInterface<T extends ToolType = ToolType> {
    name: FeatureType<T>,
    tool: ToolInterface<T>

    getRouter(): string

    getKey(): string

    getComponentPath(): string

    getQuery(category?: string, other?: Record<string, any>): Record<string, any>
}
