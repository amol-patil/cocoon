// .eslintrc.js
module.exports = {
  env: {
    browser: true, // For renderer process code
    es2021: true,
    node: true, // For main process code
  },
  extends: [
    "eslint:recommended", // Base ESLint rules
    "plugin:@typescript-eslint/recommended", // Recommended TypeScript rules
    "plugin:react/recommended", // Recommended React rules
    "plugin:react-hooks/recommended", // Recommended React Hooks rules
    "prettier", // Turns off formatting rules that conflict with Prettier
  ],
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser for TypeScript
  parserOptions: {
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
    ecmaVersion: 12, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  plugins: [
    "@typescript-eslint", // Plugin for TypeScript rules
    "react", // Plugin for React rules
  ],
  settings: {
    react: {
      version: "detect", // Automatically detects the React version
    },
  },
  rules: {
    // Add any specific rule overrides here if needed
    // e.g., 'react/react-in-jsx-scope': 'off', // Often not needed with newer React/JSX transforms
    // e.g., '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    "react/prop-types": "off", // Disable prop-types as we use TypeScript
    "@typescript-eslint/explicit-module-boundary-types": "off", // Optional: Allow functions without explicit return types if inferred
  },
  ignorePatterns: [
    ".webpack/**/*", // Ignore Webpack output directory
    "node_modules/**/*",
    "out/**/*", // Ignore Electron Forge output directory
    "dist/**/*", // Ignore other potential build output
    "*.js", // Ignore root JS config files like forge.config.js, webpack.*.js etc. (can refine if needed)
  ],
};
