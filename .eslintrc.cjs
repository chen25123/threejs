/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // 必须放在最后，覆盖与 Prettier 冲突的规则
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Vue 规则
    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': ['warn', {
      html: { void: 'always', normal: 'never' },
      svg: 'always',
      math: 'always',
    }],

    // TypeScript 规则
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',

    // 通用规则（关闭与 TS 冲突的规则）
    'no-unused-vars': 'off', // 改用 @typescript-eslint/no-unused-vars
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'prefer-const': 'warn',
  },
  overrides: [
    {
      files: ['*.config.ts', '*.config.cjs'],
      env: { node: true },
    },
  ],
}
