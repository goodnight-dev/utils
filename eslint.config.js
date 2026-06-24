import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import perfectionist from 'eslint-plugin-perfectionist';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/docs/api/**', '**/.tmp/**'],
  },
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    plugins: { perfectionist },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Keep the barrels (`src/index.ts`) and any named exports alphabetised, so
      // a re-export lands in a deterministic place whether it is added by hand
      // or by the `pnpm new` scaffold. Both are autofixable (`eslint --fix`).
      'perfectionist/sort-exports': 'error',
      'perfectionist/sort-named-exports': 'error',
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    // Ban lingering work-in-progress markers everywhere. The `pnpm new` scaffold
    // seeds its output with these markers for the steps it cannot do for you
    // (the implementation, the README, the changeset); this rule keeps
    // `pnpm check` red until each one is resolved, so a half-wired function
    // cannot merge. (The banned terms live in the config below, not this
    // comment, so the rule does not flag its own documentation.)
    rules: {
      'no-warning-comments': [
        'error',
        { terms: ['todo', 'fixme'], location: 'anywhere' },
      ],
    },
  },
  prettier,
);
