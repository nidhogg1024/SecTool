import { operations, runChain, presets } from './operations'

describe('operations', () => {
    it('operations array has 17 items', () => {
        expect(operations).toHaveLength(17)
    })

    it('each operation has id, name, nameEn, type, fn', () => {
        for (const op of operations) {
            expect(op).toHaveProperty('id')
            expect(typeof op.id).toBe('string')
            expect(op).toHaveProperty('name')
            expect(typeof op.name).toBe('string')
            expect(op).toHaveProperty('nameEn')
            expect(typeof op.nameEn).toBe('string')
            expect(op).toHaveProperty('type')
            expect(['encode', 'decode', 'both']).toContain(op.type)
            expect(op).toHaveProperty('fn')
            expect(typeof op.fn).toBe('function')
        }
    })

    it('all IDs unique', () => {
        const ids = operations.map(op => op.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
    })
})

describe('individual operations', () => {
    // URL encode/decode roundtrip
    it('url_encode: \'hello world\' → \'hello%20world\'', () => {
        const op = operations.find(o => o.id === 'url_encode')!
        expect(op.fn('hello world')).toBe('hello%20world')
    })

    it('url_decode: \'hello%20world\' → \'hello world\'', () => {
        const op = operations.find(o => o.id === 'url_decode')!
        expect(op.fn('hello%20world')).toBe('hello world')
    })

    it('url_encode_full: \'abc\' → \'%61%62%63\'', () => {
        const op = operations.find(o => o.id === 'url_encode_full')!
        expect(op.fn('abc')).toBe('%61%62%63')
    })

    // Base64 encode/decode roundtrip
    it('base64_encode: \'hello\' → \'aGVsbG8=\'', () => {
        const op = operations.find(o => o.id === 'base64_encode')!
        expect(op.fn('hello')).toBe('aGVsbG8=')
    })

    it('base64_decode: \'aGVsbG8=\' → \'hello\'', () => {
        const op = operations.find(o => o.id === 'base64_decode')!
        expect(op.fn('aGVsbG8=')).toBe('hello')
    })

    // Hex encode/decode roundtrip
    it('hex_encode: \'AB\' → \\x41\\x42 格式', () => {
        const op = operations.find(o => o.id === 'hex_encode')!
        expect(op.fn('AB')).toBe('\\x41\\x42')
    })

    it('hex_decode: \'\\\\x41\\\\x42\' → \'AB\'', () => {
        const op = operations.find(o => o.id === 'hex_decode')!
        expect(op.fn('\\x41\\x42')).toBe('AB')
    })

    // Unicode encode/decode roundtrip
    it('unicode_encode: \'A\' → \'\\\\u0041\'', () => {
        const op = operations.find(o => o.id === 'unicode_encode')!
        expect(op.fn('A')).toBe('\\u0041')
    })

    it('unicode_decode: \'\\\\u0041\' → \'A\'', () => {
        const op = operations.find(o => o.id === 'unicode_decode')!
        expect(op.fn('\\u0041')).toBe('A')
    })

    // Transformations
    it('uppercase: \'hello\' → \'HELLO\'', () => {
        const op = operations.find(o => o.id === 'uppercase')!
        expect(op.fn('hello')).toBe('HELLO')
    })

    it('lowercase: \'HELLO\' → \'hello\'', () => {
        const op = operations.find(o => o.id === 'lowercase')!
        expect(op.fn('HELLO')).toBe('hello')
    })

    it('reverse: \'abc\' → \'cba\'', () => {
        const op = operations.find(o => o.id === 'reverse')!
        expect(op.fn('abc')).toBe('cba')
    })

    // Hash operations (one-way)
    it('md5: \'hello\' → \'5d41402abc4b2a76b9719d911017c592\'', () => {
        const op = operations.find(o => o.id === 'md5')!
        expect(op.fn('hello')).toBe('5d41402abc4b2a76b9719d911017c592')
    })

    it('sha1: \'hello\' → \'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d\'', () => {
        const op = operations.find(o => o.id === 'sha1')!
        expect(op.fn('hello')).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
    })

    it('sha256: \'hello\' produces a 64-char hex string', () => {
        const op = operations.find(o => o.id === 'sha256')!
        const result = op.fn('hello')
        expect(result).toHaveLength(64)
        expect(result).toMatch(/^[0-9a-f]+$/)
    })
})

describe('runChain', () => {
    // Single operation
    it('runChain(\'hello\', [\'base64_encode\']) → finalResult = \'aGVsbG8=\', stepResults length 1', () => {
        const result = runChain('hello', ['base64_encode'])
        expect(result.finalResult).toBe('aGVsbG8=')
        expect(result.stepResults).toHaveLength(1)
        expect(result.stepResults[0]).toBe('aGVsbG8=')
    })

    // Chain of operations
    it('runChain(\'hello\', [\'base64_encode\', \'url_encode\']) → URL encoded base64', () => {
        const result = runChain('hello', ['base64_encode', 'url_encode'])
        // base64 of 'hello' is 'aGVsbG8='; URL encode that
        expect(result.finalResult).toBe('aGVsbG8%3D')
        expect(result.stepResults).toHaveLength(2)
        expect(result.stepResults[0]).toBe('aGVsbG8=')
        expect(result.stepResults[1]).toBe('aGVsbG8%3D')
    })

    it('runChain(\'hello world\', [\'url_encode\', \'base64_encode\']) → base64 of url-encoded', () => {
        const result = runChain('hello world', ['url_encode', 'base64_encode'])
        // url_encode: 'hello%20world'; base64 of that
        const base64Op = operations.find(o => o.id === 'base64_encode')!
        expect(result.stepResults[0]).toBe('hello%20world')
        expect(result.finalResult).toBe(base64Op.fn('hello%20world'))
    })

    // Unknown operation
    it('runChain(\'test\', [\'nonexistent\']) → error contains \'未知操作\'', () => {
        const result = runChain('test', ['nonexistent'])
        expect(result.error).toBeDefined()
        expect(result.error).toContain('未知操作')
    })

    // Empty chain
    it('runChain(\'hello\', []) → finalResult = \'hello\', stepResults = []', () => {
        const result = runChain('hello', [])
        expect(result.finalResult).toBe('hello')
        expect(result.stepResults).toEqual([])
    })

    // Decode chain
    it('runChain(\'aGVsbG8=\', [\'base64_decode\']) → \'hello\'', () => {
        const result = runChain('aGVsbG8=', ['base64_decode'])
        expect(result.finalResult).toBe('hello')
        expect(result.stepResults).toHaveLength(1)
    })
})

describe('presets', () => {
    it('presets has 5 items', () => {
        expect(presets).toHaveLength(5)
    })

    it('each preset has id, name, nameEn, steps (array)', () => {
        for (const preset of presets) {
            expect(preset).toHaveProperty('id')
            expect(typeof preset.id).toBe('string')
            expect(preset).toHaveProperty('name')
            expect(typeof preset.name).toBe('string')
            expect(preset).toHaveProperty('nameEn')
            expect(typeof preset.nameEn).toBe('string')
            expect(preset).toHaveProperty('steps')
            expect(Array.isArray(preset.steps)).toBe(true)
        }
    })

    it('all preset IDs unique', () => {
        const ids = presets.map(p => p.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
    })

    it('each step in each preset refers to a valid operation ID', () => {
        const opIds = new Set(operations.map(op => op.id))
        for (const preset of presets) {
            for (const stepId of preset.steps) {
                expect(opIds.has(stepId)).toBe(true)
            }
        }
    })
})
