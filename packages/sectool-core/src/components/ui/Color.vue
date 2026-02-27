<template>
    <div class="sectool-color" :data-size="size" :style="style">
        <input
            type="color"
            v-model="current"
            :disabled="disabled"
        />
        <div class="sectool-color-left" ref="inputLeft">
            <div class="sectool-color-prepend" v-if="label!==''" :class="label !== '' ? `sectool-input-label` : ``">
                {{ label }}
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import {onMounted, onUnmounted, onUpdated, PropType, StyleValue} from "vue";
import {ComponentSizeType} from "@/types";
import event from "@/event";

const props = defineProps({
    modelValue: {
        type: String,
        default: "#666666"
    },
    size: {
        type: String as PropType<ComponentSizeType>,
        default: "default"
    },
    disabled: {
        type: Boolean,
        default: false
    },
    label: {
        type: String,
        default: ""
    },
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
const inputLeft = $ref<HTMLElement | null>(null)
let inputLeftWidth = $ref(0)

const current = $computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const style = $computed(() => {
    const css: StyleValue = {}
    if (inputLeftWidth) {
        css['--sectool-color-left-padding'] = `${inputLeftWidth}px`
    }
    return css
})

onMounted(() => {
    updatePadding()
    event.addListener('component_resize', updatePadding)
})
onUpdated(() => {
    updatePadding()
})
onUnmounted(() => {
    event.removeListener("component_resize", updatePadding)
})

const updatePadding = () => {
    if (!inputLeft) {
        return;
    }
    inputLeftWidth = inputLeft.offsetWidth
}
</script>

<style>
.sectool-color {
    position: relative;
    --height: var(--sectool-form-item-height);
    --form-element-spacing-vertical: .3rem;
    --form-element-spacing-horizontal: .3rem;
    --sectool-color-left-padding: 0px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--sectool-form-font-size);
}

.sectool-color input[type="color"] {
    width: calc(var(--sectool-color-left-padding) + var(--height));
    height: calc(var(--height));
    padding-left: calc(var(--sectool-color-left-padding) + var(--form-element-spacing-horizontal)) !important;
    cursor: pointer;
}


.sectool-color-prepend {
    border-right: var(--border-width) solid var(--form-element-border-color);
    background-color: var(--sectool-block-title-bg-color);
    color: var(--sectool-info-color);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 .4rem;
    height: calc(var(--height) - var(--border-width) * 2) !important;
}

.sectool-color-left {
    left: 2px;
    position: absolute;
    top: 1px;
}
</style>
