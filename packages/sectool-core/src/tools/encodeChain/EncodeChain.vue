<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <HeightResize v-slot="{ height }" :reduce="5">
                    <Align direction="vertical" :style="{ height: height + 'px', overflowY: 'auto' }">
                        <!-- 输入区 -->
                        <Textarea
                            v-model="action.current.input"
                            :height="120"
                            :placeholder="$t('encodeChain_input_placeholder')"
                        />

                        <!-- 预设按钮 -->
                        <div class="sectool-encode-presets">
                            <span class="sectool-encode-presets-label">{{ $t('encodeChain_presets') }}</span>
                            <Button
                                v-for="preset in presetList"
                                :key="preset.id"
                                size="small"
                                @click="applyPreset(preset)"
                            >{{ preset.name }}</Button>
                        </div>

                        <!-- 操作链步骤 -->
                        <div class="sectool-encode-chain">
                            <div
                                v-for="(stepId, idx) in action.current.steps"
                                :key="idx"
                                class="sectool-encode-step"
                            >
                                <span class="sectool-encode-step-num">{{ idx + 1 }}</span>
                                <Select
                                    size="small"
                                    :model-value="stepId"
                                    :options="operationOptions"
                                    @update:model-value="(val: string) => updateStep(idx, val)"
                                />
                                <Button size="small" @click="removeStep(idx)">{{ $t('encodeChain_remove_step') }}</Button>
                            </div>
                        </div>

                        <!-- 添加步骤 -->
                        <div class="sectool-encode-add">
                            <Select
                                size="small"
                                v-model="newStepId"
                                :options="operationOptions"
                            />
                            <Button size="small" @click="addStep">{{ $t('encodeChain_add_step') }}</Button>
                        </div>
                    </Align>
                </HeightResize>
                <template #extra>
                    <Align>
                        <Bool
                            size="small"
                            v-model="action.current.showSteps"
                            border
                            :label="$t('encodeChain_show_steps')"
                        />
                    </Align>
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <!-- 无步骤提示 -->
                <div v-if="action.current.steps.length === 0" class="sectool-encode-empty">
                    {{ $t('encodeChain_no_steps') }}
                </div>

                <template v-else>
                    <!-- 中间步骤结果 -->
                    <template v-if="action.current.showSteps && chainResult.stepResults.length > 0">
                        <div
                            v-for="(result, idx) in chainResult.stepResults"
                            :key="'step-' + idx"
                            class="sectool-encode-step-result"
                        >
                            <div class="sectool-encode-step-title">
                                {{ $t('encodeChain_step_result', [idx + 1]) }} - {{ getOperationName(action.current.steps[idx]) }}
                            </div>
                            <Textarea
                                :model-value="result"
                                :height="60"
                                :copy="!!result"
                            />
                        </div>
                    </template>

                    <!-- 错误信息 -->
                    <div v-if="chainResult.error" class="sectool-encode-error">
                        {{ chainResult.error }}
                    </div>

                    <!-- 最终结果 -->
                    <div class="sectool-encode-final-title">{{ $t('encodeChain_final_result') }}</div>
                    <Textarea
                        :model-value="chainResult.finalResult"
                        :height="120"
                        :copy="!!chainResult.finalResult"
                    />
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import {useAction, initialize} from "@/store/action"
import {operations, presets, runChain} from "./operations"
import type {EncodePreset} from "./operations"

const action = useAction(await initialize({
    input: "",
    steps: [] as string[],
    showSteps: false,
}))

let newStepId = $ref(operations[0].id)

const presetList = presets
const operationOptions = operations.map(op => ({
    value: op.id,
    label: op.name,
}))

const chainResult = $computed(() => {
    if (action.current.input === "" || action.current.steps.length === 0) {
        return {stepResults: [] as string[], finalResult: "", error: undefined}
    }
    const result = runChain(action.current.input, action.current.steps)
    if (!result.error) {
        action.save()
    }
    return result
})

const getOperationName = (id: string): string => {
    const op = operations.find(o => o.id === id)
    return op ? op.name : id
}

const applyPreset = (preset: EncodePreset) => {
    action.current.steps = [...preset.steps]
}

const addStep = () => {
    action.current.steps = [...action.current.steps, newStepId]
}

const removeStep = (index: number) => {
    const next = [...action.current.steps]
    next.splice(index, 1)
    action.current.steps = next
}

const updateStep = (index: number, value: string) => {
    const next = [...action.current.steps]
    next[index] = value
    action.current.steps = next
}
</script>

<style scoped>
.sectool-encode-presets {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin: 4px 0;
}
.sectool-encode-presets-label {
    font-size: 12px;
    color: var(--sectool-text-secondary);
    white-space: nowrap;
}
.sectool-encode-chain {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.sectool-encode-step {
    display: flex;
    align-items: center;
    gap: 6px;
}
.sectool-encode-step-num {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    min-width: 18px;
    text-align: center;
}
.sectool-encode-add {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
}
.sectool-encode-empty {
    font-size: 13px;
    color: var(--sectool-text-secondary);
    text-align: center;
    padding: 40px 0;
}
.sectool-encode-step-result {
    margin-bottom: 6px;
}
.sectool-encode-step-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 4px 0 2px 2px;
}
.sectool-encode-final-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 8px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.sectool-encode-error {
    font-size: 12px;
    color: var(--sectool-danger);
    padding: 4px 8px;
    margin: 4px 0;
    border-radius: 4px;
    background: var(--sectool-danger-bg, rgba(255, 77, 79, 0.08));
}
</style>
