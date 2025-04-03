const path = require('path');
const rules = require('./webpack.rules');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/main.ts',
  // Put it into the `.webpack/main` folder
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: 'index.js',
    libraryTarget: 'commonjs2', // Ensure correct module format for Electron main
  },
  // Tell Webpack to compile TypeScript files
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  target: 'electron-main', // Specify target
}; 