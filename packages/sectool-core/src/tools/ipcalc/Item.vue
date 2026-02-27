<template>
    <div style="cursor: pointer" @click="$copy(`${props.value}`)" class="sectool-ipcalc-item">
        <div class="sectool-ipcalc-item-value">{{ props.value }}</div>
        <div class="sectool-ipcalc-item-title" v-if="props.title !== ''">{{ props.title }}</div>
    </div>
</template>

<script lang="ts" setup>
const props = defineProps({
    title: {
        type: String,
        default: ""
    },
    value: {
        type: [String,Number],
        default: ""
    }
})
</script>
<style scoped>
.sectool-ipcalc-item {
    display: inline-block;
    cursor: pointer;
    padding: 5px 16px;
    font-size: .875rem;
}
.sectool-ipcalc-item:hover{
    background-color: var(--primary-focus);
}
.sectool-ipcalc-item-title {
    line-height: 14px;
    font-size: .75rem;
    color: var(--sectool-placeholder-text-color);
}

.sectool-ipcalc-item-value {
    line-height: 18px;
}
</style>
