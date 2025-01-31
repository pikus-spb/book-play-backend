import express from 'express';
// import fs from 'fs';
import http from 'http';
// import https from 'https';
import BooksAPIApp from './books-api-app.js';
import cors from 'cors';

// const privateKey  = fs.readFileSync('/etc/letsencrypt/live/book-play.ru/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/book-play.ru/cert.pem', 'utf8');
// const credentials = {key: privateKey, cert: certificate};

const expressApp = express();
const allowlist = ['http://localhost:4200', 'http://192.168.31.200', 'https://book-play.ru']

function corsOptionsDelegate(req, callback) {
    if (allowlist.indexOf(req.header('Origin')) >= 0) {
        callback(null, { origin: true }); // reflect (enable) the requested origin in the CORS response
    } else {
        callback(null, { origin: false }); // disable CORS for this request
    }
}

const httpServer = http.createServer(expressApp);
// const httpsServer = https.createServer(credentials, expressApp);

const app = new BooksAPIApp();
const HTTP_APP_PORT = 8282;
// const HTTPS_APP_PORT = 8443;

httpServer.listen(HTTP_APP_PORT, () => {
    console.log(`Web server is listening on port ${HTTP_APP_PORT}`);
});
// httpsServer.listen(HTTPS_APP_PORT, () => {
//     console.log(`Web server is listening on port ${HTTPS_APP_PORT}`);
// });

expressApp.get('/book/all', cors(corsOptionsDelegate), (req, res) => {
    app.all().then(books => {
        res.json(books);
    }).catch(err => {
        res.json(err);
    });
});

expressApp.get('/book/all/grouped-by-author', cors(corsOptionsDelegate), (req, res) => {
    app.groupedByAuthor().then(books => {
        res.json(books);
    }).catch(err => {
        res.json(err);
    });
});

expressApp.get('/book/:id', cors(corsOptionsDelegate), (req, res) => {
    const id = req.params.id;
    app.byId(id).then(book => {
        res.json(book);
    }).catch(err => {
        res.json(err);
    });
});


expressApp.get('/book/author/first-letter/list', cors(corsOptionsDelegate), (req, res) => {
    app.authorLetters().then(letters => {
        res.json(letters);
    }).catch(err => {
        res.json(err);
    });
});

expressApp.get('/book/name/like/:pattern', cors(corsOptionsDelegate), (req, res) => {
    const search = req.params.pattern;
    app.search(search).then(books => {
        res.json(books);
    }).catch(err => {
        res.json(err);
    });
});
