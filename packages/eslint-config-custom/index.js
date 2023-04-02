module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'turbo',
    'prettier'
  ],
  'overrides': [
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module'
  },
  'plugins': [
    'react',
    '@typescript-eslint'
  ],
  'rules': {
    'semi-style': ['error', 'last'],
    'switch-colon-spacing': ['error', { 'after': true, 'before': false }],
    'space-infix-ops': 'error',
    'arrow-spacing': 'error',
    'comma-spacing': ['error', { 'before': false, 'after': true }],
    'no-trailing-spaces': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    'eqeqeq': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'prefer-const': ['error', { 'destructuring': 'any', 'ignoreReadBeforeAssign': false }],
    'indent': ['error', 2, {
      'SwitchCase': 1,
      'ObjectExpression': 1,
      'FunctionExpression': {
        'body': 1, 'parameters': 1
      }
    }],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'block-spacing': 'error'
  }
};
