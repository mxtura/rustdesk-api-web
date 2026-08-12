import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      // сгенерированная protobuf-обвязка веб-клиента — не наш код
      'src/utils/webclient/**',
    ],
  },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // компоненты-страницы одним словом (index.vue и т.п.) — норма для этого проекта
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // в проекте есть один контролируемый v-html (ссылка на wiki)
      'vue/no-v-html': 'off',
    },
  },
  {
    // <script lang="ts"> внутри .vue — vue-eslint-parser делегирует разбор скрипта TS-парсеру
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
  },
  {
    // отдельные .ts-файлы вне webclient (который в ignores выше)
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
  },
  prettier,
]
