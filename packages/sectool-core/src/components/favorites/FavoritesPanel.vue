<template>
    <div class="sectool-favorites">
        <!-- 顶部操作栏：搜索 + 全局操作 -->
        <div class="sectool-fav-toolbar">
            <Input
                v-model="searchKeyword"
                placeholder="搜索收藏..."
                class="sectool-fav-search"
            />
            <Align gap="small">
                <Button size="small" @click="handleAddCustom" text="+ 自定义" tooltip="添加自定义 Payload" />
                <Button size="small" @click="handleExport" text="导出" tooltip="导出收藏为 JSON" />
                <Button size="small" @click="handleImport" text="导入" tooltip="从 JSON 导入" />
            </Align>
        </div>

        <!-- 分组选择器 -->
        <div class="sectool-fav-groups">
            <span
                class="sectool-fav-group-tag"
                :class="{ 'is-active': activeGroup === '' }"
                @click="activeGroup = ''"
            >
                全部 ({{ items.length }})
            </span>
            <span
                v-for="group in groups"
                :key="group.name"
                class="sectool-fav-group-tag"
                :class="{ 'is-active': activeGroup === group.name }"
                :style="group.color ? { '--tag-color': group.color } : {}"
                @click="activeGroup = group.name"
            >
                {{ group.name }} ({{ getGroupCount(group.name) }})
            </span>
            <span class="sectool-fav-group-add" @click="handleCreateGroup">+ 分组</span>
        </div>

        <!-- 收藏列表 -->
        <div class="sectool-fav-list" v-if="filteredItems.length > 0">
            <div
                v-for="item in filteredItems"
                :key="item.id"
                class="sectool-fav-item"
            >
                <div class="sectool-fav-item-header">
                    <!-- 星标（始终填充，因为都在收藏列表内） -->
                    <span class="sectool-fav-star">★</span>
                    <!-- 名称 -->
                    <span class="sectool-fav-item-name" :title="item.name">{{ item.name }}</span>
                    <!-- 来源工具徽章 -->
                    <span v-if="item.sourceTool" class="sectool-fav-badge">{{ item.sourceTool }}</span>
                    <span v-if="item.sourceCategory" class="sectool-fav-badge sectool-fav-badge-cat">{{ item.sourceCategory }}</span>
                </div>

                <!-- 内容预览 -->
                <div class="sectool-fav-item-content" :title="item.content">
                    {{ truncate(item.content, 120) }}
                </div>

                <!-- 标签 + 备注 -->
                <div class="sectool-fav-item-meta" v-if="item.tags?.length || item.note">
                    <span v-for="tag in item.tags" :key="tag" class="sectool-fav-tag">{{ tag }}</span>
                    <span v-if="item.note" class="sectool-fav-note" :title="item.note">📝 {{ truncate(item.note, 40) }}</span>
                </div>

                <!-- 操作按钮 -->
                <div class="sectool-fav-item-actions">
                    <Button size="small" @click="handleCopy(item.content)" text="复制" />
                    <Button size="small" @click="handleEdit(item)" text="编辑" />
                    <!-- 移动分组下拉 -->
                    <Select
                        v-model="item.group"
                        :options="groupOptions"
                        size="small"
                        @change="handleMoveGroup(item.id, item.group)"
                    />
                    <Button size="small" type="danger" @click="handleRemove(item.id)" text="删除" />
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div class="sectool-fav-empty" v-else>
            <div class="sectool-fav-empty-icon">☆</div>
            <div>{{ searchKeyword ? '没有匹配的收藏' : '暂无收藏' }}</div>
            <div class="sectool-fav-empty-hint">在任意工具的 payload 旁点击 ☆ 即可添加收藏</div>
        </div>

        <!-- 添加自定义 Payload 内联表单 -->
        <Modal v-model="showAddModal" title="添加自定义 Payload" @ok="doAddCustom" @cancel="showAddModal = false">
            <div class="sectool-fav-form">
                <Input v-model="addForm.name" label="名称" placeholder="给这个 Payload 起个名字" />
                <Textarea v-model="addForm.content" :height="120" placeholder="输入 Payload 内容..." />
                <Input v-model="addForm.sourceTool" label="来源工具" placeholder="(可选) xss, sqli, lfi..." />
                <Input v-model="addForm.tags" label="标签" placeholder="(可选) 逗号分隔：tag1, tag2" />
                <Input v-model="addForm.note" label="备注" placeholder="(可选) 备注信息" />
                <Select
                    v-model="addForm.group"
                    :options="groupOptions"
                    label="分组"
                />
            </div>
        </Modal>

        <!-- 编辑收藏弹窗 -->
        <Modal v-model="showEditModal" title="编辑收藏" @ok="doEdit" @cancel="showEditModal = false">
            <div class="sectool-fav-form">
                <Input v-model="editForm.name" label="名称" />
                <Textarea v-model="editForm.content" :height="120" />
                <Input v-model="editForm.sourceTool" label="来源工具" />
                <Input v-model="editForm.tags" label="标签" placeholder="逗号分隔" />
                <Input v-model="editForm.note" label="备注" />
                <Select
                    v-model="editForm.group"
                    :options="groupOptions"
                    label="分组"
                />
            </div>
        </Modal>

        <!-- 导入弹窗 -->
        <Modal v-model="showImportModal" title="导入收藏" @ok="doImport" @cancel="showImportModal = false">
            <Textarea v-model="importJson" :height="200" placeholder="粘贴 JSON 内容..." />
            <div style="margin-top: 8px;">
                <Bool v-model="importReplace" label="替换现有收藏" border size="small" />
            </div>
        </Modal>

        <!-- 分组管理弹窗 -->
        <Modal v-model="showGroupModal" title="新建分组" @ok="doCreateGroup" @cancel="showGroupModal = false">
            <Input v-model="newGroupName" label="分组名称" placeholder="输入新分组名称" />
            <div style="margin-top: 8px;">
                <Input v-model="newGroupColor" label="颜色标记 (可选)" placeholder="#1abc9c" />
            </div>
        </Modal>
    </div>
</template>

<script lang="ts" setup>
/**
 * 收藏管理面板
 *
 * 完整的收藏夹管理界面，支持：
 * - 按分组筛选 / 全局搜索
 * - 查看、复制、编辑、删除收藏
 * - 移动收藏到不同分组
 * - 添加自定义 Payload
 * - 导入导出 JSON
 * - 创建 / 删除 / 重命名分组
 */
import { computed, reactive } from "vue"
import { useFavorites, type FavoriteItem } from "@/store/favorites"
import { copy as copyText } from "@/helper/clipboard"
import Message from "@/helper/message"

// ======================== 初始化 composable ========================

const {
    items,
    groups,
    addFavorite,
    removeFavorite,
    updateFavorite,
    moveFavorite,
    createGroup,
    searchFavorites,
    exportFavorites,
    importFavorites,
    getFavoritesByGroup,
} = useFavorites()

// ======================== 筛选 & 搜索 ========================

/** 当前选中的分组名，空字符串表示"全部" */
let activeGroup = $ref("")
/** 搜索关键字 */
let searchKeyword = $ref("")

/** 统计指定分组的收藏数量 */
const getGroupCount = (groupName: string): number => {
    return items.value.filter(item => item.group === groupName).length
}

/** 经过分组 + 搜索筛选后的列表 */
const filteredItems = $computed(() => {
    let result: FavoriteItem[]

    if (searchKeyword.trim()) {
        result = searchFavorites(searchKeyword)
    } else if (activeGroup) {
        result = getFavoritesByGroup(activeGroup)
    } else {
        result = [...items.value]
    }

    // 同时应用分组筛选（搜索时也支持分组过滤）
    if (activeGroup && searchKeyword.trim()) {
        result = result.filter(item => item.group === activeGroup)
    }

    // 按创建时间倒序（最新的在前）
    return result.sort((a, b) => b.createdAt - a.createdAt)
})

/** 分组选项（用于 Select 组件） */
const groupOptions = computed(() =>
    groups.value.map(g => ({ value: g.name, label: g.name }))
)

// ======================== 工具函数 ========================

/** 截断文本，超出长度添加省略号 */
const truncate = (text: string, maxLen: number): string => {
    if (!text) return ""
    return text.length > maxLen ? text.slice(0, maxLen) + "..." : text
}

// ======================== 操作：复制 ========================

const handleCopy = (content: string) => {
    copyText(content, () => {
        Message.success("已复制到剪贴板")
    })
}

// ======================== 操作：删除 ========================

const handleRemove = (id: string) => {
    const ok = confirm("确定删除这条收藏？")
    if (!ok) return
    removeFavorite(id)
}

// ======================== 操作：移动分组 ========================

const handleMoveGroup = (id: string, newGroup: string) => {
    moveFavorite(id, newGroup)
}

// ======================== 操作：添加自定义 Payload ========================

let showAddModal = $ref(false)
const addForm = reactive({
    name: "",
    content: "",
    sourceTool: "",
    tags: "",
    note: "",
    group: "default",
})

const handleAddCustom = () => {
    addForm.name = ""
    addForm.content = ""
    addForm.sourceTool = ""
    addForm.tags = ""
    addForm.note = ""
    addForm.group = "default"
    showAddModal = true
}

const doAddCustom = () => {
    if (!addForm.content.trim()) {
        Message.error("Payload 内容不能为空")
        return
    }
    const id = addFavorite(
        addForm.content,
        addForm.name || addForm.content.slice(0, 50),
        addForm.sourceTool || undefined,
        undefined,
        addForm.group,
    )
    if (!id) {
        Message.error("该内容已存在于收藏中")
        return
    }
    // 添加标签和备注
    if (addForm.tags.trim() || addForm.note.trim()) {
        updateFavorite(id, {
            tags: addForm.tags ? addForm.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
            note: addForm.note || undefined,
        })
    }
    showAddModal = false
    Message.success("已添加到收藏")
}

// ======================== 操作：编辑 ========================

let showEditModal = $ref(false)
let editingId = $ref("")
const editForm = reactive({
    name: "",
    content: "",
    sourceTool: "",
    tags: "",
    note: "",
    group: "default",
})

const handleEdit = (item: FavoriteItem) => {
    editingId = item.id
    editForm.name = item.name
    editForm.content = item.content
    editForm.sourceTool = item.sourceTool || ""
    editForm.tags = item.tags?.join(", ") || ""
    editForm.note = item.note || ""
    editForm.group = item.group
    showEditModal = true
}

const doEdit = () => {
    if (!editForm.content.trim()) {
        Message.error("Payload 内容不能为空")
        return
    }
    updateFavorite(editingId, {
        name: editForm.name,
        content: editForm.content,
        sourceTool: editForm.sourceTool || undefined,
        tags: editForm.tags ? editForm.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        note: editForm.note || undefined,
        group: editForm.group,
    })
    showEditModal = false
    Message.success("已更新")
}

// ======================== 操作：导入 / 导出 ========================

let showImportModal = $ref(false)
let importJson = $ref("")
let importReplace = $ref(false)

const handleExport = () => {
    const json = exportFavorites()
    copyText(json, () => {
        Message.success("收藏数据已复制到剪贴板")
    })
}

const handleImport = () => {
    importJson = ""
    importReplace = false
    showImportModal = true
}

const doImport = () => {
    const success = importFavorites(importJson, importReplace)
    if (success) {
        Message.success("导入成功")
        showImportModal = false
    } else {
        Message.error("导入失败，请检查 JSON 格式")
    }
}

// ======================== 操作：分组管理 ========================

let showGroupModal = $ref(false)
let newGroupName = $ref("")
let newGroupColor = $ref("")

const handleCreateGroup = () => {
    newGroupName = ""
    newGroupColor = ""
    showGroupModal = true
}

const doCreateGroup = () => {
    const name = newGroupName.trim()
    if (!name) {
        Message.error("分组名称不能为空")
        return
    }
    const ok = createGroup(name, newGroupColor.trim() || undefined)
    if (!ok) {
        Message.error("分组名称已存在")
        return
    }
    showGroupModal = false
    Message.success("分组已创建")
}
</script>

<style>
.sectool-favorites {
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
}

/* ======================== 顶部工具栏 ======================== */

.sectool-fav-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.sectool-fav-toolbar .sectool-fav-search {
    flex: 1;
    min-width: 0;
}

/* ======================== 分组标签栏 ======================== */

.sectool-fav-groups {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--sectool-border-color, #e4e7ed);
}

.sectool-fav-group-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    font-size: 0.75rem;
    border-radius: 12px;
    cursor: pointer;
    color: var(--sectool-color-secondary, #888);
    background: var(--sectool-form-element-background-color, #f5f7fa);
    border: 1px solid var(--sectool-border-color, #e4e7ed);
    transition: all 0.2s ease;
    user-select: none;
}

.sectool-fav-group-tag:hover {
    color: var(--sectool-primary, #1abc9c);
    border-color: var(--sectool-primary, #1abc9c);
}

.sectool-fav-group-tag.is-active {
    color: #fff;
    background: var(--tag-color, var(--sectool-primary, #1abc9c));
    border-color: var(--tag-color, var(--sectool-primary, #1abc9c));
}

.sectool-fav-group-add {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 0.75rem;
    color: var(--sectool-primary, #1abc9c);
    cursor: pointer;
    user-select: none;
}

.sectool-fav-group-add:hover {
    text-decoration: underline;
}

/* ======================== 收藏列表 ======================== */

.sectool-fav-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.sectool-fav-item {
    padding: 8px 10px;
    border: 1px solid var(--sectool-border-color, #e4e7ed);
    border-radius: var(--border-radius, 4px);
    background: var(--sectool-form-element-background-color, #f9f9f9);
    transition: border-color 0.2s ease;
}

.sectool-fav-item:hover {
    border-color: var(--sectool-primary, #1abc9c);
}

/* 条目头部：星标 + 名称 + 徽章 */

.sectool-fav-item-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
}

.sectool-fav-star {
    color: #f5a623;
    font-size: 0.875rem;
    flex-shrink: 0;
}

.sectool-fav-item-name {
    font-size: 0.825rem;
    font-weight: 600;
    color: var(--sectool-color-primary-theme, #333);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}

.sectool-fav-badge {
    display: inline-flex;
    align-items: center;
    padding: 0 6px;
    font-size: 0.65rem;
    font-weight: 500;
    border-radius: 3px;
    color: #fff;
    background: var(--sectool-primary, #1abc9c);
    flex-shrink: 0;
    line-height: 1.6;
    text-transform: uppercase;
}

.sectool-fav-badge-cat {
    background: #7c8ea0;
}

/* 内容预览 */

.sectool-fav-item-content {
    font-size: 0.75rem;
    font-family: monospace;
    color: var(--sectool-color-secondary, #666);
    word-break: break-all;
    line-height: 1.5;
    margin-bottom: 4px;
    padding: 4px 6px;
    background: var(--sectool-background-color, #fff);
    border-radius: 3px;
    border: 1px solid var(--sectool-border-color, #eee);
}

/* 标签 + 备注 */

.sectool-fav-item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
}

.sectool-fav-tag {
    display: inline-flex;
    align-items: center;
    padding: 0 6px;
    font-size: 0.65rem;
    border-radius: 3px;
    color: var(--sectool-primary, #1abc9c);
    background: color-mix(in srgb, var(--sectool-primary, #1abc9c) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--sectool-primary, #1abc9c) 30%, transparent);
    line-height: 1.6;
}

.sectool-fav-note {
    font-size: 0.7rem;
    color: var(--sectool-color-secondary, #999);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 操作按钮栏 */

.sectool-fav-item-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
}

.sectool-fav-item-actions .sectool-select {
    max-width: 120px;
    min-width: 80px;
}

/* ======================== 空状态 ======================== */

.sectool-fav-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--sectool-color-secondary, #999);
    text-align: center;
}

.sectool-fav-empty-icon {
    font-size: 2.5rem;
    color: var(--sectool-border-color, #ddd);
    margin-bottom: 8px;
}

.sectool-fav-empty-hint {
    font-size: 0.75rem;
    margin-top: 4px;
    color: var(--sectool-color-secondary, #bbb);
}

/* ======================== 表单样式 ======================== */

.sectool-fav-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sectool-fav-form .sectool-input,
.sectool-fav-form .sectool-select {
    width: 100%;
}
</style>
