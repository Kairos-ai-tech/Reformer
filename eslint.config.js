import js from '@eslint/js';
import globals from 'globals';
import html from 'eslint-plugin-html';

export default [
  { ignores: ['node_modules/**', 'vendor/**', 'en/**', 'ja/**', 'ko/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.html'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: { ...globals.browser, renderDemos: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  { files: ['**/*.html'], plugins: { html } },
  {
    files: ['eslint.config.js', 'scripts/**/*.mjs'],
    languageOptions: { sourceType: 'module', globals: globals.node },
  },
];
