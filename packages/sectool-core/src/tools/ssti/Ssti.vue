<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <Select
                        v-model="action.current.selectedEngine"
                        :label="$t('ssti_engine')"
                        :options="engineOptions"
                    />
                    <Select
                        v-model="action.current.selectedPurpose"
                        :label="$t('ssti_purpose')"
                        :options="purposeOptions"
                    />
                    <Input
                        v-model="action.current.search"
                        :label="$t('ssti_search')"
                        :placeholder="$t('ssti_search_placeholder')"
                    />
                </Align>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <div class="sectool-ssti-count">{{ $t('ssti_payload_count', [totalCount]) }}</div>
                <template v-for="engine in filteredEngines" :key="engine.id">
                    <div class="sectool-ssti-section-title">
                        {{ engine.name }}
                        <span class="sectool-ssti-lang">{{ engine.language }}</span>
                    </div>
                    <template v-for="item in engine.payloads" :key="item.id">
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
import { sstiEngines, sstiPurposes } from "./payloads"
import type { SstiPayload, SstiEngine } from "./payloads"

/** 引擎下拉选项（包含"全部"） */
const engineOptions = [
    { value: "all", label: "All" },
    ...sstiEngines.map(e => ({
        value: e.id,
        label: `${e.name} (${e.language})`,
    })),
]

/** 用途下拉选项（包含"全部"） */
const purposeOptions = [
    { value: "all", label: "All" },
    ...sstiPurposes.map(p => ({
        value: p.id,
        label: p.name,
    })),
]

const action = useAction(await initialize({
    selectedEngine: "all",
    selectedPurpose: "all",
    search: "",
}))

/** 搜索匹配（不区分大小写） */
const matchesSearch = (item: SstiPayload, keyword: string): boolean => {
    if (!keyword) return true
    const lower = keyword.toLowerCase()
    return (
        item.name.toLowerCase().includes(lower)
        || item.payload.toLowerCase().includes(lower)
        || item.engine.toLowerCase().includes(lower)
        || (item.description || "").toLowerCase().includes(lower)
    )
}

/** 根据引擎、用途和搜索关键词过滤后的引擎列表 */
const filteredEngines = $computed((): SstiEngine[] => {
    const engines = action.current.selectedEngine === "all"
        ? sstiEngines
        : sstiEngines.filter(e => e.id === action.current.selectedEngine)

    return engines
        .map(eng => {
            const payloads = eng.payloads.filter(item => {
                if (action.current.selectedPurpose !== "all" && item.purpose !== action.current.selectedPurpose) {
                    return false
                }
                return matchesSearch(item, action.current.search)
            })
            return { ...eng, payloads }
        })
        .filter(eng => eng.payloads.length > 0)
})

/** 过滤后的 payload 总数 */
const totalCount = $computed(() => {
    return filteredEngines.reduce((sum, eng) => sum + eng.payloads.length, 0)
})
</script>

<style scoped>
.sectool-ssti-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-ssti-lang {
    font-weight: 400;
    color: var(--sectool-text-tertiary);
    margin-left: 4px;
}

.sectool-ssti-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}
</style>
