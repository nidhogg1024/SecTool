<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <Select
                        v-model="action.current.selectedDb"
                        :label="$t('sqli_database')"
                        :options="dbOptions"
                    />
                    <Select
                        v-model="action.current.selectedSection"
                        :label="$t('sqli_section')"
                        :options="sectionOptions"
                    />
                    <Input
                        v-model="action.current.search"
                        :label="$t('sqli_search')"
                        :placeholder="$t('sqli_search_placeholder')"
                    />
                </Align>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <template v-for="section in filteredSections" :key="section.id">
                    <div class="sectool-sqli-section-title">{{ section.name }}</div>
                    <template v-for="item in section.payloads" :key="item.id">
                        <Textarea
                            :model-value="item.payload"
                            :height="52"
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
import { sqliDatabases } from "./payloads"
import type { SqliSection, SqliPayload } from "./payloads"

const dbOptions = sqliDatabases.map(db => ({
    value: db.id,
    label: db.name,
}))

const action = useAction(await initialize({
    selectedDb: sqliDatabases[0]?.id || "mysql",
    selectedSection: "all",
    search: "",
}))

/** 当前选中的数据库 */
const currentDb = $computed(() => {
    return sqliDatabases.find(db => db.id === action.current.selectedDb) || sqliDatabases[0]
})

/** section 下拉选项（跟随当前数据库动态生成） */
const sectionOptions = $computed(() => {
    const opts = [{ value: "all", label: $t("sqli_section_all") }]
    if (currentDb) {
        for (const sec of currentDb.sections) {
            opts.push({ value: sec.id, label: sec.name })
        }
    }
    return opts
})

/** 搜索关键词（小写化，方便不区分大小写匹配） */
const searchLower = $computed(() => action.current.search.toLowerCase())

/** 根据 section 和 search 过滤后的结果 */
const filteredSections = $computed((): Array<{ id: string; name: string; payloads: SqliPayload[] }> => {
    if (!currentDb) return []

    const sections: SqliSection[] =
        action.current.selectedSection === "all"
            ? currentDb.sections
            : currentDb.sections.filter(s => s.id === action.current.selectedSection)

    if (!searchLower) return sections

    return sections
        .map(sec => ({
            id: sec.id,
            name: sec.name,
            nameEn: sec.nameEn,
            payloads: sec.payloads.filter(p =>
                p.name.toLowerCase().includes(searchLower)
                || p.payload.toLowerCase().includes(searchLower)
                || (p.description && p.description.toLowerCase().includes(searchLower)),
            ),
        }))
        .filter(sec => sec.payloads.length > 0)
})
</script>

<style scoped>
.sectool-sqli-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
</style>
