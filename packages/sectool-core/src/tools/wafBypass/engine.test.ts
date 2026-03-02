import { generateBypasses, techniques } from './engine'

describe('generateBypasses', () => {
    // 基础功能
    it('empty input → []', () => {
        expect(generateBypasses('', ['case_mixing'])).toEqual([])
    })

    it('whitespace only input → []', () => {
        expect(generateBypasses('   \t\n  ', ['case_mixing'])).toEqual([])
    })

    it('unknown technique IDs → no results for those', () => {
        const result = generateBypasses('SELECT 1', ['nonexistent_tech', 'another_fake'])
        expect(result).toEqual([])
    })

    // case_mixing
    it('"SELECT * FROM users" with [\'case_mixing\'] → results exist, all different from input', () => {
        const input = 'SELECT * FROM users'
        const result = generateBypasses(input, ['case_mixing'])
        expect(result).toHaveLength(1)
        expect(result[0].technique).toBe('case_mixing')
        expect(result[0].results.length).toBeGreaterThan(0)
        for (const r of result[0].results) {
            expect(r).not.toBe(input)
        }
    })

    // inline_comment
    it('"SELECT * FROM users" with [\'inline_comment\'] → results contain /**/', () => {
        const result = generateBypasses('SELECT * FROM users', ['inline_comment'])
        expect(result).toHaveLength(1)
        expect(result[0].technique).toBe('inline_comment')
        expect(result[0].results.some(r => r.includes('/**/'))).toBe(true)
    })

    // url_encode
    it('"<script>alert(1)</script>" with [\'url_encode\'] → results contain %3C or %3E', () => {
        const result = generateBypasses('<script>alert(1)</script>', ['url_encode'])
        expect(result).toHaveLength(1)
        expect(result[0].technique).toBe('url_encode')
        expect(result[0].results.some(r => r.includes('%3C') || r.includes('%3E'))).toBe(true)
    })

    // double_url_encode
    it('"\'( OR 1=1" with [\'double_url_encode\'] → results contain %25', () => {
        const result = generateBypasses("' OR 1=1", ['double_url_encode'])
        expect(result).toHaveLength(1)
        expect(result[0].technique).toBe('double_url_encode')
        expect(result[0].results.some(r => r.includes('%25'))).toBe(true)
    })

    // hex_encode
    it('"admin" with [\'hex_encode\'] → first result starts with \'0x\'', () => {
        const result = generateBypasses('admin', ['hex_encode'])
        expect(result).toHaveLength(1)
        expect(result[0].technique).toBe('hex_encode')
        expect(result[0].results[0].startsWith('0x')).toBe(true)
    })

    // char_encode
    it('"admin" with [\'char_encode\'] → result contains \'CHAR(\'', () => {
        const result = generateBypasses('admin', ['char_encode'])
        expect(result).toHaveLength(1)
        expect(result[0].technique).toBe('char_encode')
        expect(result[0].results.some(r => r.includes('CHAR('))).toBe(true)
    })

    // whitespace_alt
    it('"SELECT id FROM users" with [\'whitespace_alt\'] → results have spaces replaced with %09/%0a/etc', () => {
        const result = generateBypasses('SELECT id FROM users', ['whitespace_alt'])
        expect(result).toHaveLength(1)
        expect(result[0].technique).toBe('whitespace_alt')
        // 至少有一个结果包含替代空白符
        const hasAlt = result[0].results.some(r =>
            r.includes('%09') || r.includes('%0a') || r.includes('%0d') ||
            r.includes('/**/') || r.includes('%a0') || r.includes('+'),
        )
        expect(hasAlt).toBe(true)
    })

    // html_entity
    it('"<script>" with [\'html_entity\'] → results contain \'&#\'', () => {
        const result = generateBypasses('<script>', ['html_entity'])
        expect(result).toHaveLength(1)
        expect(result[0].technique).toBe('html_entity')
        expect(result[0].results.some(r => r.includes('&#'))).toBe(true)
    })

    // comment_variations
    it('"1=1" with [\'comment_variations\'] → results end with --, #, /*, etc', () => {
        const result = generateBypasses('1=1', ['comment_variations'])
        expect(result).toHaveLength(1)
        expect(result[0].technique).toBe('comment_variations')
        const endings = ['--', '#', '/*', '%23']
        const hasExpectedEndings = result[0].results.some(r =>
            endings.some(e => r.endsWith(e) || r.endsWith(e + ' ')),
        )
        expect(hasExpectedEndings).toBe(true)
    })

    // Multiple techniques at once
    it('"SELECT 1" with [\'case_mixing\', \'url_encode\', \'hex_encode\'] → results for each technique', () => {
        const result = generateBypasses('SELECT 1', ['case_mixing', 'url_encode', 'hex_encode'])
        expect(result.length).toBeGreaterThanOrEqual(2) // 至少 url_encode 和 hex_encode 必有结果
        const techIds = result.map(r => r.technique)
        expect(techIds).toContain('url_encode')
        expect(techIds).toContain('hex_encode')
        // case_mixing 可能因随机性产生空结果，但不影响其他
        result.forEach(r => {
            expect(['case_mixing', 'url_encode', 'hex_encode']).toContain(r.technique)
            expect(r.results.length).toBeGreaterThan(0)
        })
    })
})

describe('techniques', () => {
    it('techniques array has 13 items', () => {
        expect(techniques).toHaveLength(13)
    })

    it('each technique has id, name, nameEn, description, transform function', () => {
        for (const t of techniques) {
            expect(t).toHaveProperty('id')
            expect(typeof t.id).toBe('string')
            expect(t).toHaveProperty('name')
            expect(typeof t.name).toBe('string')
            expect(t).toHaveProperty('nameEn')
            expect(typeof t.nameEn).toBe('string')
            expect(t).toHaveProperty('description')
            expect(typeof t.description).toBe('string')
            expect(t).toHaveProperty('transform')
            expect(typeof t.transform).toBe('function')
        }
    })

    it('all technique IDs are unique', () => {
        const ids = techniques.map(t => t.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
    })
})
