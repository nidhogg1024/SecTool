<template>
    <Align class="sectool-github" gap="none">
        <span class="sectool-github-name" @click="openUrl(`https://github.com/nidhogg1024/SecTool`)">
            <Icon name="github" :size="12"/> <strong>SecTool</strong>
        </span>
        <span class="sectool-github-star" v-if="star > 0" @click="openUrl(`https://github.com/nidhogg1024/SecTool`)">
            {{ `${star}`.replace(/(\d)(?=(\d{3})+$)/g, "$1,") }}
        </span>
    </Align>
</template>

<script setup lang="ts">
import {onMounted} from "vue"
import axios from "axios";
import storage from "@/helper/storage";
import {openUrl} from "@/helper/helper"

const CACHE_NAME = 'github_star';

let star = $ref(storage.get<number>(CACHE_NAME) || 0)

onMounted(() => {
    if (star === 0) {
        axios({url: 'https://api.github.com/repos/nidhogg1024/SecTool'}).then(({data}) => {
            const count = data.stargazers_count ? parseInt(data.stargazers_count) : 0
            if (count > 0) {
                star = count
                storage.setNoVersion(CACHE_NAME, count, 3700)
            }
        }).catch(() => {
        });
    }
})

</script>

<style scoped>
.sectool-github span {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    column-gap: 5px;
    font-size: 12px;
    height: 24px;
    padding: 2px 5px;
    text-decoration: none;
}

.sectool-github span:hover {
    color: var(--sectool-primary-hover);
}

.sectool-github .sectool-github-name {
    border: 1px solid var(--form-element-border-color);
    border-radius: 3px 0 0 3px;
}

.sectool-github .sectool-github-star {
    border: 1px solid var(--form-element-border-color);
    border-left: none;
    font-weight: bold;
    border-radius: 0 3px 3px 0;
}
</style>
