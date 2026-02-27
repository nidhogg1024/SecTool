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

                        <!-- Recipe 区域：内置 + 用户自定义 -->
                        <div class="sectool-encode-recipes">
                            <div class="sectool-encode-recipes-header">
                                <span class="sectool-encode-recipes-label">{{ $t('encodeChain_presets') }}</span>
                                <div class="sectool-encode-recipes-actions">
                                    <Button
                                        size="small"
                                        :disabled="action.current.steps.length === 0"
                                        @click="showSaveDialog = true"
                                    >{{ $t('encodeChain_recipe_save') }}</Button>
                                    <Button
                                        size="small"
                                        @click="showImportDialog = true"
                                    >{{ $t('encodeChain_recipe_import') }}</Button>
                                    <Button
                                        v-if="recipeStore.userRecipes.value.length > 0"
                                        size="small"
                                        @click="handleExportAll"
                                    >{{ $t('encodeChain_recipe_export') }}</Button>
                                </div>
                            </div>

                            <!-- 内置 Recipe -->
                            <div class="sectool-encode-recipes-group" v-if="recipeStore.builtinRecipes.value.length > 0">
                                <span class="sectool-encode-recipes-group-label">{{ $t('encodeChain_recipe_builtin') }}</span>
                                <div class="sectool-encode-recipes-chips">
                                    <Tooltip
                                        v-for="recipe in recipeStore.builtinRecipes.value"
                                        :key="recipe.id"
                                        :content="recipe.description || ''"
                                    >
                                        <div
                                            class="sectool-encode-recipe-chip"
                                            @click="applyRecipe(recipe)"
                                        >
                                            <span class="sectool-encode-recipe-chip-text">{{ recipe.name }}</span>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>

                            <!-- 用户 Recipe -->
                            <div class="sectool-encode-recipes-group" v-if="recipeStore.userRecipes.value.length > 0">
                                <span class="sectool-encode-recipes-group-label">{{ $t('encodeChain_recipe_user') }}</span>
                                <div class="sectool-encode-recipes-chips">
                                    <Tooltip
                                        v-for="recipe in recipeStore.userRecipes.value"
                                        :key="recipe.id"
                                        :content="recipe.description || ''"
                                    >
                                        <div
                                            class="sectool-encode-recipe-chip sectool-encode-recipe-chip--user"
                                            @click="applyRecipe(recipe)"
                                        >
                                            <span class="sectool-encode-recipe-chip-text">{{ recipe.name }}</span>
                                            <span
                                                class="sectool-encode-recipe-chip-share"
                                                @click.stop="handleShare(recipe)"
                                                title="Share"
                                            >⚑</span>
                                            <span
                                                class="sectool-encode-recipe-chip-delete"
                                                @click.stop="handleDeleteRecipe(recipe.id)"
                                            >×</span>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
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

    <!-- 保存 Recipe 弹窗 -->
    <Modal
        v-model="showSaveDialog"
        :title="$t('encodeChain_recipe_save')"
        :width="380"
        footer-type="normal"
        @ok="handleSaveRecipe"
    >
        <Align direction="vertical" gap="small">
            <Input
                v-model="saveRecipeName"
                :placeholder="$t('encodeChain_recipe_save_name')"
                size="small"
            />
            <Input
                v-model="saveRecipeDesc"
                :placeholder="$t('encodeChain_recipe_save_desc')"
                size="small"
            />
        </Align>
    </Modal>

    <!-- 分享 Recipe 弹窗 -->
    <Modal
        v-model="showShareDialog"
        :title="$t('encodeChain_recipe_share')"
        :width="450"
        footer-type="none"
    >
        <Align direction="vertical" gap="small">
            <Textarea
                :model-value="shareContent"
                :height="80"
                :copy="!!shareContent"
            />
        </Align>
    </Modal>

    <!-- 导入 Recipe 弹窗 -->
    <Modal
        v-model="showImportDialog"
        :title="$t('encodeChain_recipe_import')"
        :width="450"
        footer-type="normal"
        @ok="handleImportRecipes"
    >
        <Align direction="vertical" gap="small">
            <Textarea
                v-model="importContent"
                :height="120"
                :placeholder="$t('encodeChain_recipe_import_placeholder')"
            />
        </Align>
    </Modal>

    <!-- 导出全部 Recipe 弹窗 -->
    <Modal
        v-model="showExportDialog"
        :title="$t('encodeChain_recipe_export')"
        :width="450"
        footer-type="none"
    >
        <Align direction="vertical" gap="small">
            <Textarea
                :model-value="exportContent"
                :height="200"
                :copy="!!exportContent"
            />
        </Align>
    </Modal>
</template>

<script lang="ts" setup>
import {onMounted} from "vue"
import {useAction, initialize} from "@/store/action"
import {operations, runChain} from "./operations"
import {useRecipes} from "./recipes"
import type {Recipe} from "./recipes"

const action = useAction(await initialize({
    input: "",
    steps: [] as string[],
    showSteps: false,
}))

// ================ Recipe 管理 ================ //

const recipeStore = useRecipes()

let newStepId = $ref(operations[0].id)

// 保存 Recipe 相关状态
let showSaveDialog = $ref(false)
let saveRecipeName = $ref("")
let saveRecipeDesc = $ref("")

// 分享 Recipe 相关状态
let showShareDialog = $ref(false)
let shareContent = $ref("")

// 导入 Recipe 相关状态
let showImportDialog = $ref(false)
let importContent = $ref("")

// 导出全部 Recipe 相关状态
let showExportDialog = $ref(false)
let exportContent = $ref("")

// ================ 操作选项 ================ //

const operationOptions = operations.map(op => ({
    value: op.id,
    label: op.name,
}))

// ================ 链式执行 ================ //

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

// ================ Recipe 操作 ================ //

/** 应用 Recipe 到当前编码链 */
const applyRecipe = (recipe: Recipe) => {
    action.current.steps = [...recipe.steps]
}

/** 保存当前编码链为新 Recipe */
const handleSaveRecipe = () => {
    if (!saveRecipeName.trim() || action.current.steps.length === 0) return
    recipeStore.saveRecipe(
        saveRecipeName.trim(),
        action.current.steps,
        saveRecipeDesc.trim() || undefined,
    )
    saveRecipeName = ""
    saveRecipeDesc = ""
    showSaveDialog = false
}

/** 删除用户 Recipe */
const handleDeleteRecipe = (id: string) => {
    recipeStore.deleteRecipe(id)
}

/** 分享 Recipe —— 生成 URL hash 并弹窗展示 */
const handleShare = (recipe: Recipe) => {
    shareContent = recipeStore.getShareUrl(recipe.id)
    showShareDialog = true
}

/** 导出全部用户 Recipe 为 JSON */
const handleExportAll = () => {
    exportContent = recipeStore.exportAllRecipes()
    showExportDialog = true
}

/** 从 JSON 或 hash 导入 Recipe */
const handleImportRecipes = () => {
    const text = importContent.trim()
    if (!text) return

    // 尝试判断是 hash 还是 JSON 格式
    if (text.startsWith("[")) {
        // JSON 数组格式：批量导入
        recipeStore.importRecipes(text)
    } else {
        // 单条 base64 hash 导入
        const hash = text.replace(/^.*#recipe=/, "")
        recipeStore.importRecipeFromHash(hash)
    }
    importContent = ""
    showImportDialog = false
}

// ================ 步骤操作 ================ //

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

// ================ 挂载时检查 URL hash 自动导入 ================ //

onMounted(() => {
    const hash = window.location.hash
    if (hash.includes("recipe=")) {
        const recipeHash = hash.replace(/^#.*recipe=/, "")
        if (recipeHash) {
            const imported = recipeStore.importRecipeFromHash(recipeHash)
            if (imported) {
                // 自动应用导入的 Recipe
                action.current.steps = [...imported.steps]
                // 清除 hash，避免重复导入
                history.replaceState(null, "", window.location.pathname + window.location.search)
            }
        }
    }
})
</script>

<style scoped>
.sectool-encode-recipes {
    margin: 4px 0;
}
.sectool-encode-recipes-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 4px;
}
.sectool-encode-recipes-label {
    font-size: 12px;
    color: var(--sectool-text-secondary);
    white-space: nowrap;
}
.sectool-encode-recipes-actions {
    display: flex;
    gap: 4px;
}
.sectool-encode-recipes-group {
    margin: 4px 0;
}
.sectool-encode-recipes-group-label {
    font-size: 11px;
    color: var(--sectool-text-secondary);
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
    display: inline-block;
}
.sectool-encode-recipes-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

/* Recipe 芯片按钮 */
.sectool-encode-recipe-chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 8px;
    font-size: 12px;
    border-radius: 4px;
    cursor: pointer;
    background: var(--sectool-bg-secondary, rgba(0, 0, 0, 0.04));
    border: 1px solid var(--sectool-border-color, rgba(0, 0, 0, 0.08));
    transition: all 0.15s ease;
    user-select: none;
}
.sectool-encode-recipe-chip:hover {
    background: var(--sectool-primary-bg, rgba(24, 144, 255, 0.08));
    border-color: var(--sectool-primary-color, #1890ff);
}
.sectool-encode-recipe-chip-text {
    white-space: nowrap;
}

/* 用户 Recipe 的删除和分享按钮 */
.sectool-encode-recipe-chip-delete,
.sectool-encode-recipe-chip-share {
    display: none;
    font-size: 14px;
    line-height: 1;
    opacity: 0.5;
    cursor: pointer;
    margin-left: 2px;
}
.sectool-encode-recipe-chip-delete:hover {
    opacity: 1;
    color: var(--sectool-danger, #ff4d4f);
}
.sectool-encode-recipe-chip-share:hover {
    opacity: 1;
    color: var(--sectool-primary-color, #1890ff);
}
.sectool-encode-recipe-chip--user:hover .sectool-encode-recipe-chip-delete,
.sectool-encode-recipe-chip--user:hover .sectool-encode-recipe-chip-share {
    display: inline;
}

/* 原有样式保持不变 */
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
