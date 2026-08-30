import fs from 'fs';

const b64 = fs.readFileSync('d:/antigravity/love-taiwan-368/public/logo.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image href="data:image/png;base64,${b64}" width="512" height="512" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
fs.writeFileSync('d:/antigravity/love-taiwan-368/public/favicon.svg', svg);
console.log('favicon.svg generated!');
