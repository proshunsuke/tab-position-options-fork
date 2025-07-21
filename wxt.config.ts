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
      "Fork of Tab Position Options - Select the tab opening position, new tab behavior and behavior after closing a tab",
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
