
export default {
  entry: {
    index: './dist/esm/index.js'
  },
  output: {
    filename: '[name].bundle.js'
  },
  devServer: {
    static: './sandbox'
  }
}