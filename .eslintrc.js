module.exports = {
  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    'lines-between-class-members': ['error', 'always', {
      exceptAfterSingleLine: true
    }],
    'comma-dangle': ['error', 'only-multiline'],
    'no-useless-constructor': 'off', // duplicate "@typescript-eslint/no-useless-constructor"
    '@typescript-eslint/no-unused-vars': 'off', // duplicate tsconfig
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'comma',
        requireLast: true
      },
      singleline: {
        delimiter: 'comma',
        requireLast: false
      }
    }],
    '@typescript-eslint/explicit-member-accessibility': ['error', {
      accessibility: 'no-public',
      overrides: {
        parameterProperties: 'off'
      }
    }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  overrides: [
    {
      files: ['packages/**/__tests__/**/*'],
      rules: {
        camelcase: ['off'],
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    }
  ]
}
