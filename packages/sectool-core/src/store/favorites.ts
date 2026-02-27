/**
 * 收藏夹系统
 *
 * 支持将任意工具的 payload 收藏、分组管理、搜索、导入导出。
 * 每条收藏记录包含来源工具、分类、标签、备注等元信息。
 * 使用模块级单例模式，所有 useFavorites() 共享同一份响应式状态。
 *
 * 数据持久化到 localStorage，key 为 sectool_favorites。
 */
import { reactive, watch, computed, type Ref } from "vue"
import { cloneDeep } from "lodash"

// ======================== 类型定义 ========================

/** 收藏条目 */
export interface FavoriteItem {
    /** 唯一标识（UUID） */
    id: string
    /** payload 内容 */
    content: string
    /** 显示名称 */
    name: string
    /** 来源工具（xss, sqli, lfi 等） */
    sourceTool?: string
    /** 来源分类 */
    sourceCategory?: string
    /** 所属分组名，默认 "default" */
    group: string
    /** 创建时间戳 */
    createdAt: number
    /** 可选标签 */
    tags?: string[]
    /** 用户备注 */
    note?: string
}

/** 收藏分组 */
export interface FavoriteGroup {
    /** 分组名称（唯一标识） */
    name: string
    /** 可选颜色标记 */
    color?: string
}

/** localStorage 持久化的数据结构 */
interface FavoritesState {
    /** 所有收藏条目 */
    items: FavoriteItem[]
    /** 所有分组 */
    groups: FavoriteGroup[]
}

// ======================== 常量 ========================

const STORAGE_KEY = "sectool_favorites"
const DEFAULT_GROUP = "default"

// ======================== 工具函数 ========================

/** 生成唯一 ID，优先使用 crypto.randomUUID，降级到随机字符串 */
const generateId = (): string => {
    return crypto.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2))
}

/** 从 localStorage 加载数据，校验完整性 */
const loadState = (): FavoritesState => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return createInitialState()

        const parsed = JSON.parse(raw) as FavoritesState
        if (
            !parsed ||
            !Array.isArray(parsed.items) ||
            !Array.isArray(parsed.groups)
        ) {
            return createInitialState()
        }

        // 确保默认分组始终存在
        if (!parsed.groups.some(g => g.name === DEFAULT_GROUP)) {
            parsed.groups.unshift({ name: DEFAULT_GROUP })
        }

        // 修复缺少 group 字段的条目
        for (const item of parsed.items) {
            if (!item.group) {
                item.group = DEFAULT_GROUP
            }
        }

        return parsed
    } catch {
        return createInitialState()
    }
}

/** 初始状态：空列表 + 默认分组 */
const createInitialState = (): FavoritesState => ({
    items: [],
    groups: [{ name: DEFAULT_GROUP }],
})

/** 持久化到 localStorage */
const saveState = (state: FavoritesState): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
        console.error("[Favorites] 保存失败:", e)
    }
}

// ======================== 单例状态（响应式） ========================

/** 全局唯一的响应式状态，所有 useFavorites() 共享同一份引用 */
let _state: FavoritesState | null = null
let _watchInitialized = false

const getState = (): FavoritesState => {
    if (!_state) {
        _state = reactive(loadState()) as FavoritesState
    }
    return _state
}

/** 初始化自动持久化 watch（仅执行一次） */
const initWatch = () => {
    if (_watchInitialized) return
    _watchInitialized = true

    const state = getState()
    watch(
        () => cloneDeep(state),
        () => saveState(state),
        { deep: true },
    )
}

// ======================== Composable ========================

/**
 * 收藏夹 composable
 *
 * 返回响应式的收藏数据和操作方法，多处调用共享同一份状态。
 *
 * @example
 * ```ts
 * const { items, addFavorite, toggleFavorite, isFavorited } = useFavorites()
 * addFavorite("<script>alert(1)</script>", "XSS Basic", "xss", "reflected")
 * ```
 */
export const useFavorites = () => {
    const state = getState()
    initWatch()

    // ======================== 收藏条目操作 ========================

    /** 所有收藏条目（响应式引用） */
    const items = computed(() => state.items)

    /** 所有分组（响应式引用） */
    const groups = computed(() => state.groups)

    /**
     * 添加收藏
     * @returns 新条目的 ID，内容为空时返回空字符串
     */
    const addFavorite = (
        content: string,
        name: string,
        sourceTool?: string,
        sourceCategory?: string,
        group?: string,
    ): string => {
        if (!content || content.trim() === "") return ""

        // 去重：相同 content 不重复添加
        if (state.items.some(item => item.content === content)) return ""

        const targetGroup = group || DEFAULT_GROUP
        // 如果目标分组不存在，自动创建
        if (!state.groups.some(g => g.name === targetGroup)) {
            state.groups.push({ name: targetGroup })
        }

        const item: FavoriteItem = {
            id: generateId(),
            content,
            name: name || content.slice(0, 50),
            sourceTool,
            sourceCategory,
            group: targetGroup,
            createdAt: Date.now(),
        }

        state.items.push(item)
        return item.id
    }

    /** 按 ID 删除收藏 */
    const removeFavorite = (id: string): boolean => {
        const idx = state.items.findIndex(item => item.id === id)
        if (idx === -1) return false
        state.items.splice(idx, 1)
        return true
    }

    /** 按 ID 更新收藏的部分字段 */
    const updateFavorite = (id: string, partial: Partial<Omit<FavoriteItem, "id">>): boolean => {
        const item = state.items.find(item => item.id === id)
        if (!item) return false
        Object.assign(item, partial)
        return true
    }

    /** 检查指定内容是否已收藏（按 content 字符串去重） */
    const isFavorited = (content: string): boolean => {
        return state.items.some(item => item.content === content)
    }

    /**
     * 切换收藏状态
     * 已收藏则取消，未收藏则添加
     */
    const toggleFavorite = (
        content: string,
        name: string,
        sourceTool?: string,
        sourceCategory?: string,
    ): void => {
        const existing = state.items.find(item => item.content === content)
        if (existing) {
            removeFavorite(existing.id)
        } else {
            addFavorite(content, name, sourceTool, sourceCategory)
        }
    }

    /** 按分组筛选收藏 */
    const getFavoritesByGroup = (group: string): FavoriteItem[] => {
        return state.items.filter(item => item.group === group)
    }

    /** 移动收藏到新分组 */
    const moveFavorite = (id: string, newGroup: string): boolean => {
        const item = state.items.find(item => item.id === id)
        if (!item) return false

        // 确保目标分组存在
        if (!state.groups.some(g => g.name === newGroup)) {
            state.groups.push({ name: newGroup })
        }
        item.group = newGroup
        return true
    }

    // ======================== 分组操作 ========================

    /** 创建分组（名称不能为空或与已有分组重复） */
    const createGroup = (name: string, color?: string): boolean => {
        if (!name || name.trim() === "") return false
        const trimmed = name.trim()
        if (state.groups.some(g => g.name === trimmed)) return false

        state.groups.push({ name: trimmed, color })
        return true
    }

    /** 删除分组，组内条目自动移至默认分组（不能删除默认分组） */
    const deleteGroup = (name: string): boolean => {
        if (name === DEFAULT_GROUP) return false
        const idx = state.groups.findIndex(g => g.name === name)
        if (idx === -1) return false

        // 将该分组下的条目移至默认分组
        for (const item of state.items) {
            if (item.group === name) {
                item.group = DEFAULT_GROUP
            }
        }
        state.groups.splice(idx, 1)
        return true
    }

    /** 重命名分组（不能重命名默认分组，新名称不能与已有分组重复） */
    const renameGroup = (oldName: string, newName: string): boolean => {
        if (oldName === DEFAULT_GROUP) return false
        if (!newName || newName.trim() === "") return false
        const trimmedNew = newName.trim()
        if (state.groups.some(g => g.name === trimmedNew)) return false

        const group = state.groups.find(g => g.name === oldName)
        if (!group) return false

        // 同步更新所有条目的 group 字段
        for (const item of state.items) {
            if (item.group === oldName) {
                item.group = trimmedNew
            }
        }
        group.name = trimmedNew
        return true
    }

    // ======================== 导入导出 ========================

    /** 导出所有收藏为 JSON 字符串 */
    const exportFavorites = (): string => {
        return JSON.stringify({
            items: state.items,
            groups: state.groups,
        }, null, 2)
    }

    /**
     * 从 JSON 字符串导入收藏
     * @param json JSON 字符串
     * @param replace 是否替换现有数据，默认追加合并
     */
    const importFavorites = (json: string, replace: boolean = false): boolean => {
        try {
            const data = JSON.parse(json) as FavoritesState
            if (!data || !Array.isArray(data.items)) return false

            // 校验每条数据的基本结构
            for (const item of data.items) {
                if (!item.id || !item.content || typeof item.content !== "string") {
                    return false
                }
            }

            if (replace) {
                // 替换模式：清空后导入
                state.items.splice(0, state.items.length, ...data.items)
                const importedGroups = Array.isArray(data.groups) ? data.groups : [{ name: DEFAULT_GROUP }]
                // 确保默认分组存在
                if (!importedGroups.some(g => g.name === DEFAULT_GROUP)) {
                    importedGroups.unshift({ name: DEFAULT_GROUP })
                }
                state.groups.splice(0, state.groups.length, ...importedGroups)
            } else {
                // 合并模式：跳过重复 content，重新生成 ID
                const existingContents = new Set(state.items.map(i => i.content))
                for (const item of data.items) {
                    if (existingContents.has(item.content)) continue
                    state.items.push({
                        ...item,
                        id: generateId(),
                        group: item.group || DEFAULT_GROUP,
                    })
                }
                // 合并分组
                if (Array.isArray(data.groups)) {
                    const existingGroupNames = new Set(state.groups.map(g => g.name))
                    for (const group of data.groups) {
                        if (!existingGroupNames.has(group.name)) {
                            state.groups.push(group)
                        }
                    }
                }
            }

            // 修复引用不存在分组的条目
            const groupNames = new Set(state.groups.map(g => g.name))
            for (const item of state.items) {
                if (!groupNames.has(item.group)) {
                    item.group = DEFAULT_GROUP
                }
            }

            return true
        } catch {
            return false
        }
    }

    // ======================== 搜索 ========================

    /** 搜索收藏（在 content / name / note / tags 中匹配关键字，大小写不敏感） */
    const searchFavorites = (keyword: string): FavoriteItem[] => {
        if (!keyword || keyword.trim() === "") return [...state.items]
        const lower = keyword.toLowerCase()
        return state.items.filter(item => {
            if (item.content.toLowerCase().includes(lower)) return true
            if (item.name.toLowerCase().includes(lower)) return true
            if (item.note?.toLowerCase().includes(lower)) return true
            if (item.tags?.some(tag => tag.toLowerCase().includes(lower))) return true
            return false
        })
    }

    return {
        /** 所有收藏条目（响应式） */
        items: items as Ref<FavoriteItem[]>,
        /** 所有分组（响应式） */
        groups: groups as Ref<FavoriteGroup[]>,

        addFavorite,
        removeFavorite,
        updateFavorite,
        isFavorited,
        toggleFavorite,
        getFavoritesByGroup,
        moveFavorite,

        createGroup,
        deleteGroup,
        renameGroup,

        exportFavorites,
        importFavorites,
        searchFavorites,
    }
}

export default useFavorites
