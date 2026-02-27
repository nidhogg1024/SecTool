<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 分类选择器 -->
                    <Select
                        v-model="action.current.selectedCategory"
                        :label="$t('ssrf_category')"
                        :options="categoryOptions"
                    />
                    <!-- 目标 URL / 内网 IP（用于替换占位符） -->
                    <Input
                        v-model="action.current.targetUrl"
                        :label="$t('ssrf_target_url')"
                        :placeholder="$t('ssrf_target_url_placeholder')"
                    />
                    <!-- 搜索框 -->
                    <Input
                        v-model="action.current.search"
                        :label="$t('ssrf_search')"
                        :placeholder="$t('ssrf_search_placeholder')"
                    />
                </Align>
                <template #extra>
                    <Align>
                        <!-- 仅显示绕过型 Payload -->
                        <Bool
                            size="small"
                            v-model="action.current.bypassOnly"
                            border
                            :label="$t('ssrf_bypass_only')"
                        />
                    </Align>
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <div class="sectool-ssrf-count">{{ $t('ssrf_payload_count', [filteredPayloads.length]) }}</div>
                <template v-for="category in filteredCategories" :key="category.id">
                    <div class="sectool-ssrf-section-title">{{ category.name }}</div>
                    <template v-for="item in category.payloads" :key="item.id">
                        <Textarea
                            :model-value="item.payload"
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
import { ssrfCategories, ssrfCategoryMeta, getAllPayloads } from "./payloads"
import type { SsrfPayload, SsrfCategory } from "./payloads"

/** 分类下拉选项 */
const categoryOptions = [
    { value: "all", label: "All" },
    ...ssrfCategoryMeta.map(c => ({
        value: c.id,
        label: c.name,
    })),
]

const action = useAction(await initialize({
    selectedCategory: "all",
    targetUrl: "",
    search: "",
    bypassOnly: false,
}))

/** 关键词匹配（不区分大小写） */
const matchesSearch = (item: SsrfPayload, keyword: string): boolean => {
    if (!keyword) return true
    const lower = keyword.toLowerCase()
    return (
        item.name.toLowerCase().includes(lower)
        || item.payload.toLowerCase().includes(lower)
        || (item.description || "").toLowerCase().includes(lower)
    )
}

/** 过滤后的 Payload 扁平列表（用于计数显示） */
const filteredPayloads = $computed((): SsrfPayload[] => {
    const all = getAllPayloads()
    return all.filter(item => {
        if (action.current.selectedCategory !== "all" && item.category !== action.current.selectedCategory) return false
        if (action.current.bypassOnly && !item.bypass) return false
        return matchesSearch(item, action.current.search)
    })
})

/** 过滤后保留分类结构的列表 */
const filteredCategories = $computed((): SsrfCategory[] => {
    return ssrfCategories
        .map(cat => {
            const payloads = cat.payloads.filter(item => {
                if (action.current.selectedCategory !== "all" && item.category !== action.current.selectedCategory) return false
                if (action.current.bypassOnly && !item.bypass) return false
                return matchesSearch(item, action.current.search)
            })
            return { ...cat, payloads }
        })
        .filter(cat => cat.payloads.length > 0)
})
</script>

<style scoped>
.sectool-ssrf-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-ssrf-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}
</style>
