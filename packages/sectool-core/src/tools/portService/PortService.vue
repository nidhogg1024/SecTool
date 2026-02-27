<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 搜索输入：支持按端口号、服务名、描述搜索 -->
                    <Input
                        v-model="action.current.search"
                        :label="$t('portService_search')"
                        :placeholder="$t('portService_search_placeholder')"
                    />
                    <!-- 分类筛选下拉框 -->
                    <Select
                        v-model="action.current.category"
                        :label="$t('portService_category')"
                        :options="categoryOptions"
                    />
                </Align>
                <template #extra>
                    <Align>
                        <!-- 显示/隐藏漏洞信息开关 -->
                        <Bool
                            size="small"
                            v-model="action.current.showVulns"
                            border
                            :label="$t('portService_show_vulns')"
                        />
                        <!-- 显示/隐藏默认凭据开关 -->
                        <Bool
                            size="small"
                            v-model="action.current.showCreds"
                            border
                            :label="$t('portService_show_creds')"
                        />
                    </Align>
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <!-- 结果统计 -->
                <div class="sectool-port-stats" v-if="filteredEntries.length > 0">
                    {{ $t('portService_result_count') }}: {{ filteredEntries.length }}
                </div>

                <!-- 端口条目列表 -->
                <template v-for="entry in filteredEntries" :key="entry.port + '-' + entry.service">
                    <div class="sectool-port-card">
                        <!-- 卡片头部：端口号 + 协议 + 服务名 -->
                        <div class="sectool-port-card-header">
                            <div class="sectool-port-number-wrap">
                                <span class="sectool-port-number">{{ entry.port }}</span>
                                <span class="sectool-port-protocol">{{ entry.protocol.toUpperCase() }}</span>
                            </div>
                            <span class="sectool-port-service">{{ entry.service }}</span>
                        </div>
                        <!-- 描述 -->
                        <div class="sectool-port-desc">{{ entry.description }}</div>

                        <!-- 默认凭据（可切换显示） -->
                        <template v-if="action.current.showCreds && entry.defaultCreds && entry.defaultCreds.length > 0">
                            <div class="sectool-port-subsection-title">{{ $t('portService_default_creds') }}</div>
                            <div class="sectool-port-tag-list">
                                <span
                                    v-for="(cred, ci) in entry.defaultCreds"
                                    :key="ci"
                                    class="sectool-port-tag sectool-port-tag-cred"
                                >{{ cred }}</span>
                            </div>
                        </template>

                        <!-- 常见漏洞（可切换显示） -->
                        <template v-if="action.current.showVulns && entry.commonVulns && entry.commonVulns.length > 0">
                            <div class="sectool-port-subsection-title">{{ $t('portService_common_vulns') }}</div>
                            <div class="sectool-port-tag-list">
                                <span
                                    v-for="(vuln, vi) in entry.commonVulns"
                                    :key="vi"
                                    class="sectool-port-tag sectool-port-tag-vuln"
                                >{{ vuln }}</span>
                            </div>
                        </template>

                        <!-- 枚举命令（可复制的文本区域） -->
                        <template v-if="entry.enumCommands && entry.enumCommands.length > 0">
                            <div class="sectool-port-subsection-title">{{ $t('portService_enum_commands') }}</div>
                            <Textarea
                                :model-value="entry.enumCommands.join('\n')"
                                :height="Math.min(entry.enumCommands.length * 22 + 12, 120)"
                                :placeholder="entry.service + ' Commands'"
                                :copy="entry.service + ' Enum'"
                            />
                        </template>
                    </div>
                </template>

                <!-- 无匹配结果提示 -->
                <div v-if="filteredEntries.length === 0" class="sectool-port-no-result">
                    {{ $t('portService_no_results') }}
                </div>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"
import { portData, categoryMeta } from "./data"
import type { PortEntry, PortCategory } from "./data"

// ==================== 分类下拉选项构建 ====================
// 在分类列表前增加 "全部" 选项
const categoryOptions = [
    { value: 'all', label: $t('portService_cat_all') },
    ...categoryMeta.map(c => ({
        value: c.value,
        label: $t(`portService_${c.labelKey}`),
    })),
]

// ==================== 响应式状态初始化 ====================
const action = useAction(await initialize({
    search: '',           // 搜索关键词
    category: 'all',      // 当前选中分类
    showVulns: true,      // 是否显示漏洞信息
    showCreds: true,      // 是否显示默认凭据
}))

// ==================== 过滤逻辑 ====================
// 根据搜索词和分类筛选端口条目
const filteredEntries = $computed((): PortEntry[] => {
    const keyword = action.current.search.trim().toLowerCase()
    const cat = action.current.category as PortCategory | 'all'

    return portData.filter(entry => {
        // 分类过滤：如果不是 "全部"，则只保留匹配分类
        if (cat !== 'all' && entry.category !== cat) return false

        // 搜索过滤：匹配端口号、服务名、中文描述、英文描述
        if (keyword) {
            const portStr = String(entry.port)
            const matchPort = portStr.includes(keyword)
            const matchService = entry.service.toLowerCase().includes(keyword)
            const matchDesc = entry.description.toLowerCase().includes(keyword)
            const matchDescEn = entry.descriptionEn.toLowerCase().includes(keyword)
            if (!matchPort && !matchService && !matchDesc && !matchDescEn) return false
        }

        return true
    })
})
</script>

<style scoped>
/* 结果统计 */
.sectool-port-stats {
    font-size: 11px;
    color: var(--sectool-text-secondary);
    margin: 4px 0 6px 2px;
}

/* 端口卡片容器 */
.sectool-port-card {
    margin-bottom: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--sectool-bg-secondary, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--sectool-border, rgba(255, 255, 255, 0.08));
}

/* 卡片头部布局 */
.sectool-port-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
}

/* 端口号 + 协议标签组合 */
.sectool-port-number-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
}

/* 端口号醒目显示 */
.sectool-port-number {
    font-size: 16px;
    font-weight: 700;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: var(--sectool-primary, #1890ff);
}

/* 协议标签 */
.sectool-port-protocol {
    font-size: 10px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 3px;
    background: rgba(24, 144, 255, 0.12);
    color: var(--sectool-primary, #1890ff);
    text-transform: uppercase;
}

/* 服务名称 */
.sectool-port-service {
    font-size: 13px;
    font-weight: 600;
    color: var(--sectool-text-default);
}

/* 端口描述 */
.sectool-port-desc {
    font-size: 12px;
    color: var(--sectool-text-secondary);
    margin-bottom: 6px;
    line-height: 1.5;
}

/* 子段落标题（凭据/漏洞/命令） */
.sectool-port-subsection-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 3px 0;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

/* 标签列表容器 */
.sectool-port-tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
}

/* 通用标签样式 */
.sectool-port-tag {
    font-size: 11px;
    padding: 2px 7px;
    border-radius: 3px;
    font-weight: 500;
    line-height: 1.5;
}

/* 默认凭据标签（警告色） */
.sectool-port-tag-cred {
    background: rgba(250, 173, 20, 0.12);
    color: #faad14;
}

/* 漏洞标签（危险色） */
.sectool-port-tag-vuln {
    background: rgba(255, 77, 79, 0.10);
    color: #ff4d4f;
}

/* 无匹配结果提示 */
.sectool-port-no-result {
    font-size: 13px;
    color: var(--sectool-text-secondary);
    text-align: center;
    padding: 30px 0;
}
</style>
