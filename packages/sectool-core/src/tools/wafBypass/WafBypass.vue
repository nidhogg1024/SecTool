<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 原始 Payload 输入 -->
                    <Textarea
                        v-model="action.current.input"
                        :height="80"
                        :label="$t('wafBypass_input')"
                        :placeholder="$t('wafBypass_input_placeholder')"
                    />
                </Align>
                <template #extra>
                    <Align>
                        <!-- 全选/取消全选 -->
                        <Bool
                            size="small"
                            v-model="action.current.selectAll"
                            border
                            :label="$t('wafBypass_select_all')"
                            @change="onSelectAllChange"
                        />
                    </Align>
                </template>
            </Display>
            <!-- 技术选择区域 -->
            <Display>
                <Align direction="vertical">
                    <div class="sectool-waf-technique-grid">
                        <Bool
                            v-for="tech in allTechniques"
                            :key="tech.id"
                            size="small"
                            v-model="action.current.techniques[tech.id]"
                            border
                            :label="tech.name"
                        />
                    </div>
                </Align>
                <template #extra>
                    <Align>
                        <Button
                            :label="$t('wafBypass_generate')"
                            @click="onGenerate"
                        />
                    </Align>
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <template v-if="results.length > 0">
                    <div class="sectool-waf-result-count">
                        {{ $t('wafBypass_result_count', [totalVariants]) }}
                    </div>
                    <template v-for="item in results" :key="item.technique">
                        <div class="sectool-waf-section-title">{{ getTechniqueName(item.technique) }}</div>
                        <template v-for="(variant, idx) in item.results" :key="item.technique + '-' + idx">
                            <Textarea
                                :model-value="variant"
                                :height="42"
                                :copy="getTechniqueName(item.technique) + ' #' + (idx + 1)"
                            />
                        </template>
                    </template>
                </template>
                <template v-else>
                    <div class="sectool-waf-empty">{{ $t('wafBypass_empty_hint') }}</div>
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"
import { techniques, generateBypasses } from "./engine"
import type { BypassResult } from "./engine"
import { reactive } from "vue"

// ================ 所有可用技术列表 ================ //

const allTechniques = techniques

// ================ 初始化技术选择状态（默认全选） ================ //

const defaultTechniques: Record<string, boolean> = {}
for (const tech of allTechniques) {
    defaultTechniques[tech.id] = true
}

// ================ 状态初始化 ================ //

const action = useAction(await initialize({
    input: "",
    selectAll: true,
    techniques: { ...defaultTechniques },
}))

// ================ 生成结果（响应式） ================ //

const results = reactive<BypassResult[]>([])

// ================ 计算变体总数 ================ //

const totalVariants = $computed(() => {
    return results.reduce((sum, r) => sum + r.results.length, 0)
})

// ================ 全选/取消全选 ================ //

const onSelectAllChange = () => {
    const val = action.current.selectAll
    for (const tech of allTechniques) {
        action.current.techniques[tech.id] = val
    }
}

// ================ 获取技术显示名称 ================ //

const getTechniqueName = (techId: string): string => {
    const tech = allTechniques.find(t => t.id === techId)
    return tech ? tech.name : techId
}

// ================ 生成绕过变体 ================ //

const onGenerate = () => {
    const selectedIds = allTechniques
        .filter(t => action.current.techniques[t.id])
        .map(t => t.id)

    const generated = generateBypasses(action.current.input, selectedIds)

    // 清空并重新填充结果数组
    results.length = 0
    results.push(...generated)

    action.save()
}
</script>

<style scoped>
.sectool-waf-technique-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.sectool-waf-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-waf-result-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}

.sectool-waf-empty {
    font-size: 12px;
    color: var(--sectool-text-tertiary);
    text-align: center;
    padding: 40px 0;
}
</style>
