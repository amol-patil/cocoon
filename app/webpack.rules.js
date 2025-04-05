module.exports = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules\/.+\.node$/,
    use: "node-loader",
  },
  {
    test: /\.node$/,
    use: "node-loader",
  },
  {
    test: /\.(ts|tsx)$/,
    exclude: /(node_modules|bower_components)/,
    use: {
      loader: "ts-loader",
      options: {
        transpileOnly: true, // Speeds up compilation, relies on tsconfig for type checks
      },
    },
  },
  // CSS and Tailwind support
  {
    test: /\.css$/i,
    use: [
      { loader: "style-loader" },
      { loader: "css-loader" },
      { loader: "postcss-loader" },
    ],
  },
];
