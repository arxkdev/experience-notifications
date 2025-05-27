import tsParser from "@typescript-eslint/parser";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

const rules = {
  "@typescript-eslint/consistent-type-imports": [
    "warn",
    {
      prefer: "type-imports",
      fixStyle: "inline-type-imports",
    },
  ],

  indent: ["error", 2],
  semi: ["error", "always"],

  "@typescript-eslint/no-misused-promises": [
    2,
    {
      checksVoidReturn: {
        attributes: false,
      },
    },
  ],
};

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...compat.config({
    extends: [
      "plugin:@typescript-eslint/recommended",
      "prettier"
    ],

    parserOptions: {
      ecmaVersion: 2024,
      parser: "@typescript-eslint/parser",
      project: "./tsconfig.json",
      tsconfigRootDir: "./",
    },

    rules,
  }),

  {
    ignores: [
      "**/tailwind.config.ts",
      "src/components/ui/**",
      ".next/**",
      "node_modules/**",
      "dist/**",
			"example/**"
    ]
  },

  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2024,
        project: "./tsconfig.json",
        tsconfigRootDir: "./",
      },
    },

    rules,
  }
];

export default eslintConfig;
