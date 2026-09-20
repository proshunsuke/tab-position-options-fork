import { defineConfig } from "wxt";
import { APP_VERSION } from "./src/version";

export default defineConfig({
  // Module configuration
  modules: ["@wxt-dev/module-react", "@wxt-dev/i18n/module"],

  // Manifest configuration
  manifest: {
    default_locale: "en",
    name: "Tab Position Options Fork",
    version: APP_VERSION,
    description:
      "Fork of Tab Position Options - Select the tab opening position, new tab behavior and behavior after closing a tab",
    permissions: ["storage", "tabs", "webNavigation"],
    host_permissions: [],
    commands: {
      "sort-title": { suggested_key: { default: "Alt+T" }, description: "__MSG_sortByTitle__" },
      "sort-url": { suggested_key: { default: "Alt+U" }, description: "__MSG_sortByUrl__" },
      "toggle-last-active": {
        suggested_key: { default: "Alt+C" },
        description: "__MSG_toggleLastActive__",
      },
    },
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
