import eslint from "@eslint/js";
import pluginRouter from "@tanstack/eslint-plugin-router";
import tailwindcssPlugin from "eslint-plugin-better-tailwindcss";
import reactPlugin from "eslint-plugin-react";
import reactCompilerPlugin from "eslint-plugin-react-compiler";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  // Base ESLint & TypeScript configs
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    ignores: [
      "**/dist/**",
      "**/.output/**",
      "**/.tanstack/**",
      "**/.nitro/**",
      "**/routeTree.gen.ts",
      "**/db/schema.ts",
      "**/node_modules/**",
      "apps/transporter/explorations/**",
      "apps/web/explorations/**",
    ],
  },

  // TanStack Router config
  pluginRouter.configs["flat/recommended"],

  // Better Tailwind CSS config
  {
    // enable all recommended rules
    extends: [tailwindcssPlugin.configs.recommended],

    // if needed, override rules to configure them individually
    rules: {
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
      "better-tailwindcss/no-unknown-classes": "off",
    },

    settings: {
      "better-tailwindcss": {
        entryPoint: "apps/web/src/styles/app.css",
      },
    },
  },

  // Base Language Options
  {
    languageOptions: {
      globals: {
        ...globals.builtin,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React specific config for web app
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat["jsx-runtime"],
    plugins: {
      ...reactPlugin.configs.flat.recommended.plugins,
      "react-hooks": reactHooksPlugin,
      "react-compiler": reactCompilerPlugin,
    },
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat["jsx-runtime"].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react-compiler/react-compiler": "error",

      // Overrides for React
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "eslint/react/no-unknown-property": "off",
    },
  },

  // Custom rule overrides
  {
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/no-misused-promises": [
        "off",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": "off",
    },
  },

  // Disable type-checked rules for config files and specific scripts
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...tseslint.configs.disableTypeChecked,
  },
);
