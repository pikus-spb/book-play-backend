import jsdom from 'jsdom';
const { JSDOM } = jsdom;
import mysql from 'mysql2';

import { DB_CONFIG } from './db-config.js';

const pool = mysql.createPool(DB_CONFIG);

function readBooks() {
    console.log('Getting books from DB...');
    return new Promise(resolve => {
        pool.query(`SELECT * FROM books`, (err, result) => {
            if (err) {
                console.error(err);
            }
            resolve(result);
        });
    });
}

function cleanCopyrights(book) {
    const dom = new JSDOM("");
    const DOMParser = dom.window.DOMParser;
    const XMLSerializer = dom.window.XMLSerializer;
    const parser = new DOMParser();
    const document = parser.parseFromString(book.content, "text/xml");

    let hasCopyrights = false;
    Array.from(document.querySelectorAll('p') || []).forEach(pNode => {
        const content = pNode.innerHTML.trimStart();
        if (content.startsWith('©') ||
            content.match(/[a-z<>]*Все права защищены/gi) ||
            content.match(/litres|литрес/gi)
        ) {
            console.log('Found copyrights: ' + book.title)
            pNode.remove();
            hasCopyrights = true;
        }
    });

    if (hasCopyrights) {
        console.log('Removing image as copyright: ' + book.title);
        const imageElement = document.querySelector('coverpage image');
        if (imageElement != null) {
            imageElement.remove();
        }
        book.content = `<?xml version="1.0" encoding="UTF-8"?>` + new XMLSerializer().serializeToString(document);
        return book;
    }

    return null;
}

function updateBook(book) {
    if (book === null) {
        return Promise.resolve();
    }

    console.log('Updating content for: ' + book.title);
    return new Promise((resolve, reject) => {
        pool.query(`UPDATE books 
          SET content = "${book.content.replaceAll('"', '\\"')}", logo = ""
          WHERE id = ${book.id}`,
            (err, result) => {
            if (err) {
              console.error(err);
              reject(err);
            }
            resolve(result);
          }
        );
    });
}

readBooks().then(async (books) => {
    for (let book of books) {
        await updateBook(cleanCopyrights(book));
    }

    console.log('All done!');
});


