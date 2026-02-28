<template>
    <div :style="style" class="sectool-message" ref="container">
        <Transition name="sectool-message">
            <div class="sectool-message-block" v-if="show" :class="`sectool-message-${type}`">
                <Icon :name="type" style="margin-right: 5px"/>
                <div class="sectool-message-content">
                    <template v-if="!info.includes(`\n`)">
                        {{ info }}
                    </template>
                    <pre v-else><code>{{ info }}</code></pre>
                </div>
            </div>
        </Transition>
    </div>
</template>
<script setup lang="ts">
// 消息提示
import {PropType, StyleValue, onMounted, onUnmounted} from "vue";
import {MessageType} from '@/types'
import Icon from './ui/Icon.vue'
import {sizeConvert} from './util'

const props = defineProps({
    type: {
        type: String as PropType<MessageType>,
        default: 'info'
    },
    info: {
        type: String,
        default: ""
    },
    offset: {
        type: Number,
        default: 0
    },
    close: {
        type: Function,
        default() {
        }
    }
})

const container = $ref<HTMLDialogElement | null>(null)

let show = $ref(false)

const open = () => {
    show = true
}

const exposeClose = () => {
    show = false
}

const style = $computed(() => {
    const css: StyleValue = {
        "--position-top": sizeConvert(props.offset)
    }
    return css
})

const clickClose = (event: MouseEvent) => {
    if (!container?.contains(event.target as any)) {
        props.close()
    }
}

onMounted(() => {
    setTimeout(() => document.addEventListener('click', clickClose), 100)
})

onUnmounted(() => {
    document.removeEventListener('click', clickClose);
})

defineExpose({open, exposeClose});
</script>
<style>

.sectool-message {
    --position-top: 60px;
    position: fixed;
    top: var(--position-top);
    right: 20px;
    z-index: 10000;
}

.sectool-message-block {
    display: flex;
    gap: 8px;
    align-items: center;
    width: fit-content;
    max-width: min(420px, calc(100vw - 3rem));
    font-size: 13px;
    line-height: 1.4;
    color: var(--sectool-message-color);
    background-color: var(--sectool-message-background-color);
    border: 1px solid var(--sectool-message-border-color);
    border-radius: 8px;
    padding: 10px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(8px);
}

.sectool-message-block .sectool-message-content {
    max-height: calc(100vh - 6rem);
    line-height: 24px;
    overflow-y: auto;
}

.sectool-message pre, .sectool-message pre > code {
    color: currentColor;
    background-color: transparent;
}

.sectool-message-success {
    --sectool-message-color: var(--sectool-primary);
    --sectool-message-border-color: #e1f3d8;
    --sectool-message-background-color: #edfcf7;
}

[data-theme="dark"] .sectool-message-success {
    --sectool-message-border-color: #25371c;
    --sectool-message-background-color: #002421;
}

.sectool-message-error {
    --sectool-message-color: #f56c6c;
    --sectool-message-border-color: #fde2e2;
    --sectool-message-background-color: #fef0f0;
}

[data-theme="dark"] .sectool-message-error {
    --sectool-message-border-color: #412626;
    --sectool-message-background-color: #2b1d1d;
}

.sectool-message-info {
    --sectool-message-color: #909399;
    --sectool-message-border-color: #e9e9eb;
    --sectool-message-background-color: #f4f4f5;
}

[data-theme="dark"] .sectool-message-info {
    --sectool-message-color: #909399;
    --sectool-message-border-color: #2d2d2f;
    --sectool-message-background-color: #202121;
}

.sectool-message-enter-active, .sectool-message-leave-active {
    transition: all 0.3s ease-in-out;
}

.sectool-message-enter-from {
    transform: translateX(100%);
    opacity: 0;
}
.sectool-message-leave-to {
    transform: translateX(40%);
    opacity: 0;
}
</style>
