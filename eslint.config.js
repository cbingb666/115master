import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
  rules: {
    /** 禁用 alert */
    'no-alert': 'off',
    /** 禁用 console */
    'no-console': 'off',
    /** 使用数字属性而不是数字方法 */
    'unicorn/prefer-number-properties': 'off',
    /**
     * 将非 JSDoc 注释转换为 JSDoc 注释
     * @see https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/convert-to-jsdoc-comments.md#repos-sticky-header
     */
    'jsdoc/convert-to-jsdoc-comments': ['warn', {
      /** 启用修复器 */
      enableFixer: true,
      /** 对不带换行符的非 JSDoc 注释的转换应执行什么策略。（带换行符的非 JSDoc（多行）注释将始终转换为multi样式化的 JSDoc 注释。） */
      enforceJsdocLineStyle: 'single',
      /** 指定在转换为 JSDoc 注释之前和之后应考虑哪些上下文。 */
      contextsBeforeAndAfter: [
        'VariableDeclarator',
        'TSPropertySignature',
        'PropertyDefinition',
        'VariableDeclaration',
      ],
    }],
    /** 显式成员可访问性 */
    'ts/explicit-member-accessibility': ['error', {
      /** 不强制使用 public 修饰符 */
      accessibility: 'no-public',
    }],
    /** 成员排序 */
    '@typescript-eslint/member-ordering': 'error',
    /** 自定义事件名称大小写 */
    'vue/custom-event-name-casing': 'off',
    /** 强制 Vue 组件块的顺序 */
    'vue/block-order': ['error', {
      order: ['template', 'script', 'style'],
    }],
  },
})
