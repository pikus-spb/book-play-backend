const getBase64ImageData = (logo) => {
    return logo ? `data:${logo.imageType};base64,${logo.data}` : '';
};

export const addBookToDataBase = (pool, bookData) => {
    console.log('Adding to database: ' + bookData.title);
    return new Promise((resolve, reject) => {
        const {authorFirstName, authorLastName, title, logo, content} = bookData;
        pool.query(
            'INSERT INTO books (authorFirstName, authorLastName, title, bookFullName, logo, content) VALUES (?, ?, ?, ?, ?, ?)',
            [authorFirstName, authorLastName, title, `${authorFirstName} ${authorLastName} - ${title}`, getBase64ImageData(logo), content],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(`${authorFirstName} ${authorLastName} - ${title}`);
                }
            }
        );
    });
};
