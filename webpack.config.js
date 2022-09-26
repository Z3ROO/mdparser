import path from 'path';
import * as url from 'url';

const  __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
  mode: 'development',
  entry: {
    index: './dist/esm/index.mjs',
    testPage: './config/test-template/testPage.js'
  },
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
  devServer: {
    static: './sandbox'
  },  
  optimization: {
    runtimeChunk: 'single'
  },
}