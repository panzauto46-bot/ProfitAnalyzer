const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(html);
const document = dom.window.document;

['tabAnalyzer', 'tabData', 'tabIklan', 'tabKeuangan'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        console.log(`${id} parent: ${el.parentElement.id || el.parentElement.className}`);
    } else {
        console.log(`${id} NOT FOUND`);
    }
});
