<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <Select
                        v-model="action.current.selectedCategory"
                        :label="$t('xxe_category')"
                        :options="categoryOptions"
                    />
                    <Input
                        v-model="action.current.targetFile"
                        :label="$t('xxe_target_file')"
                        :placeholder="$t('xxe_target_file_placeholder')"
                    />
                    <Input
                        v-model="action.current.attackerUrl"
                        :label="$t('xxe_attacker_url')"
                        :placeholder="$t('xxe_attacker_url_placeholder')"
                    />
                    <Input
                        v-model="action.current.search"
                        :label="$t('xxe_search')"
                        :placeholder="$t('xxe_search_placeholder')"
                    />
                </Align>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <div class="sectool-xxe-count">{{ $t('xxe_payload_count', [totalCount]) }}</div>
                <template v-for="category in filteredCategories" :key="category.id">
                    <div class="sectool-xxe-section-title">{{ category.name }}</div>
                    <template v-for="item in category.payloads" :key="item.id">
                        <Textarea
                            :model-value="applyReplacements(item.payload)"
                            :height="80"
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
import { xxeCategories, replaceXxePlaceholders } from "./payloads"
import type { XxePayload, XxeCategory } from "./payloads"

/** 分类下拉选项（包含"全部"） */
const categoryOptions = [
    { value: "all", label: "All" },
    ...xxeCategories.map(c => ({
        value: c.id,
        label: c.name,
    })),
]

const action = useAction(await initialize({
    selectedCategory: "all",
    targetFile: "/etc/passwd",
    attackerUrl: "http://attacker.com",
    search: "",
}))

/** 将 payload 中的占位符替换为用户输入的实际值 */
const applyReplacements = (payload: string): string => {
    return replaceXxePlaceholders(
        payload,
        action.current.targetFile,
        action.current.attackerUrl,
    )
}

/** 搜索匹配（不区分大小写） */
const matchesSearch = (item: XxePayload, keyword: string): boolean => {
    if (!keyword) return true
    const lower = keyword.toLowerCase()
    return (
        item.name.toLowerCase().includes(lower)
        || item.payload.toLowerCase().includes(lower)
        || (item.description || "").toLowerCase().includes(lower)
    )
}

/** 根据分类和搜索过滤后的分类列表 */
const filteredCategories = $computed((): XxeCategory[] => {
    return xxeCategories
        .map(cat => {
            const payloads = cat.payloads.filter(item => {
                if (action.current.selectedCategory !== "all" && item.category !== action.current.selectedCategory) {
                    return false
                }
                return matchesSearch(item, action.current.search)
            })
            return { ...cat, payloads }
        })
        .filter(cat => cat.payloads.length > 0)
})

/** 过滤后的 payload 总数 */
const totalCount = $computed(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.payloads.length, 0)
})
</script>

<style scoped>
.sectool-xxe-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-xxe-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}
</style>
