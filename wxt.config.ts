import { defineConfig } from "wxt";
import { APP_VERSION } from "./src/version";

export default defineConfig({
  // Module configuration
  modules: ["@wxt-dev/module-react"],

  // Manifest configuration
  manifest: {
    name: "Tab Position Options Fork",
    version: APP_VERSION,
    description:
      "Control where new tabs are opened - a modern fork of the classic Tab Position Options extension",
    permissions: ["tabs", "storage"],
    host_permissions: [],
    action: {
      // アイコンクリック時の動作をbackground.tsで制御
    },
  },

  // Development configuration
  dev: {
    server: {
      port: 5789,
    },
  },

  // Build configuration
  outDir: "dist",
});
