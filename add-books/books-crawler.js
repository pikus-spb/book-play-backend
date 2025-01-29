import fs from 'fs';
import path from 'path';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;
import * as win1251 from 'windows-1251';
import mysql from "mysql2";

import { DB_CONFIG } from './db-config.js';
const pool = mysql.createPool(DB_CONFIG);

const IMAGE_SIZE_MAX = 1000000;

function crawl(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          crawl(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          if (file.endsWith('.fb2')) {
            console.log('Found: ' + file + '...')
            results.push(file);
          }
          next();
        }
      });
    })();
  });
}

function getFileEncoding(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, null, (err, data) => {
      if (!err) {
        try {
          const encoding = data.toString().match(/encoding="([^"]+)"/)[1].toLowerCase();
          resolve(encoding);
        } catch (e) {
          reject(e);
        }
      } else {
        console.log(err);
      }
    });
  });
}

function cleanup(text) {
  return text.replaceAll('&nbsp;', ' ');
}

function getBookLogo(data) {
  const dom = new JSDOM("");
  const DOMParser = dom.window.DOMParser;
  const parser = new DOMParser();
  const document = parser.parseFromString(data, "text/xml");
  const imageElement = document.querySelector('coverpage image');
  if (imageElement != null) {
    const srcAttribute = Array.from(imageElement.attributes)
        .find(attr => {
          return Boolean(attr.localName.match('href'));
        })
        ?.value.substr(1);

    if (srcAttribute != null) {
      const binary = document.getElementById(srcAttribute);
      if (binary && binary.innerHTML.length < IMAGE_SIZE_MAX) {
        const imageType = binary.getAttribute('content-type');
        return {
          imageType,
          data: binary.innerHTML
        };
      }
    }
  }

  return null;
}


function readFile(file, encoding) {
  console.log('Reading ' + file + '...');
  return new Promise((resolve, reject) => {
    fs.readFile(file, null, (err, data) => {
      if (!err) {
        if (encoding === 'windows-1251') {
          data = win1251.decode(data);
          data = data.replace('windows-1251', 'UTF-8')
        }
        data = data.toString();
        const virtualConsole = new jsdom.VirtualConsole();
        virtualConsole.on("error", () => {});
        const document = new JSDOM(data, { virtualConsole }).window.document;

        let authorFirstName = document.querySelector('author first-name');
        if (authorFirstName) {
          authorFirstName = cleanup(authorFirstName.innerHTML);
        }
        let authorLastName = document.querySelector('author last-name');
        if (authorLastName) {
          authorLastName = cleanup(authorLastName.innerHTML);
        }
        const logo = getBookLogo(data);
        const title = cleanup(document.querySelector('book-title').innerHTML);

        if (authorFirstName && authorFirstName.length > 1 && authorLastName && authorLastName.length > 1 && title && title.length > 1) {
          resolve({authorFirstName, authorLastName, title, logo, document});
        } else {
          reject('Cannot add book: '+ title);
        }
      } else {
        reject('Error: '+ err.toString());
      }
    });
  });
}

function getBase64ImageData(logo) {
  return logo ? `data:${logo.imageType};base64,${logo.data}` : '';
}

function addToDataBase(bookData) {
  console.log('Adding to database: ' + bookData.title);
    return new Promise((resolve, reject) => {
      const {authorFirstName, authorLastName, title, logo, content} = bookData;
        pool.query(
            'INSERT INTO books (authorFirstName, authorLastName, title, bookFullName, logo, content) VALUES (?, ?, ?, ?, ?, ?)',
            [authorFirstName, authorLastName, title, `${authorFirstName} ${authorLastName} - ${title}`, getBase64ImageData(logo), content],
            (err, rows) => {
              if (err) {
                resolve('(not added)');
              } else {
                resolve(`${authorFirstName} ${authorLastName} - ${title}`);
              }
            }
        );
    });
}

function cleanCopyrights(text) {
  const content = text.replace(/(<([^>]+)>)/gi, "").trim();
  if (content.startsWith('©') ||
      content.match(/авторские права/gi) ||
      content.match(/создание fb2/gi) ||
      content.match(/Все права защищены/gi) ||
      content.match(/litres|литрес/gi)) {
    return null;
  }

  return text;
}

function simplifyFb2(bookData) {
  const node = bookData.document.querySelector('history');
  if (node) {
    node.remove();
  }
  const paragraphs = Array.from(bookData.document.querySelectorAll('body p'))
      .map(pNode => cleanCopyrights(pNode.innerHTML))
      .filter(text => text !== null);

  const result = [];
  result.push(`<?xml version="1.0" encoding="UTF-8"?>
<FictionBook xmlns:l="http://www.w3.org/1999/xlink" xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">
<description>`);
  if (bookData.logo) {
    result.push(`<coverpage><image l:href="#cover"/></coverpage>`);
  }

  result.push(`
  <author>
   <first-name>${bookData.authorFirstName}</first-name>
   <last-name>${bookData.authorLastName}</last-name>
  </author>
  <book-title>${bookData.title}</book-title> 
</description>
<body>
  ${paragraphs.map(item => '<p>' + item + '</p>').join('')}
</body>`);
  if (bookData.logo) {
    result.push(`<binary content-type="${bookData.logo.imageType}" id="cover">${bookData.logo.data}</binary>`);
  }
  result.push(`</FictionBook>`);

  return result.join('');
}

async function parseBooks(results) {
  for (let file of results) {
    try {
      const encoding = await getFileEncoding(file);
      const bookData = await readFile(file, encoding);
      bookData.content = cleanup(simplifyFb2(bookData));
      const bookName = await (addToDataBase(bookData));
      if (bookName) {
        console.log('Added: ' + bookName);
      }
    } catch (e) {
      console.log(e);
    }
  }

  return Promise.resolve('All Done!');
}

console.log('Start looking for books....');
crawl(__dirname + '/' + process.argv[2], (err, results) => {
  if (err) throw err;
  parseBooks(results).then((result) => {
    console.log(result);
    pool.end();
  })
});



