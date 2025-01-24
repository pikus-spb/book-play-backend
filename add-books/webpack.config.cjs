const webpack = require("webpack");
module.exports = {
    entry: {
        server: './books-crawler.js',
    },
    output: {
        filename: 'books-crawler.cjs',
        path: __dirname + '/dist'
    },
    target: 'node',
    node: {
        // Need this when working with express, otherwise the build fails
        __dirname: false,   // if you don't put this is, __dirname
        __filename: false,  // and __filename return blank or /
    },
    plugins: [
        new webpack.IgnorePlugin({
            resourceRegExp: /canvas/,
            contextRegExp: /jsdom$/,
        }),
    ],
}
