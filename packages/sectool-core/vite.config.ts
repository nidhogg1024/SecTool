import { join, resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import HtmlConfig from "vite-plugin-html-config";
import ReactivityTransform from "@vue-macros/reactivity-transform/vite";


// 优先从 git tag 读取版本号，fallback 到 package.json
function getVersion(): string {
    try {
        const tag = execSync("git describe --tags --abbrev=0", { encoding: "utf-8" }).trim();
        return tag.startsWith("v") ? tag.slice(1) : tag;
    } catch {
        return JSON.parse(readFileSync(join(__dirname, "../../package.json")).toString())["version"];
    }
}

export default defineConfig({
    base: "./",
    plugins: [
        nodePolyfills({
            include: ["buffer", "crypto", "path", "stream", "util", "process"],
        }),
        HtmlConfig({
            metas: [
                {
                    name: "sectool-version",
                    content: getVersion(),
                },
                {
                    name: "sectool-build-timestamp",
                    content: `${Date.parse(new Date().toString()) / 1000}`,
                },
            ],
        }),
        vue(),
        ReactivityTransform(),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    build: {
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
            input: {
                index: resolve(__dirname, "index.html"),
                tool: resolve(__dirname, "tool.html"),
            },
            output: {
                manualChunks(id) {
                    if (id.includes("monaco-editor")) return "vendor-monaco"
                    if (id.includes("crypto-js") || id.includes("jsrsasign") || id.includes("sm-crypto")) return "vendor-crypto"
                    if (id.includes("lodash")) return "vendor-lodash"
                    if (id.includes("node_modules")) return "vendor"
                },
            },
        },
        reportCompressedSize: false,
        chunkSizeWarningLimit: 5000,
        minify: "esbuild",
    },
});
