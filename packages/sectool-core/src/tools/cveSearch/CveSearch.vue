<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <!-- 搜索输入：支持 CVE 编号或关键词 -->
                    <Input
                        v-model="action.current.keyword"
                        :label="$t('cveSearch_label')"
                        :placeholder="$t('cveSearch_placeholder')"
                    />
                </Align>
                <template #extra>
                    <Button type="primary" size="small" :text="$t('cveSearch_search')" @click="doSearch" />
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <!-- 加载状态 -->
                <div v-if="loading" class="sectool-cve-loading">{{ $t('cveSearch_loading') }}</div>
                <!-- API 错误提示（如 CORS） -->
                <div v-else-if="apiError" class="sectool-cve-error">
                    {{ $t('cveSearch_api_error') }}
                    <Link href="https://nvd.nist.gov/vuln/search">nvd.nist.gov</Link>
                </div>
                <!-- 无结果 -->
                <div v-else-if="!loading && searched && results.length === 0" class="sectool-cve-no-result">
                    {{ $t('cveSearch_no_result') }}
                </div>
                <!-- 结果卡片列表 -->
                <template v-else-if="results.length > 0">
                    <div
                        v-for="item in results"
                        :key="item.id"
                        class="sectool-cve-card"
                    >
                        <div class="sectool-cve-card-header">
                            <span class="sectool-cve-id">{{ item.id }}</span>
                            <span
                                v-if="item.severity"
                                :class="['sectool-cve-severity', `sectool-cve-severity-${item.severity.toLowerCase()}`]"
                            >
                                {{ item.severity }}
                            </span>
                        </div>
                        <div v-if="item.description" class="sectool-cve-desc">
                            {{ $t('cveSearch_description') }}: {{ item.description }}
                        </div>
                        <div v-if="item.references && item.references.length > 0" class="sectool-cve-refs">
                            <span class="sectool-cve-ref-label">{{ $t('cveSearch_references') }}:</span>
                            <div v-for="(ref, ri) in item.references.slice(0, 5)" :key="ri" class="sectool-cve-ref-item">
                                <Link :href="ref.url">{{ ref.url }}</Link>
                            </div>
                            <span v-if="item.references.length > 5" class="sectool-cve-ref-more">
                                +{{ item.references.length - 5 }} {{ $t('cveSearch_more') }}
                            </span>
                        </div>
                    </div>
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
/**
 * CVE 搜索工具
 * 使用 NVD 公开 API 查询 CVE 漏洞信息
 * 支持按 CVE 编号或关键词搜索
 * 注意：NVD API 可能有 CORS 限制，浏览器直接请求可能失败
 */
import { useAction, initialize } from "@/store/action"
import { ref, computed } from "vue"

const NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0"

interface CveRef {
    url: string
}

interface CveResult {
    id: string
    description: string
    severity: string
    references: CveRef[]
}

const action = useAction(
    await initialize({
        keyword: "",
    })
)

const loading = ref(false)
const apiError = ref(false)
const searched = ref(false)
const rawResults = ref<CveResult[]>([])

const results = computed(() => rawResults.value)

async function doSearch() {
    const kw = action.current.keyword?.trim()
    if (!kw) return

    loading.value = true
    apiError.value = false
    searched.value = true
    rawResults.value = []

    try {
        // 判断是否为 CVE 编号格式（CVE-YYYY-NNNNN）
        const isCveId = /^CVE-\d{4}-\d{4,}$/i.test(kw)
        const url = isCveId ? `${NVD_BASE}?cveId=${encodeURIComponent(kw)}` : `${NVD_BASE}?keywordSearch=${encodeURIComponent(kw)}`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const vulns = data?.vulnerabilities || []

        rawResults.value = vulns.map((v: any) => {
            const cve = v?.cve || {}
            const descEn = cve?.descriptions?.find((d: any) => d.lang === "en")
            const metrics = cve?.metrics?.cvssMetricV31?.[0] || cve?.metrics?.cvssMetricV30?.[0] || cve?.metrics?.cvssMetricV2?.[0]
            const severity = metrics?.cvssData?.baseSeverity || "N/A"
            const refs = (cve?.references || []).map((r: any) => ({ url: r.url || "" })).filter((r: CveRef) => r.url)

            return {
                id: cve.id || "N/A",
                description: (descEn?.value || "").slice(0, 500),
                severity: severity || "N/A",
                references: refs,
            }
        })
    } catch (e) {
        apiError.value = true
        rawResults.value = []
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.sectool-cve-loading,
.sectool-cve-no-result,
.sectool-cve-error {
    font-size: 13px;
    color: var(--sectool-text-secondary);
    text-align: center;
    padding: 24px 12px;
}

.sectool-cve-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.sectool-cve-card {
    margin-bottom: 10px;
    padding: 10px 12px;
    border-radius: 6px;
    background: var(--sectool-bg-secondary, rgba(255, 255, 255, 0.04));
    border: 1px solid var(--sectool-border, rgba(255, 255, 255, 0.08));
}

.sectool-cve-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.sectool-cve-id {
    font-size: 14px;
    font-weight: 700;
    font-family: "JetBrains Mono", monospace;
    color: var(--sectool-primary, #1890ff);
}

.sectool-cve-severity {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 3px;
}

.sectool-cve-severity-critical {
    background: rgba(255, 77, 79, 0.2);
    color: #ff4d4f;
}

.sectool-cve-severity-high {
    background: rgba(250, 173, 20, 0.2);
    color: #faad14;
}

.sectool-cve-severity-medium {
    background: rgba(250, 173, 20, 0.12);
    color: #faad14;
}

.sectool-cve-severity-low {
    background: rgba(82, 196, 26, 0.15);
    color: #52c41a;
}

.sectool-cve-desc {
    font-size: 12px;
    color: var(--sectool-text-default);
    line-height: 1.5;
    margin-bottom: 6px;
}

.sectool-cve-ref-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
}

.sectool-cve-ref-item {
    font-size: 11px;
    margin-top: 2px;
    word-break: break-all;
}

.sectool-cve-ref-more {
    font-size: 11px;
    color: var(--sectool-text-secondary);
    margin-left: 4px;
}
</style>
