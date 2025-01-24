const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        server: './books-api-server.js',
    },
    output: {
        filename: 'books-api-server.cjs',
        path: __dirname + '/dist'
    },
    target: 'node',
    externalsPresets: { node: true },
    node: {
        __dirname: false,
        __filename: false,
    }
}
