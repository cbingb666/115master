import { baseConfig, tailwindConfig } from '@115master/eslint-config'

export default baseConfig.append(...tailwindConfig, {
  name: 'monkey/icon-boundary',
  files: ['src/**/*.{ts,tsx,vue}'],
  ignores: ['src/icons/icon.tsx'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{
        name: '@iconify/vue',
        importNames: ['Icon'],
        message: '业务图标必须从 @/icons 导入；仅 icons/icon.tsx 可以适配 @iconify/vue。',
      }],
    }],
  },
})
