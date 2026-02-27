// ================ 安全工具分类定义 ================ //
const _categories = ["shell", "payload", "encode", "crypto", "attack", "cheatsheet", "utility"] as const;

// ================ 工具 - 功能 - 父目录 定义 ================ //
export const _tools = {
    // === Shell 工具 ===
    reverseShell: {
        feature: ["reverseShell"],
        parent_directory: "",
    },

    // === Payload 库 ===
    xss: {
        feature: ["xss"],
        parent_directory: "",
    },
    sqli: {
        feature: ["sqli"],
        parent_directory: "",
    },
    cmdInjection: {
        feature: ["cmdInjection"],
        parent_directory: "",
    },
    lfi: {
        feature: ["lfi"],
        parent_directory: "",
    },
    ssrf: {
        feature: ["ssrf"],
        parent_directory: "",
    },
    xxe: {
        feature: ["xxe"],
        parent_directory: "",
    },
    ssti: {
        feature: ["ssti"],
        parent_directory: "",
    },

    // === 编解码 ===
    encodeChain: {
        feature: ["encodeChain"],
        parent_directory: "",
    },
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
    hashIdentify: {
        feature: ["hashIdentify"],
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
        feature: ["decoder", "encoder", "attacks"],
        parent_directory: "",
    },
    wafBypass: {
        feature: ["wafBypass"],
        parent_directory: "",
    },
    deserialize: {
        feature: ["deserialize"],
        parent_directory: "",
    },

    // === 速查手册 ===
    cheatsheet: {
        feature: ["cheatsheet"],
        parent_directory: "",
    },

    // === 辅助工具 ===
    ipcalc: {
        feature: ["ipv4", "ipv6"],
        parent_directory: "",
    },
    portService: {
        feature: ["portService"],
        parent_directory: "",
    },
} as const;

// ================ 分类 → 工具映射 ================ //
export const _categoryTool: Record<CategoryType, ToolType[]> = {
    shell: ["reverseShell"],
    payload: ["xss", "sqli", "cmdInjection", "lfi", "ssrf", "xxe", "ssti"],
    encode: ["encodeChain", "base64", "url", "unicode", "hexString", "html", "gzip"],
    crypto: ["hash", "hashIdentify", "hmac", "aes", "des", "tripleDes", "rc4", "rabbit", "sm2", "sm4", "rsa", "bcrypt"],
    attack: ["jwt", "wafBypass", "deserialize"],
    cheatsheet: ["cheatsheet"],
    utility: ["ipcalc", "portService"],
};

// 默认常用工具（首页快捷入口）
export const _common: ToolType[] = ["reverseShell", "xss", "sqli", "encodeChain", "hash", "hashIdentify", "wafBypass", "jwt", "cheatsheet"];


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
