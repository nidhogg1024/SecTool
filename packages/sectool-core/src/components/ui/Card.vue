<template>
    <div class="sectool-card" :style="style">
        <div class="sectool-card-header" v-if="title !== ''">
            <div class="sectool-card-title">{{ title }}</div>
            <div class="sectool-card-extra">
                <slot name="extra"></slot>
            </div>
        </div>
        <div class="sectool-card-body" :style="{padding:`${padding}`}" ref="body">
            <slot></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
import {sizeConvert} from "../util"
import {StyleValue, onMounted, onUnmounted} from "vue";
import {componentResizeDispatch} from "@/event";

const props = defineProps({
    title: {
        type: String,
        default: ""
    },
    padding: {
        type: String,
        default: "5px"
    },
    height: {
        type: [Number, String],
        default: ""
    }
})
const body = $ref<HTMLElement | null>(null)

onMounted(() => {
    body?.addEventListener('scroll', componentResizeDispatch)
})

onUnmounted(() => {
    body?.removeEventListener('scroll', componentResizeDispatch)
})

const style = $computed(() => {
    const css: StyleValue = {}
    if (props.height) {
        css.height = sizeConvert(props.height)
    }
    if (props.title === "") {
        css.gridTemplateRows = 'minmax(0px, 1fr)'
    }
    return css
})
</script>
<style>
.sectool-card {
    width: 100%;
    background-color: var(--sectool-block-content-bg-color);
    border: 1px solid var(--sectool-border-color);
    border-radius: 8px;
    display: grid;
    grid-template-rows: auto minmax(0px, 1fr);
    height: auto;
}

.sectool-card-header {
    padding: 0 12px;
    background-color: var(--sectool-block-title-bg-color);
    border-bottom: 1px solid var(--sectool-border-color);
    border-radius: 8px 8px 0 0;
    display: flex;
    height: 36px;
    justify-content: space-between;
    align-items: center;
}

.sectool-card-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-color-secondary);
}

.sectool-card-extra {
    font-size: 12px;
}

.sectool-card-body {
    overflow-y: auto;
}
</style>
