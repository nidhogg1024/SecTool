<template>
    <Teleport to="body">
        <div v-if="visible" class="cmd-overlay" @click.self="close">
            <div class="cmd-dialog">
                <div class="cmd-input-wrap">
                    <svg class="cmd-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input
                        ref="inputRef"
                        v-model="query"
                        class="cmd-input"
                        :placeholder="$t('main_search_placeholder')"
                        @keydown.esc="close"
                        @keydown.down.prevent="moveDown"
                        @keydown.up.prevent="moveUp"
                        @keydown.enter.prevent="selectCurrent"
                    />
                    <kbd class="cmd-kbd">ESC</kbd>
                </div>
                <div class="cmd-list" v-if="results.length > 0">
                    <div
                        v-for="(item, idx) in results"
                        :key="item.key"
                        class="cmd-item"
                        :class="{ 'cmd-item-active': idx === activeIndex }"
                        @click="selectItem(item)"
                        @mouseenter="activeIndex = idx"
                    >
                        <div class="cmd-item-name">{{ item.toolLabel }}</div>
                        <div class="cmd-item-feature" v-if="item.featureLabel">{{ item.featureLabel }}</div>
                        <div class="cmd-item-category">{{ item.categoryLabel }}</div>
                    </div>
                </div>
                <div class="cmd-empty" v-else-if="query.trim()">
                    {{ $t('main_ui_null') }}
                </div>
                <div class="cmd-footer">
                    <span><kbd>↑↓</kbd> {{ $t('main_ui_op') }}</span>
                    <span><kbd>↵</kbd> {{ $t('main_ui_views') }}</span>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { tools } from "@/config";
import useOperate from "@/store/operate";
import { $t } from "@/i18n";
import useSetting from "@/store/setting";

const storeOperate = useOperate();
const storeSetting = useSetting();
let visible = $ref(false);
let query = $ref("");
let activeIndex = $ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

interface CmdItem {
    key: string;
    toolName: string;
    featureName: string;
    category: string;
    toolLabel: string;
    featureLabel: string;
    categoryLabel: string;
    searchText: string;
}

const allItems: CmdItem[] = [];

const buildItems = () => {
    allItems.length = 0;
    for (const tool of tools) {
        const toolLabel = $t(`tool_${tool.name}`, [], storeSetting.items.locale);
        for (const feature of tool.features) {
            const featureLabel = tool.isSimple() ? "" : $t(`tool_${tool.name}_${feature.name}`, [], storeSetting.items.locale);
            const cat = tool.categories[0];
            const categoryLabel = cat ? $t(`main_category_${cat.name}`, [], storeSetting.items.locale) : "";
            allItems.push({
                key: `${tool.name}_${feature.name}`,
                toolName: tool.name,
                featureName: feature.name,
                category: cat?.name || "",
                toolLabel,
                featureLabel,
                categoryLabel,
                searchText: `${toolLabel} ${featureLabel} ${categoryLabel} ${tool.name} ${feature.name}`.toLowerCase(),
            });
        }
    }
};

const results = $computed(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 20);
    return allItems.filter(item => {
        const terms = q.split(/\s+/);
        return terms.every(t => item.searchText.includes(t));
    }).slice(0, 15);
});

const open = () => {
    buildItems();
    visible = true;
    query = "";
    activeIndex = 0;
    nextTick(() => inputRef.value?.focus());
};

const close = () => {
    visible = false;
};

const moveDown = () => {
    if (activeIndex < results.length - 1) activeIndex++;
};

const moveUp = () => {
    if (activeIndex > 0) activeIndex--;
};

const selectItem = (item: CmdItem) => {
    storeOperate.redirectTool(item.toolName, item.featureName, item.category);
    close();
};

const selectCurrent = () => {
    if (results.length > 0 && activeIndex < results.length) {
        selectItem(results[activeIndex]);
    }
};

watch(() => query, () => {
    activeIndex = 0;
});

const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (visible) {
            close();
        } else {
            open();
        }
    }
};

onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
});
</script>

<style>
.cmd-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    padding-top: 15vh;
}

.cmd-dialog {
    width: 520px;
    max-width: 90vw;
    max-height: 420px;
    background: var(--sectool-background-color);
    border: 1px solid var(--sectool-border-color);
    border-radius: 12px;
    box-shadow: 0 16px 70px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: cmd-fade-in 0.12s ease-out;
}

@keyframes cmd-fade-in {
    from { opacity: 0; transform: scale(0.98) translateY(-8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.cmd-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--sectool-border-color);
}

.cmd-search-icon {
    flex-shrink: 0;
    opacity: 0.5;
}

.cmd-input {
    flex: 1;
    border: none !important;
    background: transparent !important;
    font-size: 14px !important;
    padding: 0 !important;
    margin: 0 !important;
    height: auto !important;
    outline: none !important;
    box-shadow: none !important;
    color: var(--color) !important;
}

.cmd-kbd {
    font-size: 10px;
    font-family: inherit;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--sectool-border-color);
    background: var(--sectool-block-title-bg-color);
    color: var(--sectool-info-color);
    flex-shrink: 0;
}

.cmd-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
}

.cmd-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.08s;
}

.cmd-item-active {
    background: var(--sectool-dropdown-hover-background-color);
}

.cmd-item-name {
    font-weight: 500;
}

.cmd-item-feature {
    font-size: 12px;
    color: var(--sectool-info-color);
}

.cmd-item-category {
    margin-left: auto;
    font-size: 11px;
    color: var(--sectool-info-color);
    opacity: 0.7;
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--sectool-block-title-bg-color);
}

.cmd-empty {
    padding: 24px;
    text-align: center;
    color: var(--sectool-info-color);
    font-size: 13px;
}

.cmd-footer {
    display: flex;
    gap: 16px;
    padding: 8px 16px;
    border-top: 1px solid var(--sectool-border-color);
    font-size: 11px;
    color: var(--sectool-info-color);
}

.cmd-footer kbd {
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid var(--sectool-border-color);
    background: var(--sectool-block-title-bg-color);
    margin-right: 2px;
}
</style>
