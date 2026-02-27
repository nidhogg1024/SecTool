const { resolve } = require("path");
const { rmSync } = require("fs");


const lists = [
    "packages/sectool-adapter/base",
    "packages/sectool-adapter/chrome",
    "packages/sectool-adapter/edge",
    "packages/sectool-adapter/firefox",
    "packages/sectool-adapter/tauri",
    "packages/sectool-adapter/utools",
    "packages/sectool-adapter/web",
    "packages/sectool-config",
    "packages/sectool-core",
    "packages/sectool-site",
];

lists.forEach(item => {
    let removePath = resolve(__dirname, `${item}/dist/`);
    console.log(removePath);
    rmSync(removePath, { recursive: true, force: true });
    removePath = resolve(__dirname, `${item}/node_modules/`);
    console.log(removePath);
    rmSync(removePath, { recursive: true, force: true });
});
rmSync(resolve(__dirname, `node_modules/`), { recursive: true, force: true });
