<template>
    <div class="st-history">
        <div class="st-history-toolbar" v-if="length > 0">
            <span class="st-history-count">{{ length }} {{ $t('main_history') }}</span>
            <Button size="small" type="danger" @click="clear">{{ $t("main_history_clear") }}</Button>
        </div>

        <div class="st-history-list" v-if="length > 0">
            <div class="st-history-item" v-for="(row, index) in lists" :key="index">
                <div class="st-history-item-time">{{ row.t }}</div>
                <div class="st-history-item-preview">{{ tableDataHandle(row.v) }}</div>
                <div class="st-history-item-actions">
                    <button class="st-history-btn" @click="() => view(row.v)">{{ $t("main_ui_views") }}</button>
                    <button class="st-history-btn st-primary" @click="() => load(index)">{{ $t("main_ui_load") }}</button>
                </div>
            </div>
        </div>

        <div class="st-history-empty" v-else>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>{{ $t('main_history_null') }}</span>
        </div>
    </div>

    <Modal v-model="viewData.show" width="70%">
        <Textarea :model-value="JSON.stringify(viewData.data, null, '\t')" height="300" />
    </Modal>
</template>

<script setup lang="ts">
import useOperate from "@/store/operate";
import getHistoryInstance from "@/helper/history";
import event from "@/event";
import { instanceOfInput } from "@/helper/util";
import { isPlainObject, isString, isNumber } from "lodash";

const storeOperate = useOperate();

const lists = getHistoryInstance(storeOperate.items.tool, storeOperate.items.feature).all();
const length = getHistoryInstance(storeOperate.items.tool, storeOperate.items.feature).length();

const clear = () => {
    getHistoryInstance(storeOperate.items.tool, storeOperate.items.feature).clear();
    event.dispatch("extend_page_close");
};

const viewData = $ref({ show: false, data: {} });

const view = (item: any) => {
    viewData.data = item;
    viewData.show = true;
};

const load = (index: number = 0) => {
    storeOperate.redirectTool(storeOperate.items.tool, storeOperate.items.feature, storeOperate.items.category, index);
};

const tableDataHandle = (item: any) => {
    if ((isPlainObject(item) && "input" in item) && (JSON.stringify(item).length > 150 || Object.keys(item).length === 1)) {
        const input = item.input;
        if (instanceOfInput(input)) {
            return input.value;
        }
        if (isString(input) || isNumber(input)) {
            return `${input}`;
        }
        return JSON.stringify(input);
    }
    return JSON.stringify(item);
};
</script>

<style scoped>
.st-history {
    padding: 12px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.st-history-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    flex-shrink: 0;
}
.st-history-count {
    font-size: 12px;
    color: var(--sectool-color-secondary);
    font-weight: 500;
}

.st-history-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.st-history-item {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--sectool-border-color);
    background: var(--sectool-form-element-background-color);
    transition: border-color 0.15s;
}
.st-history-item:hover {
    border-color: var(--sectool-primary);
}

.st-history-item-time {
    font-size: 11px;
    color: var(--sectool-info-color);
    margin-bottom: 6px;
}

.st-history-item-preview {
    font-size: 12px;
    font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
    color: var(--color);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 60px;
    overflow: hidden;
    line-height: 1.5;
    margin-bottom: 8px;
}

.st-history-item-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
}

.st-history-btn {
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid var(--sectool-border-color);
    background: transparent;
    color: var(--sectool-color-secondary);
    cursor: pointer;
    transition: all 0.12s;
}
.st-history-btn:hover {
    border-color: var(--sectool-primary);
    color: var(--sectool-primary);
}
.st-history-btn.st-primary {
    background: var(--sectool-primary);
    border-color: var(--sectool-primary);
    color: #fff;
}
.st-history-btn.st-primary:hover {
    opacity: 0.85;
}

.st-history-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--sectool-info-color);
    font-size: 13px;
}
</style>
