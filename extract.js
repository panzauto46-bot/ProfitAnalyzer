
const fs = require('fs');
const html = fs.readFileSync('E-commerce Profit.html', 'utf8');

const jsMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
let jsCode = '';
if (jsMatch) {
    jsCode = jsMatch[jsMatch.length - 1].replace(/<script[^>]*>|<\/script>/g, '');
}

const parts = jsCode.split(/\/\/[^\n]*\n\/\/\s+([A-Z\s]+)\n\/\/[^\n]*\n/);

let out = {};
out['app.js'] = '';
out['utils.js'] = '';
out['analyzer.js'] = '';
out['iklan.js'] = '';
out['keuangan.js'] = '';

let currentFile = 'app.js';
out[currentFile] = parts[0];

for (let i = 1; i < parts.length; i += 2) {
    let headerName = parts[i].trim();
    let code = parts[i+1] || '';
    
    if (['STATE', 'TAB SWITCHING', 'FILE HANDLING', 'INIT'].includes(headerName)) {
        currentFile = 'app.js';
    } else if (['FORMATTING', 'TOAST', 'DATA PREVIEW TABLE', 'FILE LIST', 'RESET', 'EXPORT'].includes(headerName)) {
        currentFile = 'utils.js';
    } else if (headerName === 'CALCULATE') {
        currentFile = 'analyzer.js';
    } else if (['IKLAN TOKO', 'IKLAN SIMULATOR LOGIC'].includes(headerName)) {
        currentFile = 'iklan.js';
    } else if (headerName === 'KEUANGAN LOGIC') {
        currentFile = 'keuangan.js';
    } else {
        currentFile = 'app.js';
    }
    
    out[currentFile] += '\n\n/* --- ' + headerName + ' --- */\n' + code;
}

fs.writeFileSync('js/core/app.js', out['app.js'].trim());
fs.writeFileSync('js/core/utils.js', out['utils.js'].trim());
fs.writeFileSync('js/features/analyzer.js', out['analyzer.js'].trim());
fs.writeFileSync('js/features/iklan.js', out['iklan.js'].trim());
fs.writeFileSync('js/features/keuangan.js', out['keuangan.js'].trim());

console.log('Split completed successfully');

