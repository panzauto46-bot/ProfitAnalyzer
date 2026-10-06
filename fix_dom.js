const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

// Kita pastikan ke-4 tab ini adalah child langsung dari div.main-content
const mainContent = document.getElementById('mainContent');
const tabs = ['tabAnalyzer', 'tabData', 'tabIklan', 'tabKeuangan'];

tabs.forEach(tabId => {
    const tab = document.getElementById(tabId);
    if (tab && tab.parentElement !== mainContent) {
        console.log(`Memindahkan ${tabId} ke mainContent`);
        mainContent.appendChild(tab);
    }
});

// Serialize back to HTML
const newHtml = dom.serialize();
fs.writeFileSync('index.html', newHtml);
console.log('Selesai memperbaiki struktur DOM');
