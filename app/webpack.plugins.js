const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
module.exports = [
  new HtmlWebpackPlugin({
    template: "./public/index.html",
  }),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: "public/assets",
        to: "assets",
        noErrorOnMissing: true,
      },
      {
        from: "icons",
        to: "icons",
        noErrorOnMissing: true,
      },
    ],
  }),
];
