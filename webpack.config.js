const webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      "events": require.resolve("events/"),
      "process": require.resolve("process/browser"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ]
};
