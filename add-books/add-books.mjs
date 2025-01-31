import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from "mysql2";

import { DB_CONFIG } from './db-config.js';
import * as clean from './clean-utils.js'
import * as parse from './parse-utils.mjs'
import * as db from './db-utils.js'

const __dirname = path.resolve();

class AddBooks {
  start() {
    console.log('Start looking for books....');
    this.getFiles(__dirname + '/' + process.argv[2], (err, results) => {
      if (err) {
        throw err;
      }
      console.log(`Found ${results.length} files.`);
      this.parseFiles(results).then(() => {
        console.log('All done!')
      })
    });
  }

  getFiles(dir, done) {
    let results = [];
    fs.readdir(dir, (err, list) => {
      const next = () => {
        var file = list[i++];
        if (!file) return done(null, results);
        file = path.resolve(dir, file);
        fs.stat(file, (err, stat) => {
          if (stat && stat.isDirectory()) {
            this.getFiles(file, (err, res) => {
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
      };

      if (err) return done(err);
      let i = 0;
      next();
    });
  }

  async parseFiles(results) {
    const pool = mysql.createPool(DB_CONFIG);

    for (let file of results) {
      try {
        const encoding = await parse.getFileEncoding(file);
        const bookData = await parse.parseFile(file, encoding);
        bookData.content = clean.cleanupSpaces(clean.simplifyFb2Data(bookData));
        await db.addBookToDataBase(pool, bookData)
            .then(name => console.log('Added to database: '+ name))
            .catch(err => console.error(err.message));

      } catch (e) {
        console.error(e);
      }
    }

    pool.end();
  }
}

new AddBooks().start();



