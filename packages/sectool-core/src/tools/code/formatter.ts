/**
 * 代码格式化 stub
 * 原 Ctool code 工具的 formatter 已移除，此处提供空实现以保持组件兼容
 */
export default {
    isEnable(_lang: string, _mode: string): boolean {
        return false
    },
    async simple(_lang: string, _mode: string, content: string): Promise<string> {
        return content
    },
}
