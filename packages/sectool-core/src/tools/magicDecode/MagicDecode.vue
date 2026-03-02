<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <HeightResize v-slot="{ height }" :reduce="5">
                    <Textarea
                        v-model="action.current.input"
                        :height="height"
                        :placeholder="$t('magicDecode_input')"
                    />
                </HeightResize>
                <template #extra>
                    <Button size="small" @click="runDetect">
                        {{ $t("magicDecode_detect") }}
                    </Button>
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <!-- 无结果 -->
                <div v-if="!hasInput" class="sectool-magic-hint">
                    {{ $t("magicDecode_input") }}
                </div>
                <div v-else-if="results.length === 0" class="sectool-magic-no-result">
                    {{ $t("magicDecode_no_result") }}
                </div>

                <!-- 解码结果卡片 -->
                <template v-else v-for="(r, idx) in results" :key="idx">
                    <div class="sectool-magic-card">
                        <div class="sectool-magic-header">
                            <span class="sectool-magic-encoding">{{ r.encoding }}</span>
                            <span
                                :class="['sectool-magic-confidence', `sectool-magic-confidence-${r.confidence}`]"
                            >
                                {{ confidenceLabel(r.confidence) }}
                            </span>
                        </div>
                        <div v-if="r.chain" class="sectool-magic-chain">{{ $t("magicDecode_chain") }}: {{ r.chain }}</div>
                        <Textarea
                            :model-value="r.decoded"
                            :height="Math.min(80, Math.max(40, r.decoded.split('\n').length * 22 + 12))"
                            :placeholder="$t('magicDecode_decoded')"
                            :copy="!!r.decoded"
                        />
                    </div>
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import { watch } from "vue"
import { useAction, initialize } from "@/store/action"
import { autoDetectAndDecode } from "./engine"
import type { DecodeResult } from "./engine"

const action = useAction(await initialize({
    input: "",
}))

// 是否有输入内容
const hasInput = $computed(() => action.current.input.trim().length > 0)

// 解码结果
let results = $ref<DecodeResult[]>([])

// 执行自动检测
function runDetect() {
    const input = action.current.input.trim()
    if (!input) {
        results = []
        return
    }
    results = autoDetectAndDecode(input)
    action.save()
}

// 输入变化时自动检测（防抖由用户输入自然节奏控制，此处简单响应）
watch(
    () => action.current.input,
    (val) => {
        if (val.trim()) runDetect()
        else results = []
    },
    { immediate: true },
)

// 置信度文案
function confidenceLabel(c: "high" | "medium" | "low"): string {
    const map: Record<string, string> = {
        high: $t("magicDecode_high"),
        medium: $t("magicDecode_medium"),
        low: $t("magicDecode_low"),
    }
    return map[c] || c
}
</script>

<style scoped>
.sectool-magic-hint {
    font-size: 13px;
    color: var(--sectool-text-secondary);
    text-align: center;
    padding: 40px 16px;
}

.sectool-magic-no-result {
    font-size: 13px;
    color: var(--sectool-text-secondary);
    text-align: center;
    padding: 30px 16px;
}

.sectool-magic-card {
    margin-bottom: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--sectool-bg-secondary, rgba(0, 0, 0, 0.03));
    border: 1px solid var(--sectool-border, rgba(0, 0, 0, 0.08));
}

.sectool-magic-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
    padding: 0 4px;
}

.sectool-magic-encoding {
    font-size: 13px;
    font-weight: 600;
    color: var(--sectool-text-default);
}

.sectool-magic-confidence {
    font-size: 11px;
    padding: 1px 8px;
    border-radius: 3px;
    font-weight: 500;
}

.sectool-magic-confidence-high {
    background: rgba(82, 196, 26, 0.15);
    color: #52c41a;
}

.sectool-magic-confidence-medium {
    background: rgba(250, 173, 20, 0.15);
    color: #faad14;
}

.sectool-magic-confidence-low {
    background: rgba(255, 77, 79, 0.12);
    color: #ff4d4f;
}

.sectool-magic-chain {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin-bottom: 4px;
    padding: 0 4px;
}
</style>
