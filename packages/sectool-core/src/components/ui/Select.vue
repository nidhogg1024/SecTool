<template>
    <div
        class="sectool-select"
        :data-size="size"
        :data-type="type"
        :data-disabled="disabled ? 'y' : 'n'"
        :style="style"
        ref="container"
    >
        <details role="list" ref="details">
            <summary aria-haspopup="listbox" role="button" class="sectool-select-summary">{{ placeholderValue }}</summary>
            <ul role="listbox" class="sectool-select-option-hidden" v-if="!dialog">
                <li v-if="filterable" class="sectool-select-search-item" @click.stop>
                    <input
                        ref="searchInput"
                        v-model="searchKeyword"
                        class="sectool-select-search-input"
                        :placeholder="filterPlaceholder"
                    />
                </li>
                <li v-for="item in filteredOptions" :key="item.value">
                    <a @click="selected = item.value">
                        {{ item.label }}{{ item.description !== "" ? ` - ${item.description}` : "" }}</a
                    >
                </li>
                <li v-if="filterable && filteredOptions.length === 0" class="sectool-select-no-result">
                    No results
                </li>
            </ul>
        </details>
        <div class="sectool-select-left">
            <template v-if="label !== '' && type === 'general'">
                <div class="sectool-select-prepend" :class="label !== '' ? `sectool-input-label` : ``">{{ label }}</div>
            </template>
        </div>
        <Modal v-model="dialogShow" :title="label" padding="20px 10px" width="85%" @close="close">
            <div v-if="filterable" style="margin-bottom: 10px; padding: 0 10px;">
                <input
                    v-model="searchKeyword"
                    class="sectool-select-dialog-search"
                    :placeholder="filterPlaceholder"
                />
            </div>
            <Align horizontal="center">
                <Button
                    :type="selected === item.value ? `primary` : `general`"
                    v-for="item in filteredOptions"
                    :key="item.value"
                    @click="selected = item.value"
                    :text="item.label"
                />
            </Align>
        </Modal>
    </div>
</template>

<script setup lang="ts">
// 下拉菜单
import { PropType, onMounted, StyleValue, onUnmounted, nextTick } from "vue";
import { isNumber, isString } from "lodash";
import { SelectOption, ComponentSizeType, SelectType, SelectValue } from "@/types";
import { sizeConvert, measureTextMaxWidth } from "@/components/util";

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: "__placeholder__",
    },
    placeholder: {
        type: String,
        default: "",
    },
    size: {
        type: String as PropType<ComponentSizeType>,
        default: "default",
    },
    type: {
        type: String as PropType<SelectType>,
        default: "general",
    },
    options: {
        type: Array as PropType<SelectOption>,
        default: [],
    },
    label: {
        type: String,
        default: "",
    },
    width: {
        type: [Number, String],
        default: "",
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    dialog: {
        type: Boolean,
        default: false,
    },
    disabledDialogClickClose: {
        type: Boolean,
        default: false,
    },
    center: {
        type: Boolean,
        default: true,
    },
    filterable: {
        type: Boolean,
        default: false,
    },
    filterPlaceholder: {
        type: String,
        default: "Search...",
    },
});
const emit = defineEmits<{
    (e: "update:modelValue", value: SelectValue): void;
    (e: "change", value: SelectValue): void;
}>();
const container = $ref<HTMLElement | null>(null);
const searchInput = $ref<HTMLInputElement | null>(null);
let selectLeftWidth = $ref(0);
let menuTextWidth = $ref(0);
const menuPosition = $ref<Record<"top" | "right" | "left" | "bottom", string>>({
    top: "unset",
    right: "unset",
    left: "unset",
    bottom: "unset",
});
let dialogShow = $ref(false);
let searchKeyword = $ref("");

const selected = $computed({
    get: () => props.modelValue,
    set: value => {
        emit("update:modelValue", value);
        emit("change", value);
        if (props.dialog && props.disabledDialogClickClose) {
            return;
        }
        close();
    },
});

const close = () => {
    container?.querySelector("details")?.removeAttribute("open");
};

const getOptions = $computed(() => {
    const items: Array<{ value: SelectValue; label: string; description: string }> = [];
    for (const item of props.options) {
        if (isNumber(item) || isString(item)) {
            items.push({ value: item, label: `${item}`, description: "" });
        } else {
            items.push({ value: item.value, label: `${item.label}`, description: item.description || "" });
        }
    }
    return items;
});

// 根据搜索关键词过滤选项
const filteredOptions = $computed(() => {
    if (!props.filterable || !searchKeyword.trim()) {
        return getOptions;
    }
    const keyword = searchKeyword.trim().toLowerCase();
    return getOptions.filter(item =>
        item.label.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
    );
});

const placeholderValue = $computed(() => {
    if (selected !== "__placeholder__") {
        return getOptions.find(item => item.value === selected)?.label || props.placeholder;
    }
    return props.placeholder;
});

const style = $computed(() => {
    const css: StyleValue = {};
    if (props.center) {
        css["--text-align"] = "center";
    }
    css.width = props.width ? sizeConvert(props.width) : `auto`;
    if (selectLeftWidth) {
        css["--sectool-select-left-padding"] = `${selectLeftWidth}px`;
    }
    if (menuTextWidth) {
        css["--sectool-select-menu-width"] = `${menuTextWidth}px`;
    }
    css["--sectool-select-menu-top"] = menuPosition.top;
    css["--sectool-select-menu-right"] = menuPosition.right;
    css["--sectool-select-menu-left"] = menuPosition.left;
    css["--sectool-select-menu-bottom"] = menuPosition.bottom;
    return css;
});

// 边距/菜单位置更新
const update = () => {
    if (!container) {
        return;
    }
    // 根据计算菜单宽度
    menuTextWidth = Math.max(
        measureTextMaxWidth(
            getOptions.map(item => item.label),
            "1rem",
        ),
        container.offsetWidth,
    );

    const boundingClientRect = container.getBoundingClientRect();
    // 菜单位置
    const top = boundingClientRect.top;
    const bottom = window.innerHeight - boundingClientRect.bottom;
    const left = boundingClientRect.left;
    const right = window.innerWidth - boundingClientRect.left - 20;
    const menuHeight = container.querySelector("ul")?.offsetHeight || 0;
    const menuWidth = menuTextWidth || 0;

    const isBottom = bottom > menuHeight || bottom > top;
    const isLeft = right > menuWidth;

    menuPosition.top = isBottom ? `${boundingClientRect.bottom}px` : "unset";
    menuPosition.bottom = isBottom ? `unset` : `calc(100vh - ${boundingClientRect.top}px)`;
    menuPosition.left = isLeft ? `${left}px` : "unset";
    menuPosition.right = isLeft ? `unset` : `${window.innerWidth - boundingClientRect.right}px`;

    // 边距
    selectLeftWidth = (container.querySelector(".sectool-select-left") as HTMLElement).offsetWidth;
};

const toggle = () => {
    if (container?.querySelector("ul")) {
        if (container.querySelector("details")?.open) {
            container.querySelector("ul")?.classList.remove("sectool-select-option-hidden");
            searchKeyword = ""; // 打开时清空搜索
            update();
            // 自动聚焦搜索框
            if (props.filterable) {
                nextTick(() => searchInput?.focus());
            }
        } else {
            container.querySelector("ul")?.classList.add("sectool-select-option-hidden");
        }
    }
    if (!props.dialog) {
        return;
    }
    dialogShow = !!container?.querySelector("details")?.open;
};
onMounted(async () => {
    await nextTick();
    update();
});
onMounted(() => {
    container?.querySelector("details")?.addEventListener("toggle", toggle);
});
onUnmounted(() => {
    container?.querySelector("details")?.removeEventListener("toggle", toggle);
});
</script>

<style>
.sectool-select {
    --sectool-select-menu-width: 1px;
    --form-element-spacing-vertical: 0.0625rem;
    --form-element-spacing-horizontal: 0.4rem;
    --text-align: unset;
    --sectool-select-left-padding: 0px;
    --sectool-select-menu-top: unset;
    --sectool-select-menu-right: unset;
    --sectool-select-menu-left: unset;
    --sectool-select-menu-bottom: unset;

    position: relative;
    display: inline-flex;
    --height: var(--sectool-form-item-height);
    width: auto;
    height: var(--height);
    font-size: var(--sectool-form-font-size);
}

.sectool-select[data-disabled="y"] {
    --border-color: var(--form-element-disabled-border-color);
}

.sectool-select details {
    width: 100%;
}

.sectool-select details .sectool-select-summary[role="button"] {
    height: 100%;
    width: 100%;
    display: inline-grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    text-align: var(--text-align);
    padding-top: 0;
    padding-bottom: 0;
    font-size: var(--sectool-form-font-size);
    padding-left: calc(var(--sectool-select-left-padding) + var(--form-element-spacing-horizontal)) !important;
    padding-right: var(--form-element-spacing-horizontal);
}

.sectool-select ul[role="listbox"] {
    --sectool-form-font-size: 0.875rem;
    --form-element-spacing-vertical: 0.8rem;
    --form-element-spacing-horizontal: 0.9rem;
    font-size: var(--sectool-form-font-size);
    min-width: calc(var(--sectool-select-menu-width));
    max-height: 12rem;
    overflow-y: auto;
    position: fixed;
    top: var(--sectool-select-menu-top);
    right: var(--sectool-select-menu-right);
    left: var(--sectool-select-menu-left);
    bottom: var(--sectool-select-menu-bottom);
}

.sectool-select ul[role="listbox"].sectool-select-option-hidden {
    right: -100000px;
}

.sectool-select details[role="list"] .sectool-select-summary + ul li a {
    overflow: unset;
    text-overflow: unset;
    cursor: pointer;
}

.sectool-select[data-type="general"] details .sectool-select-summary {
    --background-color: var(--sectool-background-color);
    --border-color: var(--sectool-border-color);
    --color: var(--sectool-color-primary);
}

.sectool-select[data-type="general"] details .sectool-select-summary:is([aria-current], :hover, :active, :focus) {
    --border-color: var(--sectool-primary);
    --color: var(--sectool-primary);
}

.sectool-select[data-type="general"] details .sectool-select-summary[role="button"]::after {
    background-image: var(--icon-chevron);
}

.sectool-select details[role="list"] .sectool-select-summary::after {
    margin-inline-start: 0.2rem;
}

.sectool-select .sectool-select-left {
    position: absolute;
    top: 1px;
    left: 2px;
}

.sectool-select .sectool-select-prepend {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.4rem;
    height: calc(var(--height) - var(--border-width) * 2) !important;
    background-color: var(--sectool-block-title-bg-color);
    color: var(--sectool-info-color);
    border-right: var(--border-width) solid var(--form-element-border-color);
}

.sectool-select details[role="list"][open] .sectool-select-summary::after {
    transform: rotate(180deg);
}

/* 搜索输入框样式 */
.sectool-select-search-item {
    padding: 0.3rem 0.6rem 0.2rem !important;
    position: sticky;
    top: 0;
    background: var(--sectool-background-color);
    z-index: 1;
    border-bottom: 1px solid var(--sectool-border-color);
    margin-bottom: 0;
}

.sectool-select-search-input {
    width: 100%;
    padding: 0.2rem 0;
    border: none;
    border-radius: 0;
    font-size: 0.8rem;
    height: auto;
    --form-element-spacing-vertical: 0.1rem;
    outline: none;
    background: transparent;
    color: var(--sectool-color-primary);
    box-shadow: none;
    margin: 0;
}

.sectool-select-search-input::placeholder {
    color: var(--sectool-info-color);
    opacity: 0.6;
    font-size: 0.75rem;
}

.sectool-select-search-input:focus {
    border: none;
    box-shadow: none;
}

/* 无搜索结果提示 */
.sectool-select-no-result {
    padding: 0.5rem 0.9rem !important;
    color: var(--sectool-info-color);
    font-size: 0.8rem;
    text-align: center;
    cursor: default;
}

/* dialog 模式搜索框 */
.sectool-select-dialog-search {
    width: 100%;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--sectool-border-color);
    border-radius: 4px;
    font-size: 0.85rem;
    outline: none;
    background: var(--sectool-background-color);
    color: var(--sectool-color-primary);
}

.sectool-select-dialog-search:focus {
    border-color: var(--sectool-primary);
}
</style>
