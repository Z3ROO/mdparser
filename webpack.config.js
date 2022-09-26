import process from "process";
import webpackDev from './config/webpack/webpack.dev-config.js'
import webpackProd from './config/webpack/webpack.prod-config.js'

const mode = process.env.NODE_ENV
let configFile;

if (mode === 'dev')
  configFile = webpackDev
else if (mode === 'prod')
  configFile = webpackProd
else 
  console.log('webpack-config-file: Invalid mode, check if NODE_ENV is set correctly.')

export default configFile
  