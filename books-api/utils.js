export const getAuthorName = (data) => {
  return cleanup(data.authorFirstName) + ' ' + cleanup(data.authorLastName);
};

const cleanup = (text) => {
  return fixCapitalizedLetters(trimSpaces(text));
};

const fixCapitalizedLetters = (text) => {
    text = text.toLowerCase();
    return String(text).charAt(0).toUpperCase() + String(text).slice(1);
};

const trimSpaces = (text) => {
  return text.trim().replaceAll('  ', ' ')
};
