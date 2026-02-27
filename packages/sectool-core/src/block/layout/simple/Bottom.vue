<template>
    <div class="sectool-bottom">
        <span style="font-size: 13px;font-weight: bold;cursor: pointer;" @click="openTools = !openTools">{{ $t(`main_category_common`) }}:</span>
        <div class="sectool-bottom-tools">
            <div
                v-for="tool in tools"
                class="sectool-bottom-tools-item"
                :class="storeOperate.items.tool === tool.name ? `sectool-bottom-tools-item-current` : ``"
                @click="redirectTool(tool.name)"
            >
                {{ $t(`tool_${tool.name}`) }}
            </div>
        </div>
    </div>
    <ExtendPage v-model="openTools">
        <Tools/>
    </ExtendPage>
</template>

<script setup lang="ts">
import useSetting from "@/store/setting";
import Tools from "../../Tools.vue";
import {getTool} from "@/config";
import useOperate from "@/store/operate";

const storeSetting = useSetting()
const storeOperate = useOperate()
const openTools = $ref(false);

const tools = $computed(() => {
    return storeOperate.getSmartCommon(storeSetting.items.common).map(name => {
        return getTool(name)
    })
})

const redirectTool = (tool: string) => storeOperate.redirectTool(tool)
</script>

<style scoped>
.sectool-bottom {
    height: 33px;
    box-sizing: border-box;
    padding: 0 10px 0 5px;
    display: grid;
    column-gap: 5px;
    grid-template-columns: auto minmax(0px, 1fr);
    align-items: center;
    border-top: 1px var(--sectool-border-color) solid;
    background-color: var(--sectool-block-title-bg-color);
    overflow: hidden;
}

.sectool-bottom-tools {
    height: 33px;
}

.sectool-bottom-tools-item {
    line-height: 33px;
    height: 33px;
    font-size: 13px;
    display: inline-block;
    padding: 0 5px;
    cursor: pointer;
    border-left: 1px var(--sectool-border-color) solid;
    user-select: none;
}

.sectool-bottom-tools-item:first-child {
    border-left: none;
}
.sectool-bottom-tools-item-current{
    color: var(--sectool-primary);
}
.sectool-bottom-tools-item:hover {
    color: var(--sectool-primary);
}

/* ===== 小屏适配 ===== */
@media (max-width: 768px) {
    .sectool-bottom {
        height: 40px;
        padding: 0 6px;
    }
    .sectool-bottom-tools {
        height: 40px;
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .sectool-bottom-tools::-webkit-scrollbar {
        display: none;
    }
    .sectool-bottom-tools-item {
        line-height: 40px;
        height: 40px;
    }
}
@media (max-width: 480px) {
    .sectool-bottom {
        height: 38px;
        padding: 0 4px;
    }
    .sectool-bottom-tools {
        height: 38px;
    }
    .sectool-bottom-tools-item {
        line-height: 38px;
        height: 38px;
        font-size: 12px;
        padding: 0 4px;
    }
}
</style>
