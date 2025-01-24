module.exports = {
    entry: {
        server: './books-tts-api-server.js',
    },
    output: {
        filename: 'books-tts-api-server.cjs',
        path: __dirname + '/dist'
    },
    target: 'node',
    externalsPresets: { node: true },
    node: {
        __dirname: false,
        __filename: false,
    }
}
