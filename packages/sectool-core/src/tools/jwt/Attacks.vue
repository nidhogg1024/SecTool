<template>
    <div v-row="'10-14'">
        <!-- 左侧面板：输入区 -->
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 攻击类型选择 -->
                    <Select
                        v-model="action.current.attackType"
                        :label="$t('jwt_attack_type')"
                        :options="attackTypeOptions"
                    />
                    <!-- JWT Token 输入（所有攻击类型共用） -->
                    <Textarea
                        v-model="action.current.token"
                        :height="120"
                        :placeholder="$t('jwt_attack_token_placeholder')"
                    />
                    <!-- 弱密钥爆破模式：自定义密钥列表（可选） -->
                    <template v-if="action.current.attackType === 'brute_force'">
                        <Textarea
                            v-model="action.current.customKeys"
                            :height="80"
                            :placeholder="$t('jwt_attack_brute_force_custom_placeholder')"
                        />
                    </template>
                </Align>
                <template #extra>
                    <Button
                        type="primary"
                        :text="$t('main_ui_submit')"
                        :loading="isRunning"
                        @click="executeAttack"
                    />
                </template>
            </Display>
        </Align>

        <!-- 右侧面板：输出区 -->
        <HeightResize v-slot="{ height }">
            <Align direction="vertical" class="sectool-jwt-attacks-output">
                <!-- None 算法攻击：显示修改后的 JWT -->
                <template v-if="action.current.attackType === 'none_algorithm'">
                    <div class="sectool-jwt-attacks-section-title">{{ $t('jwt_attack_none_result') }}</div>
                    <Textarea
                        :model-value="outputResult"
                        :height="Math.max(height - 40, 200)"
                        :placeholder="$t('jwt_attack_result')"
                        copy
                    />
                </template>

                <!-- 弱密钥爆破：状态 + 找到的密钥 -->
                <template v-else-if="action.current.attackType === 'brute_force'">
                    <div class="sectool-jwt-attacks-section-title">{{ $t('jwt_attack_result') }}</div>
                    <!-- 状态指示器 -->
                    <div class="sectool-jwt-attacks-status" :class="bruteForceStatusClass">
                        {{ bruteForceStatusText }}
                    </div>
                    <!-- 进度条（爆破中时显示） -->
                    <div v-if="isRunning || bruteForceProgress.total > 0" class="sectool-jwt-attacks-progress">
                        <div class="sectool-jwt-attacks-progress-bar" :style="{ width: progressPercent + '%' }" />
                        <span class="sectool-jwt-attacks-progress-text">
                            {{ bruteForceProgress.tried }} / {{ bruteForceProgress.total }}
                        </span>
                    </div>
                    <!-- 找到的密钥展示 -->
                    <Textarea
                        :model-value="outputResult"
                        :height="Math.max(height - 120, 150)"
                        :placeholder="$t('jwt_attack_result')"
                        :copy="outputResult ? 'key' : undefined"
                    />
                </template>

                <!-- RS256→HS256：攻击说明文本 -->
                <template v-else-if="action.current.attackType === 'rs256_hs256'">
                    <div class="sectool-jwt-attacks-section-title">{{ $t('jwt_attack_description') }}</div>
                    <Textarea
                        :model-value="rs256Description"
                        :height="Math.max(height - 40, 400)"
                        readonly
                    />
                </template>

                <!-- JKU 注入：攻击说明文本 -->
                <template v-else-if="action.current.attackType === 'jku_injection'">
                    <div class="sectool-jwt-attacks-section-title">{{ $t('jwt_attack_description') }}</div>
                    <Textarea
                        :model-value="jkuDescription"
                        :height="Math.max(height - 40, 400)"
                        readonly
                    />
                </template>
            </Align>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import { initialize, useAction } from "@/store/action";
import {
    noneAlgorithmAttack,
    commonWeakKeys,
    tryVerifyWithKey,
    rs256ToHs256Description,
    jkuInjectionDescription,
} from "./attacks";

/** 攻击类型选项（使用 computed 以支持语言切换） */
const attackTypeOptions = $computed(() => [
    { value: "none_algorithm", label: $t("jwt_attack_none_alg") },
    { value: "brute_force", label: $t("jwt_attack_brute_force") },
    { value: "rs256_hs256", label: $t("jwt_attack_rs256_hs256") },
    { value: "jku_injection", label: $t("jwt_attack_jku_injection") },
]);

const action = useAction(
    await initialize(
        {
            attackType: "none_algorithm" as AttackType,
            token: "",
            customKeys: "",
        },
        { paste: false },
    ),
);

/** 攻击类型 */
type AttackType = "none_algorithm" | "brute_force" | "rs256_hs256" | "jku_injection";

/** 是否正在执行（爆破中） */
let isRunning = $ref(false);

/** 输出结果（None 算法修改后的 token / 爆破找到的密钥） */
let outputResult = $ref("");

/** 爆破进度 */
let bruteForceProgress = $ref({ tried: 0, total: 0 });

/** RS256→HS256 说明文本（静态，仅首次计算） */
const rs256Description = rs256ToHs256Description();

/** JKU 注入说明文本（静态，仅首次计算） */
const jkuDescription = jkuInjectionDescription();

/** 爆破状态样式类 */
const bruteForceStatusClass = $computed(() => {
    if (isRunning) return "sectool-jwt-attacks-status--running";
    if (outputResult) return "sectool-jwt-attacks-status--found";
    return "sectool-jwt-attacks-status--idle";
});

/** 爆破状态文本 */
const bruteForceStatusText = $computed(() => {
    if (isRunning) {
        return $t("jwt_attack_brute_force_running", [bruteForceProgress.total]);
    }
    if (outputResult) {
        return $t("jwt_attack_brute_force_found", [outputResult]);
    }
    if (bruteForceProgress.total > 0) {
        return $t("jwt_attack_brute_force_not_found", [bruteForceProgress.tried]);
    }
    return "";
});

/** 进度百分比 */
const progressPercent = $computed(() => {
    if (bruteForceProgress.total <= 0) return 0;
    return Math.round((bruteForceProgress.tried / bruteForceProgress.total) * 100);
});

/** 每批尝试的密钥数量（避免 UI 卡顿） */
const BATCH_SIZE = 10;

/**
 * 执行攻击
 */
async function executeAttack() {
    const token = action.current.token.trim();
    const attackType = action.current.attackType as AttackType;

    outputResult = "";
    bruteForceProgress = { tried: 0, total: 0 };

    if (!token && attackType !== "rs256_hs256" && attackType !== "jku_injection") {
        return;
    }

    switch (attackType) {
        case "none_algorithm": {
            try {
                outputResult = noneAlgorithmAttack(token);
                action.save();
            } catch (e) {
                outputResult = $error(e);
            }
            break;
        }

        case "brute_force": {
            if (!token) return;
            isRunning = true;

            // 合并内置弱密钥 + 用户自定义密钥
            const customKeysList = action.current.customKeys
                .split("\n")
                .map((k) => k.trim())
                .filter(Boolean);
            const allKeys = [...commonWeakKeys, ...customKeysList];
            bruteForceProgress = { tried: 0, total: allKeys.length };

            for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
                const batch = allKeys.slice(i, i + BATCH_SIZE);
                for (const key of batch) {
                    const found = await tryVerifyWithKey(token, key);
                    bruteForceProgress = { tried: bruteForceProgress.tried + 1, total: allKeys.length };
                    if (found) {
                        outputResult = key;
                        isRunning = false;
                        action.save();
                        return;
                    }
                }
                // 每批结束后让出主线程，保持 UI 响应
                await new Promise((r) => setTimeout(r, 0));
            }

            isRunning = false;
            action.save();
            break;
        }

        case "rs256_hs256":
        case "jku_injection":
            // 说明类攻击无需 token，右侧已显示说明文本
            break;
    }
}
</script>

<style scoped>
.sectool-jwt-attacks-output {
    gap: 8px;
}

.sectool-jwt-attacks-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 4px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* 爆破状态指示器 */
.sectool-jwt-attacks-status {
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 4px;
    min-height: 20px;
}

.sectool-jwt-attacks-status--idle {
    color: var(--sectool-text-tertiary);
    background: var(--sectool-bg-secondary, #f5f5f5);
}

.sectool-jwt-attacks-status--running {
    color: var(--sectool-primary, #1890ff);
    background: rgba(24, 144, 255, 0.08);
}

.sectool-jwt-attacks-status--found {
    color: var(--sectool-success, #52c41a);
    background: rgba(82, 196, 26, 0.08);
    font-weight: 500;
}

/* 进度条 */
.sectool-jwt-attacks-progress {
    position: relative;
    height: 24px;
    background: var(--sectool-bg-secondary, #f0f0f0);
    border-radius: 4px;
    overflow: hidden;
}

.sectool-jwt-attacks-progress-bar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, var(--sectool-primary, #1890ff), #40a9ff);
    transition: width 0.15s ease;
}

.sectool-jwt-attacks-progress-text {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: var(--sectool-text-secondary);
}
</style>
