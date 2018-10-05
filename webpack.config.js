const path = require('path');

const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDebug = process.env['NODE_ENV'] !== 'production';

let plugins = [
  new MiniCssExtractPlugin({
    filename: '[name].css',
    chunkFilename: '[id].css'
  }),
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    'window.jQuery': 'jquery',
    Popper: ['popper.js', 'default']
  }),
];

module.exports = {
  mode: isDebug ? 'development' : 'production',
  entry: './static/js/index.js',
  watch: isDebug,
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'static/dist')
  },

  plugins: plugins,

  module: {
    rules: [
      // {
      //   test: /\.js$/,
      //   exclude: /(node_modules|bower_components)/,
      //   use: [
      //     { loader: 'babel-loader' },

      //   ]
      // },
      {
        test: /\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: { sourceMap: isDebug } },
        ]
      },
      {
        test: /\.scss$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: { sourceMap: isDebug } },
          { loader: 'sass-loader',
            options: {
              sourceMap: isDebug,
              includePaths: ['./node_modules']
            }
          }
        ]
      },
      {
        test: /.(jpe?g|png|gif)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: '../assets/images',
            publicPath: '../assets/images'
          }
        }]
      },
      {
        test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: '../assets/fonts',
            publicPath: '../assets/fonts'
          }
        }]
      }
    ]
  }
};
