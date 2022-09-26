import { merge }  from 'webpack-merge';
import path from 'path';
import * as url from 'url';

const  __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import sharedConfig from './webpack.shared-config.js';

export default merge(sharedConfig, {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../../dist/browser')
  },
});
