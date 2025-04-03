const path = require('path');
const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

// Export a function that returns the webpack config
// This is required by Electron Forge's webpack plugin
module.exports = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      path: false,
      fs: false,
    },
  },
  target: 'web',
  devtool: 'inline-source-map',
  devServer: {
    port: 3001,
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
    },
    hot: false,
    liveReload: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
}; 