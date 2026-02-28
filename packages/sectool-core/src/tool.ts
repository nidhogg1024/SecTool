import { createApp } from "vue";
import { pinia } from "@/helper/pinia";
import sectool from "@/helper/plugin";
import router from "@/helper/router";
import "@/statics/tailwind.css";
import "@/statics/style.css";
import Tool from "@/Tool.vue";
import { initPermission as initClipboardPermission } from "@/helper/clipboard";

(async () => {
    await initClipboardPermission();
    const app = createApp(Tool);
    app.use(pinia).use(router).use(sectool).mount("#app");
})();
