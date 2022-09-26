import { merge }  from 'webpack-merge';
import path from 'path';
import * as url from 'url';

const  __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import sharedConfig from './webpack.shared-config.js';

import HtmlWebpackPlugin from 'html-webpack-plugin';

export default merge(sharedConfig, {
  mode: 'development',
  entry: {
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
  },
  optimization: {
    runtimeChunk: 'single'
  },
});
