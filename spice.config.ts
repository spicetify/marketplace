import { defineConfig } from "@spicetify/creator";

export default defineConfig({
  name: {
    "en": "Marketplace",
    "ru": "Маркетплейс",
  },
  icon: {
    "default": "./src/assets/icon.svg",
    "active": "./src/assets/icon-filled.svg",
  },
  framework: "react",
  linter: "biome",
  template: "custom-app",
  packageManager: "pnpm",
});
