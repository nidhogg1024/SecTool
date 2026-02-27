<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 分类选择 -->
                    <Select
                        v-model="action.current.selectedCategory"
                        :label="$t('cmdInjection_category')"
                        :options="categoryOptions"
                    />
                    <!-- 平台选择 -->
                    <Select
                        v-model="action.current.selectedPlatform"
                        :label="$t('cmdInjection_platform')"
                        :options="platformOptions"
                    />
                    <!-- 自定义注入命令 -->
                    <Input
                        v-model="action.current.customCmd"
                        :label="$t('cmdInjection_custom_cmd')"
                        :placeholder="$t('cmdInjection_custom_cmd_placeholder')"
                    />
                    <!-- 搜索 -->
                    <Input
                        v-model="action.current.search"
                        :label="$t('cmdInjection_search')"
                        :placeholder="$t('cmdInjection_search_placeholder')"
                    />
                </Align>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <div class="sectool-cmd-count">{{ $t('cmdInjection_payload_count', [filteredPayloads.length]) }}</div>
                <template v-for="category in filteredCategories" :key="category.id">
                    <div class="sectool-cmd-section-title">{{ category.name }}</div>
                    <template v-for="item in category.payloads" :key="item.id">
                        <Textarea
                            :model-value="renderPayload(item.payload, action.current.customCmd || 'id')"
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
import { cmdCategories, renderPayload } from "./payloads"
import type { CmdPayload, CmdCategory } from "./payloads"

// ================ 下拉选项 ================ //

const categoryOptions = [
    { value: "all", label: $t("cmdInjection_category_all") },
    ...cmdCategories.map(c => ({
        value: c.id,
        label: c.name,
    })),
]

const platformOptions = [
    { value: "all", label: $t("cmdInjection_platform_all") },
    { value: "linux", label: "Linux" },
    { value: "windows", label: "Windows" },
]

// ================ 状态初始化 ================ //

const action = useAction(await initialize({
    selectedCategory: "all",
    selectedPlatform: "all",
    customCmd: "id",
    search: "",
}))

// ================ 搜索匹配 ================ //

const matchesSearch = (item: CmdPayload, keyword: string): boolean => {
    if (!keyword) return true
    const lower = keyword.toLowerCase()
    return (
        item.name.toLowerCase().includes(lower)
        || item.payload.toLowerCase().includes(lower)
        || (item.description || "").toLowerCase().includes(lower)
    )
}

// ================ 过滤后的 payload 扁平列表（用于计数） ================ //

const filteredPayloads = $computed((): CmdPayload[] => {
    return cmdCategories.flatMap(cat => cat.payloads).filter(item => {
        if (action.current.selectedCategory !== "all" && item.category !== action.current.selectedCategory) {
            return false
        }
        if (action.current.selectedPlatform !== "all" && item.platform !== "all" && item.platform !== action.current.selectedPlatform) {
            return false
        }
        return matchesSearch(item, action.current.search)
    })
})

// ================ 过滤后的分类列表（保留分类分组结构） ================ //

const filteredCategories = $computed((): CmdCategory[] => {
    return cmdCategories
        .map(cat => {
            const payloads = cat.payloads.filter(item => {
                if (action.current.selectedCategory !== "all" && item.category !== action.current.selectedCategory) {
                    return false
                }
                if (action.current.selectedPlatform !== "all" && item.platform !== "all" && item.platform !== action.current.selectedPlatform) {
                    return false
                }
                return matchesSearch(item, action.current.search)
            })
            return { ...cat, payloads }
        })
        .filter(cat => cat.payloads.length > 0)
})
</script>

<style scoped>
.sectool-cmd-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-cmd-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}
</style>
