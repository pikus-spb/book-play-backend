import mysql from "mysql2";
import { DB_CONFIG } from './db-config.js';

const pool = mysql.createPool(DB_CONFIG);

export default class BooksAPIApp {
    getAll() {
        return new Promise(resolve => {
            pool.query('SELECT id, authorFirstName, authorLastName, title, bookFullName FROM books ORDER BY bookFullName ASC', (err, result) => {
                if (err) {
                    console.error(err);
                }

                resolve(result);
            });
        });
    }
    getByAuthorFirstLetter(letter) {
        return new Promise(resolve => {
                pool.query(`SELECT id, authorFirstName, authorLastName, title, bookFullName, logo FROM books WHERE authorLastName LIKE '${letter}%'`, (err, result) => {
                if (err) {
                    console.error(err);
                }
                resolve(result);
            });
        });
    }
    async getAuthorLetters() {
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
    getById(id) {
        return new Promise(resolve => {
            pool.query(`SELECT bookFullName, content FROM books WHERE id = ${id}`, (err, result) => {
                if (err) {
                    console.error(err);
                }
                resolve(result[0]);
            });
        });
    }
    getByFullName(bookFullName) {
        return new Promise(resolve => {
            pool.query(`SELECT * FROM books WHERE bookFullName = "${bookFullName}" ORDER BY bookFullName ASC`, (err, result) => {
                if (err) {
                    console.error(err);
                }
                resolve(result);
            });
        });
    }
}
