module.exports = {
  "env": {
      "browser": true,
      "es2021": true
  },
  "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:vue/vue3-recommended",
  ],
  "parserOptions": {
      "ecmaVersion": 13,
      "parser": "@typescript-eslint/parser",
      "sourceType": "module"
  },
  "plugins": [
      "vue",
      "@typescript-eslint"
  ],
  "rules": {
      "indent": "off",
      "@typescript-eslint/indent": ["warn", 4],
      "linebreak-style": [
          "error",
          "unix"
      ],
      "quotes": [
          "error",
          "double"
      ],
      "semi": [
          "error",
          "always"
      ],
      "camelcase": "off",
      "@typescript-eslint/naming-convention": [
          "error",
          {
              "selector": "default",
              "format": ["camelCase"]
          },
          {
              "selector": "property",
              "format": ["camelCase","PascalCase"]
          },
          {
              "selector": "variable",
              "format": ["camelCase", "UPPER_CASE"]
          },
          {
              "selector": "parameter",
              "format": ["camelCase"],
              "leadingUnderscore": "allow"
          },
          {
              "selector": "memberLike",
              "modifiers": ["private"],
              "format": ["camelCase"],
              "leadingUnderscore": "require"
          },
          {
              "selector": "typeLike",
              "format": ["PascalCase"]
          },
          {
            "selector": "enumMember",
            "format": ["PascalCase"]
        }
      ],
      "no-multiple-empty-lines": [
          "warn", { "max": 1, "maxEOF": 1 }
      ],
      "vue/no-v-html" : "off",
  },
  "ignorePatterns": [".eslintrc.js"]
};
