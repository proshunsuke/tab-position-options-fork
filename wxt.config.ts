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
    description: "__MSG_extensionDescription__",
    permissions: ["storage"],
    optional_permissions: ["tabs", "webNavigation", "scripting"],
    optional_host_permissions: ["http://*/*", "https://*/*"],
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

  hooks: {
    "build:manifestGenerated": (wxt, manifest) => {
      if (wxt.config.command === "serve") {
        return;
      }

      const externalLinkHosts = new Set(["http://*/*", "https://*/*"]);
      manifest.host_permissions = (manifest.host_permissions ?? []).filter(
        (permission: string) => !externalLinkHosts.has(permission),
      );
      manifest.optional_host_permissions = [
        ...new Set([...(manifest.optional_host_permissions ?? []), ...externalLinkHosts]),
      ];
    },
  },
});
