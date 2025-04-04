const path = require('path');
const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

// Export a function that returns the webpack config
// This is required by Electron Forge's webpack plugin
module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/renderer/index.tsx',
    output: {
      path: path.resolve(__dirname, '.webpack/renderer'),
      filename: 'index.js',
      libraryTarget: 'umd'
    },
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
    // Use 'source-map' in dev, false in prod
    devtool: isProduction ? false : 'source-map', // Changed dev value to 'source-map' for potentially faster rebuilds
    // Keep devServer settings, they don't affect production build
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
}; 