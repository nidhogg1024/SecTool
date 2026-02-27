<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 工具选择 -->
                    <Select
                        v-model="action.current.selectedTool"
                        :label="$t('cheatsheet_tool')"
                        :options="toolOptions"
                    />
                    <!-- 分区选择（根据所选工具动态变化） -->
                    <Select
                        v-model="action.current.selectedSection"
                        :label="$t('cheatsheet_section')"
                        :options="sectionOptions"
                    />
                    <!-- 搜索框 -->
                    <Input
                        v-model="action.current.search"
                        :label="$t('cheatsheet_search')"
                        :placeholder="$t('cheatsheet_search_placeholder')"
                    />
                </Align>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <template v-if="filteredSections.length > 0">
                    <!-- 结果统计 -->
                    <div class="sectool-cheat-result-count">
                        {{ $t('cheatsheet_result_count', [totalEntries]) }}
                    </div>
                    <!-- 按 section 分组显示 -->
                    <template v-for="section in filteredSections" :key="section.id">
                        <div class="sectool-cheat-section-title">{{ section.name }}</div>
                        <template v-for="entry in section.entries" :key="entry.id">
                            <Textarea
                                :model-value="entry.command"
                                :height="entry.command.includes('\n') ? 42 + entry.command.split('\n').length * 16 : 52"
                                :placeholder="entry.name + ' — ' + entry.description"
                                :copy="entry.name"
                            />
                        </template>
                    </template>
                </template>
                <template v-else>
                    <div class="sectool-cheat-empty">{{ $t('cheatsheet_empty') }}</div>
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"
import { cheatsheetData } from "./data"
import type { CheatsheetSection } from "./data"
import { watch } from "vue"

// ================ 工具下拉选项 ================ //

const toolOptions = cheatsheetData.map(tool => ({
    value: tool.id,
    label: `${tool.icon || ""} ${tool.name}`.trim(),
}))

// ================ 状态初始化 ================ //

const action = useAction(await initialize({
    selectedTool: cheatsheetData[0]?.id || "",
    selectedSection: "_all",
    search: "",
}))

// ================ 当前工具对象 ================ //

const currentTool = $computed(() => {
    return cheatsheetData.find(t => t.id === action.current.selectedTool) || cheatsheetData[0]
})

// ================ 分区下拉选项（包含「全部」选项） ================ //

const sectionOptions = $computed(() => {
    const sections = currentTool?.sections || []
    return [
        { value: "_all", label: "📋 全部 / All" },
        ...sections.map(s => ({ value: s.id, label: s.name })),
    ]
})

// ================ 切换工具时重置分区选择 ================ //

watch(() => action.current.selectedTool, () => {
    action.current.selectedSection = "_all"
    action.current.search = ""
})

// ================ 搜索过滤逻辑 ================ //

const filteredSections = $computed(() => {
    if (!currentTool) return []

    const keyword = (action.current.search || "").toLowerCase().trim()
    const sectionId = action.current.selectedSection

    // 先按 section 过滤
    let sections: CheatsheetSection[] = sectionId === "_all"
        ? currentTool.sections
        : currentTool.sections.filter(s => s.id === sectionId)

    // 无搜索关键词时直接返回
    if (!keyword) return sections

    // 按关键词过滤条目（匹配 name / command / description / tags）
    return sections
        .map(section => ({
            ...section,
            entries: section.entries.filter(entry =>
                entry.name.toLowerCase().includes(keyword)
                || entry.command.toLowerCase().includes(keyword)
                || entry.description.toLowerCase().includes(keyword)
                || entry.descriptionEn.toLowerCase().includes(keyword)
                || entry.tags.some(tag => tag.toLowerCase().includes(keyword))
            ),
        }))
        .filter(section => section.entries.length > 0)
})

// ================ 计算匹配条目总数 ================ //

const totalEntries = $computed(() => {
    return filteredSections.reduce((sum, s) => sum + s.entries.length, 0)
})
</script>

<style scoped>
.sectool-cheat-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 8px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-cheat-result-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}

.sectool-cheat-empty {
    font-size: 12px;
    color: var(--sectool-text-tertiary);
    text-align: center;
    padding: 40px 0;
}
</style>
