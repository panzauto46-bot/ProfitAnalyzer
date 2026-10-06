
const fs = require('fs');
let html = fs.readFileSync('E-commerce Profit.html', 'utf8');

// Replace CSS
html = html.replace(/<style>[\s\S]*?<\/style>/, '<link rel=\"stylesheet\" href=\"css/style.css\">');

// Replace JS
html = html.replace(/<script>[\s\S]*?<\/script>/, '<script src=\"js/core/utils.js\"></script>\n    <script src=\"js/core/app.js\"></script>\n    <script src=\"js/features/analyzer.js\"></script>\n    <script src=\"js/features/iklan.js\"></script>\n    <script src=\"js/features/keuangan.js\"></script>');

fs.writeFileSync('E-commerce Profit.html', html);
console.log('HTML updated');

