const {configs} = require('@eslint/js');

module.exports = [
  configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'error'
    }
  }
];
