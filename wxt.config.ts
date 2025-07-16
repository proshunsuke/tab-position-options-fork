import { defineConfig } from "wxt";

export default defineConfig({
  // Module configuration
  modules: ["@wxt-dev/module-react"],

  // Manifest configuration
  manifest: {
    name: "Tab Position Options Fork",
    version: "1.0.0",
    description:
      "Control where new tabs are opened - a modern fork of the classic Tab Position Options extension",
    permissions: ["tabs", "storage"],
    host_permissions: [],
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
