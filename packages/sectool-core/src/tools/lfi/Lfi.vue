<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 分类选择器 -->
                    <Select
                        v-model="action.current.selectedCategory"
                        :label="$t('lfi_category')"
                        :options="categoryOptions"
                    />
                    <!-- 平台选择器 -->
                    <Select
                        v-model="action.current.selectedPlatform"
                        :label="$t('lfi_platform')"
                        :options="platformOptions"
                    />
                    <!-- 目标文件（用户自定义，用于替换 Payload 中的占位符） -->
                    <Input
                        v-model="action.current.targetFile"
                        :label="$t('lfi_target_file')"
                        :placeholder="$t('lfi_target_file_placeholder')"
                    />
                    <!-- 穿越深度（仅路径穿越分类下生效） -->
                    <Input
                        v-model="action.current.traversalDepth"
                        :label="$t('lfi_traversal_depth')"
                        :placeholder="$t('lfi_traversal_depth_placeholder')"
                    />
                    <!-- 自定义基础路径 -->
                    <Input
                        v-model="action.current.basePath"
                        :label="$t('lfi_base_path')"
                        :placeholder="$t('lfi_base_path_placeholder')"
                    />
                    <!-- 搜索框 -->
                    <Input
                        v-model="action.current.search"
                        :label="$t('lfi_search')"
                        :placeholder="$t('lfi_search_placeholder')"
                    />
                </Align>
                <template #extra>
                    <Align>
                        <!-- 仅绕过型 Payload 切换 -->
                        <Bool
                            size="small"
                            v-model="action.current.bypassOnly"
                            border
                            :label="$t('lfi_bypass_only')"
                        />
                    </Align>
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <div class="sectool-lfi-count">{{ $t('lfi_payload_count', [filteredPayloads.length]) }}</div>
                <template v-for="category in filteredCategories" :key="category.id">
                    <div class="sectool-lfi-section-title">{{ category.name }}</div>
                    <template v-for="item in category.payloads" :key="item.id">
                        <Textarea
                            :model-value="applyCustomization(item.payload)"
                            :height="42"
                            :placeholder="item.name + (item.description ? ' — ' + item.description : '')"
                            :copy="item.name"
                        />
                    </template>
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"
import { lfiCategories, lfiCategoryMeta, lfiPlatformMeta, getAllPayloads } from "./payloads"
import type { LfiPayload, LfiCategory } from "./payloads"

/** 分类下拉选项 */
const categoryOptions = [
    { value: "all", label: "All" },
    ...lfiCategoryMeta.map(c => ({
        value: c.id,
        label: c.name,
    })),
]

/** 平台下拉选项 */
const platformOptions = lfiPlatformMeta.map(p => ({
    value: p.id,
    label: p.name,
}))

const action = useAction(await initialize({
    selectedCategory: "all",
    selectedPlatform: "all",
    targetFile: "",
    traversalDepth: "",
    basePath: "",
    search: "",
    bypassOnly: false,
}))

/**
 * 对 Payload 内容应用用户自定义替换：
 * - {FILE} → 用户指定的目标文件
 * - {USER} → 占位符保留（提示用户手动替换）
 * - 若配置了自定义基础路径，在路径穿越型 Payload 前追加
 */
const applyCustomization = (payload: string): string => {
    let result = payload
    if (action.current.targetFile) {
        result = result.replace(/\{FILE\}/g, action.current.targetFile)
    }
    if (action.current.basePath) {
        result = action.current.basePath + result
    }
    return result
}

/** 关键词匹配 */
const matchesSearch = (item: LfiPayload, keyword: string): boolean => {
    if (!keyword) return true
    const lower = keyword.toLowerCase()
    return (
        item.name.toLowerCase().includes(lower)
        || item.payload.toLowerCase().includes(lower)
        || (item.description || "").toLowerCase().includes(lower)
    )
}

/** 判断穿越深度是否匹配（仅对 path_traversal 分类的自动生成 Payload 生效） */
const matchesDepth = (item: LfiPayload): boolean => {
    if (!action.current.traversalDepth || item.category !== "path_traversal") return true
    const depth = parseInt(action.current.traversalDepth, 10)
    if (isNaN(depth) || depth <= 0) return true
    const match = item.payload.match(/\.\.\//g)
    if (!match) return true
    return match.length <= depth
}

/** 过滤后的 Payload 扁平列表（用于计数） */
const filteredPayloads = $computed((): LfiPayload[] => {
    const all = getAllPayloads()
    return all.filter(item => {
        if (action.current.selectedCategory !== "all" && item.category !== action.current.selectedCategory) return false
        if (action.current.selectedPlatform !== "all" && item.platform !== "all" && item.platform !== action.current.selectedPlatform) return false
        if (action.current.bypassOnly && !item.bypass) return false
        if (!matchesDepth(item)) return false
        return matchesSearch(item, action.current.search)
    })
})

/** 过滤后的分类（保留分类结构用于展示） */
const filteredCategories = $computed((): LfiCategory[] => {
    return lfiCategories
        .map(cat => {
            const payloads = cat.payloads.filter(item => {
                if (action.current.selectedCategory !== "all" && item.category !== action.current.selectedCategory) return false
                if (action.current.selectedPlatform !== "all" && item.platform !== "all" && item.platform !== action.current.selectedPlatform) return false
                if (action.current.bypassOnly && !item.bypass) return false
                if (!matchesDepth(item)) return false
                return matchesSearch(item, action.current.search)
            })
            return { ...cat, payloads }
        })
        .filter(cat => cat.payloads.length > 0)
})
</script>

<style scoped>
.sectool-lfi-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-lfi-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}
</style>
