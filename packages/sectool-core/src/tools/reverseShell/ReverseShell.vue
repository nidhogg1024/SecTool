<template>
    <div v-row="'10-14'">
        <Align direction="vertical">
            <Display>
                <Align direction="vertical">
                    <Input v-model="action.current.lhost" :label="$t('reverseShell_lhost')" placeholder="10.10.10.1" />
                    <Input v-model="action.current.lport" :label="$t('reverseShell_lport')" placeholder="4444" />
                    <Select
                        v-model="action.current.selectedCategory"
                        :label="$t('reverseShell_type')"
                        :options="categoryOptions"
                    />
                </Align>
                <template #extra>
                    <Align>
                        <Bool
                            size="small"
                            v-model="action.current.showListener"
                            border
                            :label="$t('reverseShell_listener')"
                        />
                        <Bool
                            size="small"
                            v-model="action.current.urlEncode"
                            border
                            :label="$t('reverseShell_url_encode')"
                        />
                        <Bool
                            size="small"
                            v-model="action.current.base64Encode"
                            border
                            :label="$t('reverseShell_base64')"
                        />
                    </Align>
                </template>
            </Display>
        </Align>
        <HeightResize v-slot="{ height }">
            <div :style="{ height: height + 'px', overflowY: 'auto' }">
                <!-- 监听端命令 -->
                <template v-if="action.current.showListener">
                    <div class="sectool-revshell-section-title">{{ $t('reverseShell_listener_title') }}</div>
                    <template v-for="item in renderedListeners" :key="item.name">
                        <Textarea
                            :model-value="item.command"
                            :height="42"
                            :placeholder="item.name"
                            :copy="item.name"
                        />
                    </template>
                    <div style="margin-bottom:10px" />
                </template>
                <!-- Shell 命令 -->
                <div class="sectool-revshell-section-title">{{ currentCategoryName }}</div>
                <template v-for="item in renderedShells" :key="item.id">
                    <Textarea
                        :model-value="item.rendered"
                        :height="52"
                        :placeholder="item.name"
                        :copy="item.name"
                    />
                </template>
                <!-- TTY 升级 -->
                <div class="sectool-revshell-section-title" style="margin-top:10px">
                    {{ $t('reverseShell_tty_title') }}
                </div>
                <template v-for="(cmd, idx) in ttyUpgradeCommands" :key="idx">
                    <Textarea
                        :model-value="cmd"
                        :height="42"
                        :placeholder="`TTY #${idx + 1}`"
                        :copy="`TTY #${idx + 1}`"
                    />
                </template>
            </div>
        </HeightResize>
    </div>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"
import { shellCategories, listenerCommands, ttyUpgradeCommands, renderTemplate } from "./shells"
import { Base64 } from "js-base64"

const categoryOptions = shellCategories.map(c => ({
    value: c.name,
    label: c.name,
}))

const action = useAction(await initialize({
    lhost: "10.10.10.1",
    lport: "4444",
    selectedCategory: shellCategories[0]?.name || "",
    showListener: true,
    urlEncode: false,
    base64Encode: false,
}))

const currentCategoryName = $computed(() => action.current.selectedCategory)

const renderedListeners = $computed(() => {
    return listenerCommands.map(item => ({
        name: item.name,
        command: renderTemplate(item.command, action.current.lhost, action.current.lport),
    }))
})

const renderedShells = $computed(() => {
    const category = shellCategories.find(c => c.name === action.current.selectedCategory)
    if (!category) return []

    return category.shells.map(shell => {
        let rendered = renderTemplate(shell.template, action.current.lhost, action.current.lport)

        if (action.current.base64Encode) {
            const encoded = Base64.encode(rendered)
            rendered = `echo ${encoded} | base64 -d | sh`
        } else if (action.current.urlEncode) {
            rendered = encodeURIComponent(rendered)
        }

        return {
            id: shell.id,
            name: shell.name,
            rendered,
        }
    })
})
</script>

<style scoped>
.sectool-revshell-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 6px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
</style>
