import fs from 'fs';
import pdf from 'pdf-parse';

let dataBuffer = fs.readFileSync('Docs/The_24_Hour_AI_Engine.pdf');

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(function(err) {
    console.error(err);
});
