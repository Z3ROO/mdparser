import path from 'path';
import * as url from 'url';

const  __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
  mode: 'development',
  entry: {
    index: './src/index.ts',
    testPage: './config/test-template/testPage.js'
  },
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'MdParser',
      template: './config/test-template/testPage.html'
    })
  ],  
  output: {
    path: path.resolve(__dirname, '../../sandbox'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/i,
        use: ['ts-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx']
  },
  devServer: {
    static: './sandbox'
  },  
  optimization: {
    runtimeChunk: 'single'
  },
}