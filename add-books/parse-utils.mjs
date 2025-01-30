import fs from "fs";
import jsdom from 'jsdom';
import * as win1251 from 'windows-1251';

import { CleanUtils } from './clean-utils.js'

const { JSDOM } = jsdom;
const IMAGE_SIZE_MAX = 1000000;

export class ParseUtils {
    getFileEncoding(file) {
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
                    reject(err);
                }
            });
        });
    }

    parseFile(file, encoding) {
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
                    virtualConsole.on("error", (e) => {
                        reject(e);
                    });

                    const document = new JSDOM(data, {virtualConsole}).window.document;

                    const cleanup = new CleanUtils().cleanupSpaces;

                    let authorFirstName = document.querySelector('author first-name');
                    if (authorFirstName) {
                        authorFirstName = cleanup(authorFirstName.innerHTML);
                    }
                    let authorLastName = document.querySelector('author last-name');
                    if (authorLastName) {
                        authorLastName = cleanup(authorLastName.innerHTML);
                    }

                    const logo = this.parseBookLogo(data);
                    const title = cleanup(document.querySelector('book-title').innerHTML);

                    if (authorFirstName && authorFirstName.length > 1 && authorLastName && authorLastName.length > 1 && title && title.length > 1) {
                        resolve({authorFirstName, authorLastName, title, logo, document});
                    } else {
                        reject('Cannot parse book: ' + title);
                    }
                } else {
                    reject(err);
                }
            });
        });
    }

    parseBookLogo(data) {
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
}
