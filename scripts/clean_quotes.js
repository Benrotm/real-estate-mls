const fs = require('fs');
const path = 'c:\\Users\\bensi\\Downloads\\Git hub Repository\\real-estate-mls\\app\\components\\ai-staging\\AIStagingClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace single quotes surrounding text inside spans
content = content.replace(/'([^']*)'(<\/span>)/g, '$1$2');

fs.writeFileSync(path, content);
console.log('Quotes cleaned!');
