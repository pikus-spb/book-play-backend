export const cleanCopyrights = (text) => {
    const content = text.replace(/(<([^>]+)>)/gi, "").trim();
    if (content.startsWith('©') ||
        content.match(/авторские права/gi) ||
        content.match(/создание fb2/gi) ||
        content.match(/Издательство [а-я]+®/gi) ||
        content.match(/Royallib/gi) ||
        content.match(/Все книги автора/gi) ||
        content.match(/Эта же книга в других форматах/gi) ||
        content.match(/Приятного чтения!/gi) ||
        content.match(/Copyright ©/gi) ||
        content.match(/All rights reserved/gi) ||
        content.match(/Все права защищены/gi) ||
        content.match(/litres|литрес/gi)) {
        return null;
    }

    return text;
};

export const simplifyFb2Data = (bookData) => {
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

    result.push(`<author>
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
};

export const cleanupSpaces = (text) => {
    return text.replaceAll('&nbsp;', ' ');
};
