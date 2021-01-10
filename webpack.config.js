const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: "./src/main.ts",
  output: {
      filename: "src/dist/bundle.js"
  },
  watch: true,
  resolve: {
      modules: [path.resolve(__dirname,'node_modules'), 'node_modules'],
      // Add '.ts' and '.tsx' as a resolvable extension.
      extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ],
  module: {
      loaders: [
          // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
          { test: /\.tsx?$/, loader: "ts-loader" }
      ]
  },
  node: {
    net: 'empty',
  }
};