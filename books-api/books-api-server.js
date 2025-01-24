import express from 'express';
import fs from 'fs';
import http from 'http';
// import https from 'https';
import BooksAPIApp from './books-api-app.js';
import cors from 'cors';

// const privateKey  = fs.readFileSync('/etc/letsencrypt/live/book-play.ru/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/book-play.ru/cert.pem', 'utf8');
// const credentials = {key: privateKey, cert: certificate};

const expressApp = express();
const allowlist = ['http://localhost']

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

expressApp.get('/get-all', cors(corsOptionsDelegate), (req, res) => {
    app.getAll().then(books => {
        res.json(books);
    }).catch(err => {
        res.json(err);
    });
});
expressApp.get('/get-authors-by-letter/:letter', cors(corsOptionsDelegate), (req, res) => {
    const letter = req.params.letter;
    app.getByAuthorFirstLetter(letter).then(books => {
        res.json(books);
    }).catch(err => {
        res.json(err);
    });
});
expressApp.get('/get-author-letters', cors(corsOptionsDelegate), (req, res) => {
    app.getAuthorLetters().then(letters => {
        res.json(letters);
    }).catch(err => {
        res.json(err);
    });
});
expressApp.get('/get-by-id/:id', cors(corsOptionsDelegate), (req, res) => {
    const id = req.params.id;
    app.getById(id).then(book => {
        res.json(book);
    }).catch(err => {
        res.json(err);
    });
});
expressApp.get('/get-by-full-name/:name', cors(corsOptionsDelegate), (req, res) => {
    const name = req.params.name;
    app.getByFullName(name).then(books => {
        res.json(books);
    }).catch(err => {
        res.json(err);
    });
});
