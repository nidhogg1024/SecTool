<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 密码输入 -->
                    <Input
                        v-model="action.current.password"
                        :label="$t('ntlmHash_password')"
                        :placeholder="$t('ntlmHash_password')"
                    />
                </Align>
                <template #extra>
                    <Button type="primary" size="small" :text="$t('ntlmHash_generate')" @click="handleGenerate" />
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <!-- 空输入提示 -->
                <div v-if="!action.current.password && !ntlmHash" class="sectool-ntlm-empty">
                    {{ $t('ntlmHash_empty') }}
                </div>
                <!-- NTLM 哈希结果 -->
                <template v-else-if="ntlmHash">
                    <div class="sectool-ntlm-section-title">{{ $t('ntlmHash_ntlm') }}</div>
                    <Textarea
                        :model-value="ntlmHash"
                        :height="42"
                        :placeholder="$t('ntlmHash_ntlm')"
                        :copy="$t('ntlmHash_ntlm')"
                    />
                    <!-- LM 哈希说明（LM 需 DES 实现，浏览器端复杂，仅展示说明） -->
                    <div class="sectool-ntlm-section-title" style="margin-top: 10px">{{ $t('ntlmHash_lm') }}</div>
                    <div class="sectool-ntlm-note">{{ $t('ntlmHash_lm_note') }}</div>
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
/**
 * NTLM/LM 哈希生成器
 * NTLM = MD4(UTF-16LE(password))，复用 hashIdentify 的 generateNTLM
 * LM 哈希已弃用，需 DES 实现，浏览器端暂不实现
 */
import { useAction, initialize } from "@/store/action"
import { generateNTLM } from "@/tools/hashIdentify/identifier"
import { computed } from "vue"

const action = useAction(
    await initialize({
        password: "",
    })
)

// 响应式计算 NTLM 哈希
const ntlmHash = computed(() => {
    const pwd = action.current.password
    if (!pwd) return ""
    try {
        return generateNTLM(pwd)
    } catch {
        return ""
    }
})

const handleGenerate = () => {
    // 已有响应式计算，点击仅触发重新渲染（如有需要可扩展）
    action.save()
}
</script>

<style scoped>
.sectool-ntlm-empty {
    font-size: 13px;
    color: var(--sectool-text-secondary);
    text-align: center;
    padding: 24px 12px;
}

.sectool-ntlm-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-ntlm-note {
    font-size: 12px;
    color: var(--sectool-text-secondary);
    padding: 8px 10px;
    background: var(--sectool-bg-secondary, rgba(255, 255, 255, 0.04));
    border-radius: 6px;
    border: 1px solid var(--sectool-border, rgba(255, 255, 255, 0.08));
    line-height: 1.5;
}
</style>
