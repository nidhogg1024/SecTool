<template>
    <!-- 收藏星标按钮：点击切换收藏状态，内联嵌入到任意 payload 旁边 -->
    <span
        class="sectool-fav-btn"
        :class="{ 'is-favorited': isFav }"
        @click.stop="handleToggle"
        :title="isFav ? '取消收藏' : '添加收藏'"
    >
        {{ isFav ? '★' : '☆' }}
    </span>
</template>

<script lang="ts" setup>
/**
 * 收藏星标按钮
 *
 * 小型内联组件，嵌入到 payload 列表项旁边。
 * 点击后通过 useFavorites() 切换收藏状态，
 * 已收藏显示实心星（金色），未收藏显示空心星。
 */
import { useFavorites } from "@/store/favorites"

const props = defineProps({
    /** payload 内容（作为收藏的唯一标识） */
    content: {
        type: String,
        required: true,
    },
    /** 显示名称 */
    name: {
        type: String,
        required: true,
    },
    /** 来源工具标识（xss, sqli, lfi 等） */
    sourceTool: {
        type: String,
        default: "",
    },
    /** 来源分类 */
    sourceCategory: {
        type: String,
        default: "",
    },
})

const { isFavorited, toggleFavorite } = useFavorites()

/** 响应式判断当前 content 是否已收藏 */
let isFav = $computed(() => isFavorited(props.content))

/** 点击切换收藏 */
const handleToggle = () => {
    toggleFavorite(
        props.content,
        props.name,
        props.sourceTool || undefined,
        props.sourceCategory || undefined,
    )
}
</script>

<style>
.sectool-fav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4em;
    height: 1.4em;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    color: var(--sectool-color-secondary, #999);
    transition: color 0.2s ease, transform 0.15s ease;
    user-select: none;
    vertical-align: middle;
    flex-shrink: 0;
}

.sectool-fav-btn:hover {
    color: #f5a623;
    transform: scale(1.2);
}

.sectool-fav-btn.is-favorited {
    color: #f5a623;
}

.sectool-fav-btn.is-favorited:hover {
    color: #d48806;
}
</style>
