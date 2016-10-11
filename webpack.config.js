const webpack = require('webpack')
const CompressionPlugin = require('compression-webpack-plugin')
const path = require('path')
const config = {
  context: path.join(__dirname, 'apps/candle/web/static/ts')
  , entry: './main'
  , output: {
      path: 'apps/candle/priv/static/js',
      filename: 'main.js'
  }
  , resolve: {
    moduleDirectories: [path.resolve('./node_modules')],
    extensions: ["",  ".js", ".ts"]
  }
  , module: {
    loaders: [
        { test: /\.ts$/, loader: "ts-loader" }
    ]
  }
  , devtool: '#source-map'
  , plugins: [
    new webpack.optimize.UglifyJsPlugin(),
    new CompressionPlugin({
        asset: "[path].gz[query]",
        algorithm: "gzip"//,
        //test: /\.js$|\.html$/,
        //threshold: 10240,
        //minRatio: 0.8
    })
  ]
  // , resolveLoader: {
  //   root: path.join(__dirname, 'node_modules')
  // }
};

module.exports = config;

//var webpack = require("webpack");

// returns a Compiler instance
// var compiler = webpack(config);

// compiler.run(function(err, stats) {
//     console.log(`Webpack done...`)
// });
// // or
// compiler.watch({ // watch options:
//     aggregateTimeout: 300, // wait so long for more changes
//     poll: true // use polling instead of native watchers
//     // pass a number to set the polling interval
// }, function(err, stats) {
//     // ...
// });


