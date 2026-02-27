<template>
    <Tooltip :content="tooltip">
        <a class="sectool-link" :data-type="type" @click="click" v-bind="$attrs">
            <slot></slot>
        </a>
    </Tooltip>
</template>
<script lang="ts">
export default {
    inheritAttrs: false
}
</script>
<script setup lang="ts">
import {openUrl} from "@/helper/helper"
import {PropType} from "vue";
import {LinkType} from "@/types";
const props = defineProps({
    href: {
        type: String,
        default: ""
    },
    type: {
        type: String as PropType<LinkType>,
        default: "default"
    },
    tooltip: {
        type: String,
        default: ""
    },
})

const emit = defineEmits<{ (e: 'click'): void }>()

const click = () => {
    if (props.href !== "") {
        openUrl(props.href)
    }
    emit('click')
    return false
}
</script>
<style>
.sectool-link {
    cursor: pointer;
}

.sectool-link[data-type="default"] {
    --primary: var(--sectool-color-primary);
}
</style>
