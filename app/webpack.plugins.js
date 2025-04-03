const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  new HtmlWebpackPlugin({
    template: './public/index.html',
  }),
  // Required for HMR - Temporarily removed
  // new webpack.HotModuleReplacementPlugin(),
]; 