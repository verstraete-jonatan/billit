import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'


const customReactRules = {
  'react/jsx-uses-react': 'off',
  'react/react-in-jsx-scope': 'off',
  'react/jsx-key': 'warn',
  'react/jsx-no-duplicate-props': 'warn',
  'react/jsx-no-leaked-render': ['warn', { validStrategies: ['coerce', 'ternary'] }],
  'react/jsx-no-target-blank': 'warn',
  'react/jsx-no-undef': ['warn', { allowGlobals: true }],
  'react/jsx-no-useless-fragment': 'warn',
  'react/jsx-pascal-case': 'warn',
};


export default tseslint.config(
  { ignores: ['node_modules/', 'public/', 'build/', 'dist'],},
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-duplicate-imports': ['error', { includeExports: true }],
      'arrow-body-style': ['warn', 'as-needed'],
      ...customReactRules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
