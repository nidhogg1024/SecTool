<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <Select
                        v-model="action.current.selectedContext"
                        :label="$t('xss_context')"
                        :options="contextOptions"
                    />
                    <Input
                        v-model="action.current.search"
                        :label="$t('xss_search')"
                        :placeholder="$t('xss_search_placeholder')"
                    />
                </Align>
                <template #extra>
                    <Align>
                        <Bool
                            size="small"
                            v-model="action.current.wafBypassOnly"
                            border
                            :label="$t('xss_waf_bypass')"
                        />
                    </Align>
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <div class="sectool-xss-count">{{ $t('xss_payload_count', [filteredPayloads.length]) }}</div>
                <template v-for="category in filteredCategories" :key="category.id">
                    <div class="sectool-xss-section-title">{{ category.name }}</div>
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
import { xssCategories, xssContexts, getAllPayloads } from "./payloads"
import type { XssPayload, XssCategory } from "./payloads"

const contextOptions = [
    { value: "all", label: "All" },
    ...xssContexts.map(c => ({
        value: c.id,
        label: c.name,
    })),
]

const action = useAction(await initialize({
    selectedContext: "all",
    search: "",
    wafBypassOnly: false,
}))

const matchesSearch = (item: XssPayload, keyword: string): boolean => {
    if (!keyword) return true
    const lower = keyword.toLowerCase()
    return (
        item.name.toLowerCase().includes(lower) ||
        item.payload.toLowerCase().includes(lower) ||
        item.tags.some(t => t.toLowerCase().includes(lower)) ||
        (item.description || "").toLowerCase().includes(lower)
    )
}

const filteredPayloads = $computed((): XssPayload[] => {
    const all = getAllPayloads()
    return all.filter(item => {
        if (action.current.selectedContext !== "all" && item.context !== action.current.selectedContext) {
            return false
        }
        if (action.current.wafBypassOnly && !item.wafBypass) {
            return false
        }
        return matchesSearch(item, action.current.search)
    })
})

const filteredCategories = $computed((): XssCategory[] => {
    return xssCategories
        .map(cat => {
            const payloads = cat.payloads.filter(item => {
                if (action.current.selectedContext !== "all" && item.context !== action.current.selectedContext) {
                    return false
                }
                if (action.current.wafBypassOnly && !item.wafBypass) {
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
.sectool-xss-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-xss-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}
</style>
