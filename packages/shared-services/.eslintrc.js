module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json', // Link to your tsconfig.json
  },
  rules: {
    // Add any specific rules or overrides here
    // Example:
    // '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
  },
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "**/*.js" // Ignoring JS files in a TS project, adjust if you have mixed JS/TS
  ]
};
