// eslint-disable-next-line no-undef
module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true,
    },
    "ecmaVersion": "latest",
    "sourceType": "module",
  },
  "plugins": [
    "react",
    "@typescript-eslint",
  ],
  "rules": {
    "indent": [
      "error",
      2,
    ],
    "linebreak-style": [
      "error",
      "unix",
    ],
    "quotes": [
      "error",
      "double",
      { "allowTemplateLiterals": true },
    ],
    "semi": [
      "error",
      "always",
    ],
    "comma-dangle": [
      "error",
      "always-multiline",
    ],
    "no-var": "error",
    "space-before-blocks": "error",
    "comma-spacing": [
      "error", { "before": false, "after": true },
    ],
    "no-trailing-spaces": "error",
    "keyword-spacing": "error",
    "no-multiple-empty-lines": [
      "error", { "max": 1 },
    ],
    "object-curly-spacing": [
      "error", "always",
    ],
    "key-spacing": [
      "error", { "beforeColon": false, "afterColon": true },
    ],
  },
};
