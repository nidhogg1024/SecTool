<template>
    <Tooltip :content="props.tooltip">
        <div
            class="sectool-button"
            :data-size="props.size"
            :data-type="props.type"
            :style="props.long ? {width:'100%'} : {}"
        >
            <button @click="click" :disabled="props.disabled" :aria-busy="props.loading ? `true` : `false`">
                <slot>{{ text }}</slot>
            </button>
        </div>
    </Tooltip>
</template>

<script setup lang="ts">
import {PropType} from "vue"
import {ButtonType, ComponentSizeType} from "@/types"

const props = defineProps({
    type: {
        type: String as PropType<ButtonType>,
        default: "general"
    },
    size: {
        type: String as PropType<ComponentSizeType>,
        default: "default"
    },
    text: {
        type: String,
        default: ""
    },
    long: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    },
    tooltip: {
        type: String,
        default: ""
    },
})

const emit = defineEmits<{ (e: 'click'): void }>()

const click = () => emit('click')

</script>
<style>
.sectool-button {
    display: inline-flex;
    --height: var(--sectool-form-item-height);
    width: auto;
    height: var(--height);
}

.sectool-button button {
    height: 100%;
    width: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0 calc(var(--sectool-form-font-size) * 0.7);
    font-size: var(--sectool-form-font-size);
}
.sectool-button button::before {
    --spacing:1rem;
}

.sectool-button[data-type="general"] button {
    --background-color: var(--sectool-form-element-background-color);
    --border-color: var(--sectool-border-color);
    --color: var(--color);
}

.sectool-button[data-type="general"] button:is([aria-current],:hover,:active,:focus) {
    --border-color: var(--sectool-primary);
    --color: var(--sectool-primary);
}

.sectool-button[data-type="dotted"] button {
    --background-color: var(--sectool-form-element-background-color);
    --border-color: var(--sectool-border-color);
    --color: var(--color);
    border-style: dashed;
}
.sectool-button[data-type="dotted"] button:is([aria-current],:hover,:active,:focus) {
    --border-color: var(--sectool-primary);
    --color: var(--sectool-primary);
}

.sectool-button[data-type="danger"] button {
    --background-color: #ed4014;
    --border-color: #ed4014;
    --color: #fff;
}

.sectool-button[data-type="danger"] button:is([aria-current],:hover,:active,:focus) {
    --background-color: #f89898;
    --border-color: #f89898;
    --color: #fff;
}
</style>
