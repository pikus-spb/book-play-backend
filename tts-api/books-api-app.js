import mysql from "mysql2";
import { DB_CONFIG } from './db-config.js';
const { spawn, execSync } = require('child_process');
const pool = mysql.createPool(DB_CONFIG);

export default class BooksAPIApp {
    loadFromDb(text) {
        return new Promise(resolve => {
            pool.query(`SELECT fileName, used FROM audiocache WHERE text = "${text}"`, (err, result) => {
                if (err) {
                    console.error(err);
                }

                if (result && result[0]) {
                    const used = result[0].used + 1;
                    pool.query(
                        `UPDATE audiocache
                         SET used = ${used}
                         WHERE text = "${text}"`,
                         (err2) => {
                            if (err) {
                                console.error(err2);
                            }
                        }
                    );
                }

                resolve(result && result[0]);
            });
        });
    }

    saveToDb(text, fileName) {
        return new Promise((resolve, reject) => {
            pool.query(
                'INSERT INTO audiocache (text, fileName, used) VALUES (?, ?, ?)',
                [text, fileName, 0],
                err => {
                    if (err) {
                        reject(err);
                    }
                    resolve(fileName);
                }
            );
        });
    }

    killOnClose(req, child, reject) {
        req.connection.on('close', () => {
            console.log('Request cancelled. Killing ' + child.pid + '...');
            try {
                process.kill(child.pid, 9);
                console.log('Successfully killed process ' + child.pid + '.');
            } catch (e) {
                console.log('Could not kill process:' + child.pid)
            }
            reject();
        });

    }

    runTts(text, fileName, req) {
        return new Promise(async (resolve, reject) => {
            const args1 = ['--model', '/home/petr/piper/model.onnx', '--output-raw'];
            const child1 = spawn('/home/petr/piper/piper', args1, {detached: true});

            const args2 = ['-f', 's16le', '-ar', '22500', '-ac', '1', '-i', 'pipe:', '-f', 'mp3', fileName];
            const child2 = spawn('/usr/bin/ffmpeg', args2, {detached: true});

            child1.stdout.pipe(child2.stdin);

            child1.stdin.write(text);
            child1.stdin.end();

            this.killOnClose(req, child1, reject);

            child2.on('close', () => {
                setTimeout(() => resolve(fileName), 100);
            })
        });
    }

    tts(paragraph, req) {
        return this.loadFromDb(paragraph).then(loadResult => {
            if (loadResult) {
                console.log('Cache used: ' + loadResult.fileName)
                return loadResult.fileName;
            } else {
                const fileName = __dirname + '/cache/part' + Date.now() + '.mp3';
                return this.runTts(paragraph, fileName, req).then(() => {
                    return this.saveToDb(paragraph, fileName);
                }).catch(e => {
                    console.error(e);
                    return '';
                });
            }
        });
    }
}
