import { useRecipes } from "./recipes"

describe("recipes", () => {
    const {
        recipes,
        builtinRecipes,
        userRecipes,
        saveRecipe,
        deleteRecipe,
        exportRecipe,
        importRecipeFromHash,
        exportAllRecipes,
        importRecipes,
    } = useRecipes()

    it("内置 Recipe 不为空", () => {
        expect(builtinRecipes.value.length).toBeGreaterThan(0)
    })

    it("所有内置 Recipe 有 isBuiltin 标记", () => {
        for (const r of builtinRecipes.value) {
            expect(r.isBuiltin).toBe(true)
            expect(r.id).toBeTruthy()
            expect(r.name).toBeTruthy()
            expect(r.steps.length).toBeGreaterThan(0)
        }
    })

    it("内置 Recipe ID 唯一", () => {
        const ids = builtinRecipes.value.map((r) => r.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it("初始 userRecipes 为空", () => {
        expect(userRecipes.value.length).toBe(0)
    })

    it("保存用户 Recipe", () => {
        const recipe = saveRecipe("Test Recipe", ["url_encode", "base64_encode"], "Test")
        expect(recipe.id).toBeTruthy()
        expect(recipe.name).toBe("Test Recipe")
        expect(recipe.steps).toEqual(["url_encode", "base64_encode"])
        expect(userRecipes.value.length).toBe(1)
    })

    it("recipes 包含内置 + 用户", () => {
        expect(recipes.value.length).toBe(builtinRecipes.value.length + userRecipes.value.length)
    })

    it("导出和导入 Recipe", () => {
        const recipe = userRecipes.value.find((r) => r.name === "Test Recipe")
        expect(recipe).toBeTruthy()
        if (!recipe) return
        const exported = exportRecipe(recipe.id)
        expect(exported).toBeTruthy()

        const imported = importRecipeFromHash(exported)
        expect(imported).not.toBeNull()
        expect(imported!.name).toBe("Test Recipe")
        expect(imported!.steps).toEqual(["url_encode", "base64_encode"])
    })

    it("导入无效 hash 返回 null", () => {
        expect(importRecipeFromHash("invalid_base64!!!")).toBeNull()
        expect(importRecipeFromHash(btoa("{}"))).toBeNull()
        expect(importRecipeFromHash(btoa('{"steps":[]}'))).toBeNull()
    })

    it("删除用户 Recipe", () => {
        const countBefore = userRecipes.value.length
        const id = userRecipes.value[0].id
        expect(deleteRecipe(id)).toBe(true)
        expect(userRecipes.value.length).toBe(countBefore - 1)
    })

    it("删除不存在的 Recipe 返回 false", () => {
        expect(deleteRecipe("nonexistent_id")).toBe(false)
    })

    it("批量导入", () => {
        const json = JSON.stringify([
            { name: "Batch 1", steps: ["md5"] },
            { name: "Batch 2", steps: ["sha1"] },
            { name: "Invalid", steps: [] },
        ])
        const count = importRecipes(json)
        expect(count).toBe(2)
    })

    it("批量导出", () => {
        const exported = exportAllRecipes()
        const parsed = JSON.parse(exported)
        expect(Array.isArray(parsed)).toBe(true)
        expect(parsed.length).toBeGreaterThan(0)
    })
})
