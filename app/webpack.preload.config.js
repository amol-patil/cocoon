const rules = require('./webpack.rules');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/preload.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  // Ensure Electron APIs are treated as externals
  externals: {
    electron: 'commonjs electron',
  },
  // Preload scripts run in a node-like environment
  target: 'electron-preload',
  devtool: 'source-map',
}; 