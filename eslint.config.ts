import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier/flat';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Lint setup: ESLint's recommended rules, typescript-eslint's strictest type-aware presets (it can see
 * types, so it catches things like unawaited promises), the React Hooks rules (including the React
 * Compiler ones), and Fast Refresh safety. Formatting is not linted here; that is Prettier's job.
 */
export default defineConfig(
  { ignores: ['dist', '.vercel', 'node_modules'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  prettier, // last among the presets: switches off any rule that would fight Prettier over formatting
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Template strings with numbers are everywhere in UI text ("3 of 4 colors"); only objects, null and
      // the like are mistakes worth catching.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // `onClick={() => doThing(x)}` is the normal React shape; the rule would force braces on every handler.
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      // Passing an async function to an event prop is fine in React; every handler here catches its own errors.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    // Vendor code copied in by `shadcn add`: keep it close to upstream so it can be re-generated.
    files: ['src/shared/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Tests lean on shortcuts that are fine in a test and noise in app code: `!` after a query that must
    // exist, empty stand-in callbacks, and fake DOM objects.
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
);
