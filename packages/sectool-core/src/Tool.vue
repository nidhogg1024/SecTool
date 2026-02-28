<template>
    <Suspense>
        <div class="st-app" :class="sidebarCollapsed ? 'st-sidebar-collapsed' : ''">
            <!-- 左侧边栏 -->
            <aside class="st-sidebar">
                <div class="st-sidebar-logo" @click="sidebarCollapsed = !sidebarCollapsed">
                    <svg class="st-logo-icon" width="22" height="22" viewBox="0 0 64 64"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs><path d="M32 4 L8 16 V30 C8 46 32 60 32 60 C32 60 56 46 56 30 V16 Z" fill="url(#lg)"/><text x="32" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="34" fill="#0c1021">S</text></svg>
                    <span class="st-sidebar-logo-text" v-if="!sidebarCollapsed">SecTool</span>
                    <svg v-if="!sidebarCollapsed" class="st-collapse-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                </div>

                <!-- 手风琴式分类 + 工具列表 -->
                <div class="st-sidebar-tree" v-if="!sidebarCollapsed">
                    <div v-for="catName in allCategoryNames" :key="catName" class="st-tree-group">
                        <div
                            class="st-tree-category"
                            :class="selectedCategory === catName ? 'st-active' : ''"
                            @click="toggleCategory(catName)"
                        >
                            <span class="st-sidebar-icon" v-html="categoryIconSvg[catName] || categoryIconSvg['utility']"></span>
                            <span class="st-tree-cat-label">{{ $t(`main_category_${catName}`) }}</span>
                            <svg
                                class="st-tree-chevron"
                                :class="selectedCategory === catName ? 'st-expanded' : ''"
                                width="12" height="12" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2"
                            ><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                        <div class="st-tree-tools" v-if="selectedCategory === catName">
                            <div
                                v-for="toolName in getCategoryToolNames(catName)"
                                :key="toolName"
                                class="st-tree-tool"
                                :class="storeOperate.items.tool === toolName ? 'st-active' : ''"
                                @click="selectTool(toolName)"
                            >
                                {{ $t('tool_' + toolName) }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 收叠模式：只显示分类图标 -->
                <nav class="st-sidebar-icons" v-else>
                    <div
                        v-for="catName in allCategoryNames"
                        :key="catName"
                        class="st-sidebar-icon-item"
                        :class="selectedCategory === catName ? 'st-active' : ''"
                        @click="toggleCategory(catName)"
                        :title="$t(`main_category_${catName}`)"
                    >
                        <span class="st-sidebar-icon" v-html="categoryIconSvg[catName] || categoryIconSvg['utility']"></span>
                    </div>
                </nav>

                <div class="st-sidebar-bottom">
                    <div class="st-sidebar-shortcut" @click="cmdOpen" title="Ctrl+K / Cmd+K">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        <span v-if="!sidebarCollapsed" class="st-sidebar-cat-label">{{ $t('main_search_tool') }}</span>
                        <kbd v-if="!sidebarCollapsed" class="st-kbd">⌘K</kbd>
                    </div>
                </div>
            </aside>

            <!-- 右侧主区域 -->
            <div class="st-main">
                <header class="st-topbar">
                    <div class="st-topbar-left">
                        <div class="st-topbar-features" v-if="features.length > 1">
                            <div
                                v-for="feature in features"
                                :key="feature.name"
                                class="st-feature-tab"
                                :class="storeOperate.items.feature === feature.name ? 'st-active' : ''"
                                @click="selectFeature(feature)"
                            >
                                {{ $t('tool_' + storeOperate.items.tool + '_' + feature.name) }}
                            </div>
                        </div>
                        <div class="st-topbar-title" v-else>
                            {{ $t('tool_' + storeOperate.items.tool) }}
                        </div>
                    </div>
                    <div class="st-topbar-right">
                        <Icon hover :size="16" name="clear" @click="evtBus.dispatch('content_clear')" :tooltip="$t('main_content_clear')"/>
                        <span style="display: inline-flex;" :class="!storeSetting.items.history_icon_badge_hidden && historyExist ? 'st-badge' : ''">
                            <Icon :size="16" hover name="history" @click="openHistory = !openHistory" :tooltip="$t('main_history')"/>
                        </span>
                        <Icon hover :size="16" name="setting" @click="evtBus.dispatch('open_setting')" :tooltip="$t('main_ui_setting')"/>
                    </div>
                </header>

                <Content />
            </div>

            <CommandPalette />
            <ExtendPage v-model="openHistory" :title="$t('main_history')">
                <History/>
            </ExtendPage>
        </div>
    </Suspense>
</template>

<script setup lang="ts">
import Content from "@/block/Content.vue";
import CommandPalette from "@/components/CommandPalette.vue";
import History from "@/block/History.vue";
import Message from "@/helper/message";
import useOperate from "@/store/operate";
import useSetting, { useTheme } from "@/store/setting";
import { getTool, toolExists, FeatureInterface, categories, getCategory, categoryExists } from "@/config";
import { nextTick, onErrorCaptured, onMounted, onUnmounted, watch } from "vue";
import { isObject } from "lodash";
import platform from "@/helper/platform";
import storage from "@/helper/storage";
import { useRouter } from "vue-router";
import event from "@/event";
import getHistoryInstance from "@/helper/history";

const storeOperate = useOperate();
const storeSetting = useSetting();
const router = useRouter();
const evtBus = event;
useTheme();

let sidebarCollapsed = $ref(false);
let openHistory = $ref(false);
let historyExist = $ref(false);

const cmdOpen = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
};

const categoryIconSvg: Record<string, string> = {
    common: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    payload: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    encode: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    crypto: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    attack: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    utility: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
};

const allCategoryNames = ['common', ...categories.map(({ name }) => name)];

let selectedCategory = $ref(storeOperate.items.category || "common");

const getCategoryToolNames = (catName: string) => {
    if (categoryExists(catName)) {
        return getCategory(catName).tools.map(({ name }) => name);
    }
    return storeOperate.getSmartCommon(storeSetting.items.common);
};

const toggleCategory = (name: string) => {
    if (selectedCategory === name) {
        selectedCategory = "";
        return;
    }
    selectedCategory = name;
    const tools = getCategoryToolNames(name);
    let tool = "";
    if (categoryExists(name)) {
        tool = storeOperate.getCategoryLastTool(name);
    } else {
        const smartCommon = storeOperate.getSmartCommon(storeSetting.items.common);
        for (const feature of storeOperate.getRecently()) {
            if (smartCommon.includes(feature.tool.name)) {
                tool = feature.tool.name;
                break;
            }
        }
    }
    selectTool(tool || tools[0]);
};

const selectTool = (name: string) => {
    storeOperate.redirectTool(name, storeOperate.getToolLastFeature(name), selectedCategory);
};

const features = $computed(() => {
    return toolExists(storeOperate.items.tool) && !getTool(storeOperate.items.tool).isSimple()
        ? getTool(storeOperate.items.tool).features
        : [];
});

const selectFeature = (feature: FeatureInterface) => {
    storeOperate.redirectTool(storeOperate.items.tool, feature.name, storeOperate.items.category);
};

watch(() => ({ tool: storeOperate.items.tool, category: storeOperate.items.category }), ({ category }) => {
    if (categoryExists(category) || category === "common") {
        selectedCategory = category;
    }
});

watch(() => ({ selectedCategory, tool: storeOperate.items.tool }), async () => {
    await nextTick();
    window.dispatchEvent(new Event("resize"));
}, { immediate: true });

const updateHistoryExist = () => {
    historyExist = getHistoryInstance(storeOperate.items.tool, storeOperate.items.feature).length() > 0;
};

const globalErrorMessage = (err: any) => {
    console.log("error:", err);
    const message: string = (isObject(err) && "message" in err ? err.message : err).toString();
    Message.closeAll();
    Message.error(message, { duration: message.includes("\n") ? 0 : 5000 });
};

window.addEventListener("unhandledrejection", (ev) => { ev.preventDefault(); globalErrorMessage(ev.reason); });
window.addEventListener("error", ev => { ev.preventDefault(); globalErrorMessage(ev.error); });
onErrorCaptured(err => { globalErrorMessage(err); return false; });

onMounted(() => {
    platform.runtime.initialize(storage, router);
    updateHistoryExist();
    event.addListener(["tool_change", "history_change"], updateHistoryExist);
});
onUnmounted(() => {
    event.removeListener(["tool_change", "history_change"], updateHistoryExist);
});
</script>

<style>
/* ================================================================
   SecTool — 侧边栏手风琴布局
   ================================================================ */
.st-app {
    height: 100vh;
    display: grid;
    grid-template-columns: 230px 1fr;
    background: var(--sectool-background-color);
    color: var(--color);
    overflow: hidden;
    font-size: 13px;
}
.st-app.st-sidebar-collapsed {
    grid-template-columns: 48px 1fr;
}

/* ===== 侧边栏 ===== */
.st-sidebar {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--sectool-border-color);
    background: var(--sectool-sidebar-bg, var(--sectool-block-title-bg-color));
    overflow: hidden;
    user-select: none;
}

.st-sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    cursor: pointer;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: -0.02em;
    border-bottom: 1px solid var(--sectool-border-color);
    flex-shrink: 0;
    color: var(--sectool-primary);
    transition: background 0.15s;
}
.st-sidebar-logo:hover {
    background: var(--primary-focus);
}
.st-logo-icon {
    flex-shrink: 0;
}
.st-collapse-icon {
    margin-left: auto;
    opacity: 0.4;
    transition: opacity 0.15s;
}
.st-sidebar-logo:hover .st-collapse-icon {
    opacity: 0.8;
}
.st-sidebar-collapsed .st-sidebar-logo {
    justify-content: center;
    padding: 12px 0;
}

/* ===== 手风琴树形导航 ===== */
.st-sidebar-tree {
    flex: 1;
    overflow-y: auto;
    padding: 6px 0;
    scrollbar-width: thin;
    scrollbar-color: var(--sectool-border-color) transparent;
}
.st-sidebar-tree::-webkit-scrollbar {
    width: 3px;
}
.st-sidebar-tree::-webkit-scrollbar-thumb {
    background: var(--sectool-border-color);
    border-radius: 3px;
}

.st-tree-group {
    margin-bottom: 2px;
}

.st-tree-category {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    margin: 0 6px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--sectool-color-secondary);
    transition: all 0.12s ease;
    white-space: nowrap;
    overflow: hidden;
}
.st-tree-category:hover {
    background: var(--primary-focus);
    color: var(--color);
}
.st-tree-category.st-active {
    color: var(--sectool-primary);
    font-weight: 600;
}

.st-tree-cat-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.st-tree-chevron {
    flex-shrink: 0;
    opacity: 0.4;
    transition: transform 0.2s ease, opacity 0.15s;
}
.st-tree-chevron.st-expanded {
    transform: rotate(90deg);
    opacity: 0.7;
}
.st-tree-category:hover .st-tree-chevron {
    opacity: 0.7;
}

.st-sidebar-icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    opacity: 0.5;
}
.st-tree-category:hover .st-sidebar-icon,
.st-tree-category.st-active .st-sidebar-icon {
    opacity: 1;
}
.st-tree-category.st-active .st-sidebar-icon {
    color: var(--sectool-primary);
}

/* 工具列表（展开在分类下方，带缩进） */
.st-tree-tools {
    padding: 2px 0 4px;
}

.st-tree-tool {
    padding: 5px 12px 5px 38px;
    margin: 0 6px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    color: var(--sectool-color-secondary);
    transition: all 0.1s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
}
.st-tree-tool::before {
    content: "";
    position: absolute;
    left: 20px;
    top: 50%;
    width: 6px;
    height: 1px;
    background: var(--sectool-border-color);
}
.st-tree-tool:hover {
    background: var(--primary-focus);
    color: var(--color);
}
.st-tree-tool.st-active {
    background: var(--sectool-primary);
    color: #fff;
    font-weight: 600;
}
.st-tree-tool.st-active::before {
    background: rgba(255, 255, 255, 0.4);
}

/* ===== 收叠模式：仅图标 ===== */
.st-sidebar-icons {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 0;
    overflow-y: auto;
}

.st-sidebar-icon-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.12s;
    color: var(--sectool-color-secondary);
}
.st-sidebar-icon-item:hover {
    background: var(--primary-focus);
    color: var(--color);
}
.st-sidebar-icon-item.st-active {
    background: var(--primary-focus);
    color: var(--sectool-primary);
}
.st-sidebar-icon-item.st-active .st-sidebar-icon {
    opacity: 1;
    color: var(--sectool-primary);
}

/* ===== 底部搜索栏 ===== */
.st-sidebar-bottom {
    flex-shrink: 0;
    padding: 8px 6px;
    border-top: 1px solid var(--sectool-border-color);
}
.st-sidebar-shortcut {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    color: var(--sectool-info-color);
    transition: all 0.12s;
}
.st-sidebar-shortcut:hover {
    background: var(--primary-focus);
    color: var(--color);
}
.st-kbd {
    margin-left: auto;
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid var(--sectool-border-color);
    background: var(--sectool-background-color);
    font-family: inherit;
    color: var(--sectool-info-color);
}

/* ===== 主内容区 ===== */
.st-main {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
}

.st-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 42px;
    border-bottom: 1px solid var(--sectool-border-color);
    flex-shrink: 0;
    background: var(--sectool-background-color);
}
.st-topbar-left {
    display: flex;
    align-items: center;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
}
.st-topbar-left::-webkit-scrollbar { display: none; }
.st-topbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    margin-left: 12px;
}

.st-topbar-title {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--color);
}

.st-topbar-features {
    display: flex;
    gap: 2px;
}
.st-feature-tab {
    padding: 5px 14px;
    border-radius: 5px;
    font-size: 12.5px;
    cursor: pointer;
    color: var(--sectool-color-secondary);
    font-weight: 500;
    transition: all 0.12s;
    white-space: nowrap;
}
.st-feature-tab:hover {
    background: var(--primary-focus);
    color: var(--color);
}
.st-feature-tab.st-active {
    background: var(--primary-focus);
    color: var(--sectool-primary);
    font-weight: 600;
}

.st-main .sectool-content {
    flex: 1;
    min-height: 0;
}

.st-badge {
    position: relative;
    display: inline-flex;
}
.st-badge::after {
    content: "";
    position: absolute;
    top: -2px;
    right: -2px;
    width: 6px;
    height: 6px;
    background: var(--sectool-contrast);
    border-radius: 50%;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
    .st-app {
        grid-template-columns: 48px 1fr;
    }
    .st-sidebar-logo-text,
    .st-sidebar-tree,
    .st-sidebar-bottom .st-kbd,
    .st-sidebar-bottom .st-sidebar-cat-label {
        display: none;
    }
    .st-sidebar-icons {
        display: flex !important;
    }
    .st-sidebar-logo {
        justify-content: center;
        padding: 12px 0;
    }
    .st-topbar {
        height: 40px;
        padding: 0 10px;
    }
}
</style>
