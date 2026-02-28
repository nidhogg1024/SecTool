<template>
    <Teleport to="#sectool-append">
        <Transition name="st-sheet-backdrop">
            <div class="st-sheet-backdrop" v-if="show" @click.self="close"></div>
        </Transition>
        <Transition name="st-sheet">
            <div class="st-sheet" v-if="show" v-bind="$attrs">
                <div class="st-sheet-header">
                    <span class="st-sheet-title">{{ titleText }}</span>
                    <button class="st-sheet-close" @click="close" :title="closeTextI18n">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="st-sheet-body">
                    <slot></slot>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
<script lang="ts">
import Event from "@/event";

export default {
    inheritAttrs: false,
};
</script>
<script setup lang="ts">
import {onMounted, onUnmounted, watch} from "vue";
import event, {componentResizeDispatch} from "@/event";

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    disableReplace: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: ''
    },
    // 保留兼容旧调用
    offset: {
        type: Number,
        default: 0
    },
    closeText: {
        type: String,
        default: ''
    }
})

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        Event.dispatch('extend_page_close')
    }
});

let closeI18n = $ref($t(`main_ui_close`));
event.addListener("locale_change", () => {
    closeI18n = $t(`main_ui_close`)
});
const closeTextI18n = $computed(() => {
    return props.closeText || closeI18n
})
const titleText = $computed(() => {
    return props.title || ''
})

let show = $computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

let isCurrentOpen = false;

watch(() => show, (is) => {
    if (is && !props.disableReplace) {
        isCurrentOpen = true;
        event.dispatch('extend_page_close')
    }
    if (is) {
        setTimeout(() => {
            componentResizeDispatch()
        }, 400)
    }
}, {immediate: true})

const close = () => show = false

const closeExtendPageListener = () => {
    if (isCurrentOpen) {
        isCurrentOpen = false
        return;
    }
    close()
}

onMounted(() => {
    event.addListener('extend_page_close', closeExtendPageListener)
})
onUnmounted(() => {
    event.removeListener('extend_page_close', closeExtendPageListener)
})
</script>

<style>
/* ===== 右侧 Sheet 抽屉 ===== */
.st-sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 90;
}

.st-sheet {
    position: fixed;
    top: 0;
    right: 0;
    width: 460px;
    max-width: 90vw;
    height: 100vh;
    z-index: 91;
    display: flex;
    flex-direction: column;
    background: var(--sectool-background-color);
    border-left: 1px solid var(--sectool-border-color);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
}

.st-sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--sectool-border-color);
    flex-shrink: 0;
}

.st-sheet-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.st-sheet-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--sectool-color-secondary);
    cursor: pointer;
    transition: all 0.12s;
    flex-shrink: 0;
}
.st-sheet-close:hover {
    background: var(--primary-focus);
    color: var(--color);
}

.st-sheet-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--sectool-border-color) transparent;
}
.st-sheet-body::-webkit-scrollbar {
    width: 4px;
}
.st-sheet-body::-webkit-scrollbar-thumb {
    background: var(--sectool-border-color);
    border-radius: 4px;
}

/* ===== 遮罩动画 ===== */
.st-sheet-backdrop-enter-active,
.st-sheet-backdrop-leave-active {
    transition: opacity 0.25s ease;
}
.st-sheet-backdrop-enter-from,
.st-sheet-backdrop-leave-to {
    opacity: 0;
}

/* ===== Sheet 滑入动画 ===== */
.st-sheet-enter-active {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.st-sheet-leave-active {
    transition: transform 0.2s ease-in;
}
.st-sheet-enter-from,
.st-sheet-leave-to {
    transform: translateX(100%);
}

/* ===== 小屏全宽 ===== */
@media (max-width: 520px) {
    .st-sheet {
        width: 100vw;
        max-width: 100vw;
    }
}
</style>
