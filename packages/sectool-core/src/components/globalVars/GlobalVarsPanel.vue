<template>
    <div class="sectool-global-vars">
        <!-- 配置方案选择器 -->
        <div class="sectool-gv-section">
            <div class="sectool-gv-profile-bar">
                <Select
                    v-model="currentProfileId"
                    :options="profileOptions"
                    :label="t('profile')"
                />
                <Align gap="small">
                    <Button size="small" @click="handleCreateProfile" :text="'+'" tooltip="新建方案" />
                    <Button size="small" @click="handleRenameProfile" :text="'✎'" tooltip="重命名" />
                    <Button
                        size="small"
                        type="danger"
                        @click="handleDeleteProfile"
                        :text="'✕'"
                        :disabled="profiles.length <= 1"
                        tooltip="删除方案"
                    />
                </Align>
            </div>
        </div>

        <!-- 预定义变量列表 -->
        <div class="sectool-gv-section">
            <div class="sectool-gv-section-title">{{ t('predefined_vars') }}</div>
            <div class="sectool-gv-var-list">
                <div v-for="def in predefinedVars" :key="def.key" class="sectool-gv-var-item">
                    <Input
                        v-model="currentVarsReactive[def.key]"
                        :label="isZh ? def.label : def.labelEn"
                        :placeholder="def.placeholder"
                    />
                </div>
            </div>
        </div>

        <!-- 自定义变量 -->
        <div class="sectool-gv-section">
            <div class="sectool-gv-section-title">
                {{ t('custom_vars') }}
                <span class="sectool-gv-add-btn" @click="handleAddCustomVar">+ {{ t('custom_var_add') }}</span>
            </div>
            <div class="sectool-gv-var-list">
                <div v-for="(_item, idx) in customVarsList" :key="idx" class="sectool-gv-custom-row">
                    <Input
                        v-model="customVarsList[idx].key"
                        :placeholder="t('custom_var_key')"
                        :width="120"
                        :disabled="true"
                    />
                    <Input
                        v-model="customVarsList[idx].value"
                        :placeholder="t('custom_var_value')"
                        @change="handleCustomVarValueChange(idx)"
                    />
                    <Button size="small" type="danger" @click="handleRemoveCustomVar(idx)" :text="'✕'" />
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="sectool-gv-actions">
            <Align>
                <Button size="small" @click="handleClearAll" :text="t('clear_all')" />
                <Button size="small" @click="handleExport" :text="t('export')" />
                <Button size="small" @click="handleImport" :text="t('import')" />
            </Align>
        </div>

        <!-- 导入弹窗 -->
        <Modal v-model="showImportModal" :title="t('import')" @ok="doImport" @cancel="showImportModal = false">
            <Textarea v-model="importJson" :height="200" placeholder="Paste JSON here..." />
            <div style="margin-top: 8px;">
                <Bool v-model="importReplace" :label="t('import_replace')" border size="small" />
            </div>
        </Modal>

        <!-- 重命名弹窗 -->
        <Modal v-model="showRenameModal" :title="t('profile_rename')" @ok="doRename" @cancel="showRenameModal = false">
            <Input v-model="renameValue" :placeholder="t('profile_name_placeholder')" />
        </Modal>

        <!-- 新建方案弹窗 -->
        <Modal v-model="showCreateModal" :title="t('profile_create')" @ok="doCreate" @cancel="showCreateModal = false">
            <Input v-model="createValue" :placeholder="t('profile_name_placeholder')" />
        </Modal>
    </div>
</template>

<script lang="ts" setup>
/**
 * 全局变量设置面板
 *
 * 展示预定义变量输入、自定义变量管理、配置方案切换、导入导出等功能。
 * 可嵌入设置页面或侧边栏使用。
 */
import { computed, reactive, ref, watch } from "vue"
import { useGlobalVars, predefinedVars } from "@/store/globalVars"
import { getCurrentLocale } from "@/i18n"
import { copy as copyText } from "@/helper/clipboard"
import Message from "@/helper/message"

// ======================== 全局变量 composable ========================

const gv = useGlobalVars()
const { profiles, createProfile, deleteProfile, renameProfile, switchProfile, clearAll, exportProfiles, importProfiles, getCustomVars, addCustomVar, removeCustomVar } = gv

// ======================== 内联 i18n（组件级别，不依赖构建系统） ========================

const messages: Record<string, Record<string, string>> = {
    zh_CN: {
        profile: "配置方案",
        profile_create: "新建方案",
        profile_rename: "重命名",
        profile_delete: "删除方案",
        profile_name_placeholder: "请输入方案名称",
        predefined_vars: "预定义变量",
        custom_vars: "自定义变量",
        custom_var_add: "添加",
        custom_var_key: "变量名",
        custom_var_value: "变量值",
        clear_all: "恢复默认",
        export: "导出",
        import: "导入",
        import_replace: "替换现有方案",
        import_success: "导入成功",
        import_fail: "导入失败，请检查 JSON 格式",
        export_copied: "已复制到剪贴板",
    },
    en: {
        profile: "Profile",
        profile_create: "New Profile",
        profile_rename: "Rename",
        profile_delete: "Delete",
        profile_name_placeholder: "Enter profile name",
        predefined_vars: "Predefined Variables",
        custom_vars: "Custom Variables",
        custom_var_add: "Add",
        custom_var_key: "Name",
        custom_var_value: "Value",
        clear_all: "Reset All",
        export: "Export",
        import: "Import",
        import_replace: "Replace existing profiles",
        import_success: "Import successful",
        import_fail: "Import failed, check JSON format",
        export_copied: "Copied to clipboard",
    },
}

const isZh = computed(() => {
    const locale = getCurrentLocale()
    return locale.startsWith("zh")
})

const t = (key: string): string => {
    const lang = isZh.value ? "zh_CN" : "en"
    return messages[lang]?.[key] ?? key
}

// ======================== 方案管理 ========================

/** 当前选中方案 ID（双向绑定 Select 用） */
let currentProfileId = computed({
    get: () => gv.currentProfileId,
    set: (id: string) => switchProfile(id),
})

/** Select 组件的选项 */
const profileOptions = computed(() =>
    profiles.map(p => ({ value: p.id, label: p.name }))
)

// ======================== 预定义变量的响应式绑定 ========================

/**
 * 为预定义变量创建响应式对象
 * 通过 watch 双向同步到 globalVars store
 */
const currentVarsReactive = reactive<Record<string, string>>({})

/** 从 store 同步变量值到本地响应式对象 */
const syncFromStore = () => {
    const profile = profiles.find(p => p.id === gv.currentProfileId)
    if (!profile) return
    for (const def of predefinedVars) {
        currentVarsReactive[def.key] = profile.vars[def.key] ?? ""
    }
}

// 初始同步
syncFromStore()

// 方案切换时重新同步
watch(() => gv.currentProfileId, () => syncFromStore())

// 本地编辑时同步回 store
watch(
    () => ({ ...currentVarsReactive }),
    (newVals) => {
        for (const [key, value] of Object.entries(newVals)) {
            gv.setVar(key, value)
        }
    },
)

// ======================== 自定义变量 ========================

const customVarsList = ref<Array<{ key: string; value: string }>>(getCustomVars())

/** 方案切换时刷新自定义变量列表 */
watch(() => gv.currentProfileId, () => {
    customVarsList.value = getCustomVars()
})

const handleAddCustomVar = () => {
    const key = prompt(isZh.value ? "请输入变量名（大写字母）：" : "Enter variable name (UPPERCASE):")
    if (!key || key.trim() === "") return
    const normalizedKey = key.trim().toUpperCase()
    // 检查是否已存在
    if (predefinedVars.some(d => d.key === normalizedKey)) {
        Message.error(isZh.value ? "该变量名已在预定义列表中" : "Variable name already predefined")
        return
    }
    if (customVarsList.value.some(v => v.key === normalizedKey)) {
        Message.error(isZh.value ? "变量名已存在" : "Variable name already exists")
        return
    }
    addCustomVar(normalizedKey, "")
    customVarsList.value.push({ key: normalizedKey, value: "" })
}

const handleCustomVarValueChange = (idx: number) => {
    const item = customVarsList.value[idx]
    if (item) {
        gv.setVar(item.key, item.value)
    }
}

const handleRemoveCustomVar = (idx: number) => {
    const item = customVarsList.value[idx]
    if (item) {
        removeCustomVar(item.key)
        customVarsList.value.splice(idx, 1)
    }
}

// ======================== 方案操作 ========================

const showRenameModal = ref(false)
const renameValue = ref("")
const showCreateModal = ref(false)
const createValue = ref("")
const showImportModal = ref(false)
const importJson = ref("")
const importReplace = ref(false)

const handleCreateProfile = () => {
    createValue.value = ""
    showCreateModal.value = true
}

const doCreate = () => {
    const name = createValue.value.trim()
    if (!name) return
    createProfile(name)
    showCreateModal.value = false
    syncFromStore()
    customVarsList.value = getCustomVars()
}

const handleRenameProfile = () => {
    const profile = profiles.find(p => p.id === gv.currentProfileId)
    renameValue.value = profile?.name ?? ""
    showRenameModal.value = true
}

const doRename = () => {
    const name = renameValue.value.trim()
    if (!name) return
    renameProfile(gv.currentProfileId, name)
    showRenameModal.value = false
}

const handleDeleteProfile = () => {
    if (profiles.length <= 1) return
    const ok = confirm(t("profile_delete_confirm") || "Delete this profile?")
    if (!ok) return
    deleteProfile(gv.currentProfileId)
    syncFromStore()
    customVarsList.value = getCustomVars()
}

const handleClearAll = () => {
    const ok = confirm(t("clear_all_confirm") || "Reset all variables?")
    if (!ok) return
    clearAll()
    syncFromStore()
    customVarsList.value = getCustomVars()
}

const handleExport = () => {
    const json = exportProfiles()
    copyText(json, () => {
        Message.success(t("export_copied"))
    })
}

const handleImport = () => {
    importJson.value = ""
    importReplace.value = false
    showImportModal.value = true
}

const doImport = () => {
    const success = importProfiles(importJson.value, importReplace.value)
    if (success) {
        Message.success(t("import_success"))
        showImportModal.value = false
        syncFromStore()
        customVarsList.value = getCustomVars()
    } else {
        Message.error(t("import_fail"))
    }
}
</script>

<style>
.sectool-global-vars {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
}

.sectool-gv-section {
    margin-bottom: 12px;
}

.sectool-gv-profile-bar {
    display: flex;
    align-items: center;
    gap: 6px;
}

.sectool-gv-profile-bar .sectool-select {
    flex: 1;
    min-width: 0;
}

.sectool-gv-section-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--sectool-text-secondary, #888);
    margin: 8px 0 6px 2px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.sectool-gv-add-btn {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--sectool-primary, #409eff);
    cursor: pointer;
    text-transform: none;
    letter-spacing: 0;
}

.sectool-gv-add-btn:hover {
    text-decoration: underline;
}

.sectool-gv-var-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.sectool-gv-var-item {
    width: 100%;
}

.sectool-gv-var-item .sectool-input {
    width: 100%;
}

.sectool-gv-custom-row {
    display: flex;
    align-items: center;
    gap: 4px;
}

.sectool-gv-custom-row .sectool-input {
    flex: 1;
    min-width: 0;
}

.sectool-gv-actions {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--sectool-border-color, #e4e7ed);
}
</style>
