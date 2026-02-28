<template>
    <div class="st-setting">
        <!-- 版本信息 -->
        <div class="st-setting-version">
            SecTool v{{ version }} &middot; {{ lastUpdate }}
        </div>

        <!-- 外观 -->
        <div class="st-setting-section">
            <div class="st-setting-section-title">{{ $t('main_display_mode') }}</div>
            <div class="st-setting-row">
                <span class="st-setting-label">{{ $t('main_display_mode') }}</span>
                <Select
                    :model-value="storeSetting.items.theme"
                    @change="(value)=>storeSetting.save('theme',value)"
                    :options="themes.map((item)=>{return {value:item,label:$t(`main_display_mode_${item}`)}})"
                />
            </div>
            <div class="st-setting-row">
                <span class="st-setting-label">{{ $t('main_setting_language') }}</span>
                <Select
                    :model-value="storeSetting.items.locale"
                    @change="(value)=>storeSetting.save('locale',value)"
                    :options="localeOptions"
                />
            </div>
            <div class="st-setting-row">
                <span class="st-setting-label">{{ $t('main_setting_zoom') }}</span>
                <Align>
                    <Select
                        :model-value="storeSetting.items.zoom"
                        @change="(value)=>storeSetting.save('zoom',value)"
                        :options="zoomOptions"
                    />
                    <Button
                        v-if="storeSetting.items.zoom !== 100"
                        :size="'small'"
                        :text="$t('main_ui_reset')"
                        @click="storeSetting.save('zoom', 100)"
                    />
                </Align>
            </div>
        </div>

        <!-- 剪贴板 -->
        <div class="st-setting-section">
            <div class="st-setting-section-title">{{ $t('main_ui_clipboard') }}</div>
            <div class="st-setting-row">
                <Bool
                    :label="$t(`main_copy_results_to_clipboard`)"
                    :model-value="storeSetting.items.auto_save_copy"
                    @change="(value)=>storeSetting.save('auto_save_copy',value)"
                />
            </div>
            <div class="st-setting-row">
                <Align>
                    <Bool
                        :disabled="clipboardState!=='granted'"
                        :label="$t(`main_read_content_from_clipboard`)"
                        :model-value="storeSetting.items.auto_read_copy"
                        @change="(value)=>storeSetting.save('auto_read_copy',value)"
                    />
                    <Link
                        v-if="clipboardState==='prompt'"
                        style="font-size: .875rem"
                        type="primary"
                        href="/tool.html#/clipboard"
                    >
                        {{ $t('main_clipboard_get') }}
                    </Link>
                </Align>
            </div>
            <div class="st-setting-row">
                <Bool
                    :disabled="!storeSetting.items.auto_read_copy"
                    :label="$t(`main_read_clipboard_content_trim`)"
                    :model-value="storeSetting.items.auto_read_copy_filter"
                    @change="(value)=>storeSetting.save('auto_read_copy_filter',value)"
                />
            </div>
        </div>

        <!-- 数据 -->
        <div class="st-setting-section">
            <div class="st-setting-section-title">{{ $t('main_ui_other') }}</div>
            <div class="st-setting-row">
                <span class="st-setting-label">{{ $t('main_auto_fill') }}</span>
                <Align>
                    <InputNumber :model-value="storeSetting.items.fill_history_expire" :width="120" @change="(value)=>storeSetting.save('fill_history_expire',value)"/>
                    <span class="st-setting-hint">{{ $t('main_auto_fill_explain', [storeSetting.items.fill_history_expire]) }}</span>
                </Align>
            </div>
            <div class="st-setting-row">
                <span class="st-setting-label">{{ $t('main_common_tool') }}</span>
                <Button :size="'small'" @click="openCommon = !openCommon" :text="`${$t(`main_ui_config`)}`"/>
            </div>
            <div class="st-setting-row">
                <Bool
                    :label="$t(`main_history_icon_badge_hidden`)"
                    :model-value="storeSetting.items.history_icon_badge_hidden"
                    @change="(value)=>storeSetting.save('history_icon_badge_hidden',value)"
                />
            </div>
        </div>

        <!-- 网络代理 -->
        <div class="st-setting-section" v-if="platform.runtime.webSecurity()">
            <div class="st-setting-section-title">{{ $t('main_network_request_proxy') }}</div>
            <div class="st-setting-row">
                <Bool
                    :label="$t(`main_ui_enable`)"
                    :model-value="storeSetting.items.proxy_enable"
                    @change="(value)=>storeSetting.save('proxy_enable',value)"
                />
            </div>
            <template v-if="storeSetting.items.proxy_enable">
                <div class="st-setting-row">
                    <Input :model-value="storeSetting.items.proxy_url" @change="(value)=>storeSetting.save('proxy_url',value)">
                        <template #append>
                            <Icon hover name="refresh" @click="storeSetting.save('proxy_url',proxy.defaultProxyUrl)" :tooltip="$t('main_ui_reset')"/>
                        </template>
                    </Input>
                </div>
                <div class="st-setting-row">
                    <Link type="primary" style="font-size: 12px" href="https://sectool.dev/privacy">{{ $t('main_privacy_policy') }}</Link>
                </div>
            </template>
        </div>

        <!-- 快捷键（Chrome 扩展） -->
        <div class="st-setting-section" v-if="platform.isChromium()">
            <div class="st-setting-section-title">{{ $t('main_keyboard_setting') }}</div>
            <div class="st-setting-row">
                <Link href="chrome://extensions/shortcuts">chrome://extensions/shortcuts</Link>
            </div>
        </div>

        <!-- uTools -->
        <div class="st-setting-section" v-if="platform.isUtools()">
            <div class="st-setting-section-title">uTools</div>
            <div class="st-setting-row">
                <Button :size="'small'" @click="openUtoolsKeyword = !openUtoolsKeyword" :text="`${$t(`main_ui_keyword`)}${$t(`main_ui_config`)}`"/>
            </div>
        </div>
    </div>

    <ExtendPage v-model="openUtoolsKeyword" disable-replace :title="$t('main_ui_keyword')">
        <UtoolsKeyword v-if="platform.isUtools()"/>
    </ExtendPage>
    <ExtendPage v-model="openCommon" disable-replace :title="$t('main_common_tool')">
        <Common/>
    </ExtendPage>
</template>

<script setup lang="ts">
import useSetting from "@/store/setting"
import {useClipboardPermission} from "@/helper/clipboard"
import {locales, themes} from "@/types"
import platform from "@/helper/platform"
import {getLocaleName} from "@/i18n"
import UtoolsKeyword from "./utools/Keyword.vue"
import Common from "./Common.vue";
import {version, buildTimestamp} from "@/helper/util";
import {proxy} from "sectool-config"
import dayjs from "dayjs";
import Bool from "@/components/ui/Bool.vue";
import Align from "@/components/Align.vue";
import Input from "@/components/ui/Input.vue";
import Link from "@/components/ui/Link.vue";
import Button from "@/components/ui/Button.vue";
import InputNumber from "@/components/ui/InputNumber.vue";

const storeSetting = useSetting()
const openUtoolsKeyword = $ref(false)
const openCommon = $ref(false)

const lastUpdate = dayjs.unix(buildTimestamp).format('YYYY-MM-DD HH:mm:ss')

const localeOptions = locales.map((item) => {
    return {value: item, label: getLocaleName(item) || ""}
})

const {state: clipboardState} = useClipboardPermission()

const zoomOptions = [50, 60, 70, 75, 80, 85, 90, 95, 100, 110, 120, 125, 130, 140, 150, 175, 200].map(v => ({
    value: v,
    label: `${v}%`,
}))
</script>

<style>
.st-setting {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.st-setting-version {
    font-size: 11px;
    color: var(--sectool-info-color);
    padding: 0 0 8px;
    border-bottom: 1px solid var(--sectool-border-color);
    margin-bottom: 4px;
}

.st-setting-section {
    padding: 8px 0;
}

.st-setting-section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--sectool-color-secondary);
    padding: 0 0 8px;
    margin-bottom: 4px;
    border-bottom: 1px solid var(--sectool-border-color);
}

.st-setting-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
    min-height: 32px;
}

.st-setting-label {
    font-size: 12.5px;
    color: var(--color);
    white-space: nowrap;
    min-width: 80px;
}

.st-setting-hint {
    font-size: 11px;
    color: var(--sectool-info-color);
}
</style>
