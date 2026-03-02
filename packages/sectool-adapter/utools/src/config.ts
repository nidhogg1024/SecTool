import {FeatureInterface, getTool} from "sectool-config";

export type CustomCmd = {
    type: "regex" | "over"
    minLength?: number
    maxLength?: number
    match?: string
    label?: string
}
export const customCmds = new Map<FeatureInterface, CustomCmd[]>()

// Base64 编解码：自动匹配 Base64 格式的文本
customCmds.set(
    getTool('base64').getFeature('decoder'),
    [
        {
            "type": "regex",
            "match": "/^[A-Za-z0-9+/]{20,}={0,2}$/i",
            "minLength": 20,
        }
    ]
)

// URL 编解码：自动匹配含 %XX 的 URL 编码文本
customCmds.set(
    getTool('url').getFeature('decoder'),
    [
        {
            "type": "regex",
            "match": "/%[0-9a-f]{2}/i",
            "minLength": 3,
        }
    ]
)

// Unicode 解码：自动匹配 \uXXXX 格式
customCmds.set(
    getTool('unicode').getFeature('decoder'),
    [
        {
            "type": "regex",
            "match": "/\\\\u[0-9a-f]{4}/i",
            "minLength": 6
        }
    ]
)

// JWT 解码：自动匹配 JWT 格式 (eyJ... 开头的三段式)
customCmds.set(
    getTool('jwt').getFeature('decoder'),
    [
        {
            "type": "regex",
            "match": "/^eyJ[A-Za-z0-9_-]+\\.eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]*/i",
            "minLength": 20,
        }
    ]
)
