import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import http from 'http';
// import https from 'https';
import BooksAPIApp from './books-api-app.js';
import cors from 'cors';

// const privateKey  = fs.readFileSync('/etc/letsencrypt/live/book-play.ru/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/book-play.ru/cert.pem', 'utf8');
// const credentials = {key: privateKey, cert: certificate};

const expressApp = express();
const allowlist = ['*']

function corsOptionsDelegate(req, callback) {
    if (allowlist.indexOf(req.header('Origin')) >= 0) {
        callback(null, { origin: true }); // reflect (enable) the requested origin in the CORS response
    } else {
        callback(null, { origin: false }); // disable CORS for this request
    }
}

expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(bodyParser.json())

const httpServer = http.createServer(expressApp);
// const httpsServer = https.createServer(credentials, expressApp);

const app = new BooksAPIApp();
const HTTP_APP_PORT = 8181;
// const HTTPS_APP_PORT = 8143;

httpServer.listen(HTTP_APP_PORT, () => {
    console.log(`Web server is listening on port ${HTTP_APP_PORT}`);
});

// httpsServer.listen(HTTPS_APP_PORT, () => {
//     console.log(`Web server is listening on port ${HTTPS_APP_PORT}`);
// });

expressApp.post('/tts', cors(corsOptionsDelegate), (req, res) => {
    const text = req.body.text;

    app.tts(text, req).then(file => {
        const filePath = path.join(file);
        const stat = fs.statSync(filePath);

        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': stat.size
        });

        const readStream = fs.createReadStream(filePath);

        readStream.pipe(res);
    });
});
