<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <Input v-model="action.current.hashInput" :label="$t('hashIdentify_input')" :placeholder="$t('hashIdentify_input_placeholder')" />
                    <Input v-model="action.current.ntlmInput" :label="$t('hashIdentify_ntlm_input')" :placeholder="$t('hashIdentify_ntlm_placeholder')" />
                </Align>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <!-- 哈希识别结果 -->
                <template v-if="hashMatches.length > 0">
                    <div class="sectool-hash-section-title">{{ $t('hashIdentify_result_type') }}</div>
                    <template v-for="(match, idx) in hashMatches" :key="idx">
                        <div class="sectool-hash-match-card">
                            <div class="sectool-hash-match-header">
                                <span class="sectool-hash-match-name">{{ match.name }}</span>
                                <span :class="['sectool-hash-confidence', `sectool-hash-confidence-${match.confidence}`]">
                                    {{ confidenceLabel(match.confidence) }}
                                </span>
                            </div>
                            <Textarea
                                v-if="match.hashcat"
                                :model-value="hashcatCmd(match)"
                                :height="36"
                                :placeholder="`${$t('hashIdentify_hashcat_cmd')} (${match.name})`"
                                :copy="`Hashcat ${match.name}`"
                            />
                            <Textarea
                                v-if="match.john"
                                :model-value="johnCmd(match)"
                                :height="36"
                                :placeholder="`${$t('hashIdentify_john_cmd')} (${match.name})`"
                                :copy="`John ${match.name}`"
                            />
                        </div>
                    </template>
                </template>
                <!-- 无匹配提示 -->
                <template v-if="action.current.hashInput && hashMatches.length === 0">
                    <div class="sectool-hash-no-match">{{ $t('hashIdentify_no_match') }}</div>
                </template>
                <!-- NTLM 生成结果 -->
                <template v-if="ntlmResult">
                    <div class="sectool-hash-section-title" style="margin-top: 10px">{{ $t('hashIdentify_ntlm_result') }}</div>
                    <Textarea
                        :model-value="ntlmResult"
                        :height="36"
                        :placeholder="$t('hashIdentify_ntlm_result')"
                        copy="NTLM"
                    />
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"
import { identifyHash, generateNTLM } from "./identifier"
import type { HashMatch } from "./identifier"

const action = useAction(await initialize({
    hashInput: "",
    ntlmInput: "",
}))

const hashMatches = $computed((): HashMatch[] => {
    const input = action.current.hashInput.trim()
    if (!input) return []
    return identifyHash(input)
})

const ntlmResult = $computed((): string => {
    const input = action.current.ntlmInput
    if (!input) return ''
    return generateNTLM(input)
})

const hashcatCmd = (match: HashMatch): string => {
    return `hashcat -m ${match.hashcat} hash.txt wordlist.txt`
}

const johnCmd = (match: HashMatch): string => {
    return `john --format=${match.john} hash.txt`
}

const confidenceLabel = (level: 'high' | 'medium' | 'low'): string => {
    const map: Record<string, string> = {
        high: $t('hashIdentify_confidence_high'),
        medium: $t('hashIdentify_confidence_medium'),
        low: $t('hashIdentify_confidence_low'),
    }
    return map[level] || level
}
</script>

<style scoped>
.sectool-hash-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-hash-match-card {
    margin-bottom: 8px;
}

.sectool-hash-match-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
    padding: 0 4px;
}

.sectool-hash-match-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--sectool-text-default);
}

.sectool-hash-confidence {
    font-size: 11px;
    padding: 1px 8px;
    border-radius: 3px;
    font-weight: 500;
}

.sectool-hash-confidence-high {
    background: rgba(82, 196, 26, 0.15);
    color: #52c41a;
}

.sectool-hash-confidence-medium {
    background: rgba(250, 173, 20, 0.15);
    color: #faad14;
}

.sectool-hash-confidence-low {
    background: rgba(255, 77, 79, 0.12);
    color: #ff4d4f;
}

.sectool-hash-no-match {
    font-size: 13px;
    color: var(--sectool-text-secondary);
    text-align: center;
    padding: 20px 0;
}
</style>
