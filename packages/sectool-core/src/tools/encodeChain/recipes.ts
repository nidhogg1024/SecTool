/**
 * Recipe 管理模块
 * 提供编解码链的 Recipe 保存/加载/分享功能
 * - 内置 Recipe：从原有预设迁移 + 新增实用预设
 * - 用户 Recipe：持久化到 localStorage
 * - 分享功能：通过 URL hash 编码/解码 Recipe
 */
import {ref, computed, watch} from "vue"

// ================ 类型定义 ================ //

export interface Recipe {
    id: string
    name: string
    description?: string
    steps: string[]        // 操作 ID 列表
    createdAt: number
    isBuiltin?: boolean    // 内置 Recipe 不可删除
}

// localStorage 存储 key
const STORAGE_KEY = "sectool_encode_recipes"

// ================ 内置 Recipe 定义 ================ //

/** 从原有 presets 迁移 + 新增实用安全测试预设 */
const builtinRecipeList: Recipe[] = [
    {
        id: "builtin_double_url_encode",
        name: "双重 URL 编码",
        description: "连续两次全字符 URL 编码，用于绕过单层解码的 WAF",
        steps: ["url_encode_full", "url_encode_full"],
        createdAt: 0,
        isBuiltin: true,
    },
    {
        id: "builtin_base64_url",
        name: "Base64 + URL 编码",
        description: "先 Base64 编码再 URL 编码，常用于参数传输",
        steps: ["base64_encode", "url_encode"],
        createdAt: 0,
        isBuiltin: true,
    },
    {
        id: "builtin_html_url",
        name: "HTML 实体 + URL 编码",
        description: "HTML 实体编码后再 URL 编码",
        steps: ["html_entity_encode", "url_encode"],
        createdAt: 0,
        isBuiltin: true,
    },
    {
        id: "builtin_unicode_url",
        name: "Unicode + URL 编码",
        description: "Unicode 转义后再 URL 编码",
        steps: ["unicode_encode", "url_encode"],
        createdAt: 0,
        isBuiltin: true,
    },
    {
        id: "builtin_hex_only",
        name: "Hex 编码",
        description: "将字符串转为 \\xHH 格式",
        steps: ["hex_encode"],
        createdAt: 0,
        isBuiltin: true,
    },
    {
        id: "builtin_xss_bypass",
        name: "XSS 过滤绕过",
        description: "URL 全字符编码 + HTML 实体编码，用于 XSS 过滤器绕过测试",
        steps: ["url_encode_full", "html_entity_encode"],
        createdAt: 0,
        isBuiltin: true,
    },
    {
        id: "builtin_sqli_encode",
        name: "SQL 注入编码",
        description: "Hex 编码 + URL 编码，用于 SQL 注入绕过测试",
        steps: ["hex_encode", "url_encode"],
        createdAt: 0,
        isBuiltin: true,
    },
    {
        id: "builtin_base64_nested",
        name: "Base64 嵌套",
        description: "连续两次 Base64 编码",
        steps: ["base64_encode", "base64_encode"],
        createdAt: 0,
        isBuiltin: true,
    },
    {
        id: "builtin_full_obfuscation",
        name: "全混淆编码",
        description: "Unicode + Hex + URL 三重编码，最大化混淆",
        steps: ["unicode_encode", "hex_encode", "url_encode"],
        createdAt: 0,
        isBuiltin: true,
    },
    {
        id: "builtin_reverse_base64",
        name: "反转 + Base64",
        description: "先反转字符串再 Base64 编码",
        steps: ["reverse", "base64_encode"],
        createdAt: 0,
        isBuiltin: true,
    },
]

// ================ 持久化读写 ================ //

/** 从 localStorage 读取用户 Recipe */
function loadUserRecipes(): Recipe[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed
    } catch {
        return []
    }
}

/** 将用户 Recipe 写入 localStorage */
function saveUserRecipesToStorage(recipes: Recipe[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
    } catch (e) {
        console.error("[recipes] 保存到 localStorage 失败:", e)
    }
}

// ================ 生成唯一 ID ================ //

function generateId(): string {
    return `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ================ 单例 composable ================ //

let _instance: ReturnType<typeof createRecipes> | null = null

function createRecipes() {
    // 合并内置和用户 Recipe
    const userRecipeList = ref<Recipe[]>(loadUserRecipes())

    // 所有 Recipe = 内置 + 用户
    const recipes = computed<Recipe[]>(() => [
        ...builtinRecipeList,
        ...userRecipeList.value,
    ])

    // 仅内置 Recipe
    const builtinRecipes = computed<Recipe[]>(() => builtinRecipeList)

    // 仅用户 Recipe
    const userRecipes = computed<Recipe[]>(() => userRecipeList.value)

    // 监听用户 Recipe 变化，自动持久化
    watch(
        userRecipeList,
        (val) => saveUserRecipesToStorage(val),
        {deep: true},
    )

    /**
     * 保存当前编码链为新 Recipe
     * @param name Recipe 名称
     * @param steps 操作 ID 列表
     * @param description 可选描述
     * @returns 新创建的 Recipe
     */
    function saveRecipe(name: string, steps: string[], description?: string): Recipe {
        const recipe: Recipe = {
            id: generateId(),
            name,
            description,
            steps: [...steps],
            createdAt: Date.now(),
        }
        userRecipeList.value = [...userRecipeList.value, recipe]
        return recipe
    }

    /**
     * 删除用户 Recipe（内置 Recipe 不可删除）
     * @returns 是否删除成功
     */
    function deleteRecipe(id: string): boolean {
        const idx = userRecipeList.value.findIndex(r => r.id === id)
        if (idx === -1) return false
        const next = [...userRecipeList.value]
        next.splice(idx, 1)
        userRecipeList.value = next
        return true
    }

    /** 重命名 Recipe */
    function renameRecipe(id: string, newName: string): boolean {
        const recipe = userRecipeList.value.find(r => r.id === id)
        if (!recipe) return false
        recipe.name = newName
        // 触发持久化
        userRecipeList.value = [...userRecipeList.value]
        return true
    }

    /** 更新 Recipe 的步骤 */
    function updateRecipeSteps(id: string, steps: string[]): boolean {
        const recipe = userRecipeList.value.find(r => r.id === id)
        if (!recipe) return false
        recipe.steps = [...steps]
        userRecipeList.value = [...userRecipeList.value]
        return true
    }

    /**
     * 导出单个 Recipe 为 URL 安全的 base64 编码字符串
     * 格式：btoa(JSON.stringify({name, steps, description}))
     */
    function exportRecipe(id: string): string {
        const recipe = recipes.value.find(r => r.id === id)
        if (!recipe) return ""
        const payload = {
            name: recipe.name,
            steps: recipe.steps,
            description: recipe.description || "",
        }
        return btoa(JSON.stringify(payload))
    }

    /**
     * 从 base64 编码的 hash 导入 Recipe
     * @returns 导入成功返回新 Recipe，失败返回 null
     */
    function importRecipeFromHash(hash: string): Recipe | null {
        try {
            const json = atob(hash)
            const data = JSON.parse(json)
            if (!data.steps || !Array.isArray(data.steps) || data.steps.length === 0) {
                return null
            }
            const recipe: Recipe = {
                id: generateId(),
                name: data.name || "Imported Recipe",
                description: data.description || undefined,
                steps: data.steps,
                createdAt: Date.now(),
            }
            userRecipeList.value = [...userRecipeList.value, recipe]
            return recipe
        } catch {
            return null
        }
    }

    /**
     * 导出所有用户 Recipe 为 JSON 字符串
     * 用于批量备份/迁移
     */
    function exportAllRecipes(): string {
        const exportData = userRecipeList.value.map(r => ({
            name: r.name,
            description: r.description || "",
            steps: r.steps,
        }))
        return JSON.stringify(exportData, null, 2)
    }

    /**
     * 从 JSON 字符串批量导入 Recipe
     * 跳过无效条目，返回成功导入的数量
     */
    function importRecipes(json: string): number {
        try {
            const data = JSON.parse(json)
            if (!Array.isArray(data)) return 0

            let count = 0
            const newRecipes: Recipe[] = []
            for (const item of data) {
                if (!item.steps || !Array.isArray(item.steps) || item.steps.length === 0) {
                    continue
                }
                newRecipes.push({
                    id: generateId(),
                    name: item.name || "Imported Recipe",
                    description: item.description || undefined,
                    steps: item.steps,
                    createdAt: Date.now(),
                })
                count++
            }
            if (newRecipes.length > 0) {
                userRecipeList.value = [...userRecipeList.value, ...newRecipes]
            }
            return count
        } catch {
            return 0
        }
    }

    /**
     * 生成可分享的 URL（将 Recipe 编码到 hash fragment）
     * 格式：currentUrl#recipe=base64string
     */
    function getShareUrl(id: string): string {
        const hash = exportRecipe(id)
        if (!hash) return ""
        const baseUrl = window.location.href.split("#")[0]
        return `${baseUrl}#recipe=${hash}`
    }

    return {
        recipes,
        userRecipes,
        builtinRecipes,
        saveRecipe,
        deleteRecipe,
        renameRecipe,
        updateRecipeSteps,
        exportRecipe,
        importRecipeFromHash,
        exportAllRecipes,
        importRecipes,
        getShareUrl,
    }
}

/**
 * Recipe 管理 composable（单例模式）
 * 在组件中调用 useRecipes() 获取共享实例
 */
export function useRecipes() {
    if (!_instance) {
        _instance = createRecipes()
    }
    return _instance
}
