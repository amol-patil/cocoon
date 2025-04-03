const path = require('path');
const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
  target: 'web', // Change target to 'web'
  devtool: 'inline-source-map', // Good source maps for development
  devServer: {
    port: 3001, // Use a specific port
    hot: false, // Disable HMR temporarily
    liveReload: true, // Keep liveReload for now
    static: {
      directory: path.resolve(__dirname, 'public'), // Serve static files from public
      publicPath: '/',
    },
    historyApiFallback: true, // Helps with routing in SPA
    // We need to disable host check for HMR in Electron env
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*', // Allow CORS for HMR
    },
  },
  // Explicitly tell webpack not to polyfill or mock node globals/modules
  node: false,
}; 