var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname,
  devtool: '#inline-source-map',
  mode: 'development',
  entry: {
    Simple: path.join(__dirname + '/Simple/index.tsx'),
    RealWorld: path.join(__dirname + '/RealWorld/index.tsx'),
  },
  output: {
    path: __dirname,
    filename: '[name]/build.js',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  resolve: {
    alias: {
      'refect-next': path.join(__dirname, '..', 'src/'),
    },
    extensions: ['.js'],
  },

  stats: {
    colors: true,
    chunks: false,
  },

  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
      include: [
        __dirname,
        path.join(__dirname, '..', 'index.ts'),
      ],
    }, {
      test: /\.scss$/,
      use: ['style', 'css', 'sass'],
      include: [
        __dirname,
        path.join(__dirname, '..', 'node_modules'),
      ],
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
      include: [
        __dirname,
        path.join(__dirname, '..', 'node_modules'),
      ],
    }],
  },
};
