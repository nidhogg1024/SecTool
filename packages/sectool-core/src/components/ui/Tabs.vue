<template>
    <div class="sectool-tabs" ref="container" :style="{...(height ? {height:sizeConvert(height)} : {})}">
        <div class="sectool-tabs-header">
            <div class="sectool-tabs-header-item">
                <span v-for="item in lists" :key="item.name" @click="current = item.name">{{ item.label }}</span>
            </div>
            <div class="sectool-tabs-header-fill"><slot name="extra" /></div>
        </div>
        <div class="sectool-tabs-body" :style="{padding:`${padding}`}" v-if="currentIndex !== -1" :class="`sectool-tabs-current-${currentIndex}`">
            <slot/>
        </div>
    </div>
</template>

<script setup lang="ts">
// tabs
import {nextTick, onMounted, PropType, watch} from "vue"
import {TabsListsType} from "@/types";
import {heightResizeDispatch} from "@/event";
import {sizeConvert} from "../util";

const props = defineProps({
    modelValue: {
        type: String,
        default: ""
    },
    lists: {
        type: Array as PropType<TabsListsType>,
        default: []
    },
    padding: {
        type: String,
        default: "5px"
    },
    height: {
        type: [Number, String],
        default: ""
    },
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const container = $ref<HTMLElement | null>(null)
let currentIndex = $ref(-1)

const current = $ref(props.modelValue)

const update = async () => {
    if (!container) {
        return;
    }
    let index = 0
    for (let i = 0; i < props.lists.length; i++) {
        if (props.lists[i].name === current) {
            index = i
            break
        }
    }
    currentIndex = index
    container.querySelectorAll(".sectool-tabs-header-item > span").forEach((el, key) => {
        el.classList[key === index ? "add" : "remove"]("sectool-tabs-current")
    })
    await nextTick()
    heightResizeDispatch()
}

onMounted(() => {
    update()
})

watch(() => current, (value) => {
    update()
    emit('update:modelValue', value)
})
</script>
<style>
.sectool-tabs {
    background-color: var(--sectool-block-content-bg-color);
    border: 1px solid var(--sectool-border-color);
    border-radius: var(--border-radius);
    width: 100%;
    display: grid;
    grid-template-rows: auto minmax(0px, 1fr);
    height: auto;
}

.sectool-tabs-header {
    background-color: var(--sectool-block-title-bg-color);
    height: 2.2rem;
    display: grid;
    grid-template-columns: auto minmax(0px, 1fr);
}

.sectool-tabs-header-fill {
    height: 100%;
    border-bottom: 1px solid var(--sectool-border-color);
    display: flex;
    justify-content: right;
    align-items: center;
    padding-right: 10px;
}

.sectool-tabs-header-item > span {
    height: 100%;
    display: inline-flex;
    padding: 0 .9rem;
    border-bottom: 1px solid var(--sectool-border-color);
    font-size: .875rem;
    align-items: center;
    justify-content: center;
    color: var(--sectool-color-secondary);
    font-weight: 500;
    cursor: pointer;
}

.sectool-tabs-header-item > span.sectool-tabs-current {
    border-right: 1px solid var(--sectool-border-color);
    border-left: 1px solid var(--sectool-border-color);
    border-bottom: none;
    color: var(--sectool-primary);
}

.sectool-tabs-header-item > span.sectool-tabs-current:first-child {
    border-left: none;
}

.sectool-tabs-header-item > span:hover {
    color: var(--sectool-primary);
}

.sectool-tabs-current-0 > *:not(:nth-child(1)) {
    display: none !important;
}

.sectool-tabs-current-1 > *:not(:nth-child(2)) {
    display: none !important;
}

.sectool-tabs-current-2 > *:not(:nth-child(3)) {
    display: none !important;
}

.sectool-tabs-current-3 > *:not(:nth-child(4)) {
    display: none !important;
}

.sectool-tabs-current-4 > *:not(:nth-child(5)) {
    display: none !important;
}

.sectool-tabs-current-5 > *:not(:nth-child(6)) {
    display: none !important;
}

.sectool-tabs-current-6 > *:not(:nth-child(7)) {
    display: none !important;
}

.sectool-tabs-current-7 > *:not(:nth-child(8)) {
    display: none !important;
}
</style>
