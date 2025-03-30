import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default defineConfig([
  globalIgnores(["**/node_modules", "**/dist", "**/eslint.config.mjs", "**/spicetify.d.ts"]),
  {
    extends: compat.extends("eslint:recommended", "plugin:react/recommended", "plugin:@typescript-eslint/recommended"),

    plugins: {
      react,
      "@typescript-eslint": typescriptEslint
    },

    languageOptions: {
      globals: {
        ...globals.browser
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "module",

      parserOptions: {
        project: ["tsconfig.json"]
      }
    },

    settings: {
      react: {
        version: "17.0.2"
      }
    },

    rules: {
      indent: ["error", 2],
      "linebreak-style": ["error", "unix"],

      quotes: [
        "error",
        "double",
        {
          allowTemplateLiterals: true
        }
      ],

      semi: ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "no-var": "error",
      "space-before-blocks": "error",

      "comma-spacing": [
        "error",
        {
          before: false,
          after: true
        }
      ],

      "no-trailing-spaces": "error",
      "keyword-spacing": "error",

      "no-multiple-empty-lines": [
        "error",
        {
          max: 1
        }
      ],

      "object-curly-spacing": ["error", "always"],

      "key-spacing": [
        "error",
        {
          beforeColon: false,
          afterColon: true
        }
      ]
    }
  }
]);
