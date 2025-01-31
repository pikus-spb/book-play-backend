import mysql from "mysql2";
import { DB_CONFIG } from './db-config.js';

import { getAuthorName } from './utils.js'

const pool = mysql.createPool(DB_CONFIG);

export default class BooksAPIApp {
    all() {
        return new Promise(resolve => {
            pool.query('SELECT id, authorFirstName, authorLastName, title, bookFullName FROM books ORDER BY bookFullName ASC', (err, result) => {
                if (err) {
                    console.error(err);
                }

                resolve(result);
            });
        });
    }

    groupedByAuthor() {
        return new Promise(resolve => {
            pool.query('SELECT id, authorFirstName, authorLastName, title, bookFullName FROM books', (err, result) => {
                if (err) {
                    console.error(err);
                }

                resolve([ ...result].reduce((memo, row) => {
                    const author = getAuthorName(row);
                    if (!memo[author]) {
                        memo[author] = [];
                    }
                    memo[author].push(row);

                    return memo;
                }, {}));

                  // TODO: sort by book name?
                  //  .map(data => {
                  // (data).forEach(name => {
                  //     data[name] = data[name].sort((a, b) => {
                  //         return a.bookFullName.localeCompare(b.bookFullName);
                  //     })
                  // });

            });
        });
    }

    byId(id) {
        return new Promise(resolve => {
            pool.query(`SELECT bookFullName, content FROM books WHERE id = ${id}`, (err, result) => {
                if (err) {
                    console.error(err);
                }
                resolve(result[0]);
            });
        });
    }

    async authorLetters() {
        const letters = `а,б,в,г,д,е,ж,з,и,к,л,м,н,о,п,р,с,т,у,ф,х,ц,ч,ш,щ,э,ю,я`.split(',');
        const responseResult = [];

        const promises = letters.map(letter => {
            return new Promise((resolve, reject) => {
                pool.query(`SELECT id FROM books WHERE authorLastName LIKE '${letter}%' limit 1`, (err, result) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    }
                    if (result.length === 1) {
                        responseResult.push(letter);
                    }
                    resolve(result);
                });
            });
        });

        await Promise.all(promises);

        return responseResult;
    }

    search(pattern) {
        return new Promise(resolve => {
            pool.query(`SELECT id, authorFirstName, authorLastName, title, bookFullName FROM books WHERE bookFullName LIKE '%${pattern}%'`, (err, result) => {
                if (err) {
                    console.error(err);
                }
                resolve(result);
            });
        });
    }
}
