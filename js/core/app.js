/* --- STATE --- */
let rawHeaders = [];
let rawRows = [];
let parsedData = null;
let lastCalcResult = null;
let columnMapping = { adSpend: -1, grossRevenue: -1, totalOrders: -1, productName: -1 };
let loadedFiles = [];

// Known column aliases for auto-detection
const COLUMN_ALIASES = {
    adSpend: [
        'biaya', 'ad spend', 'ad cost', 'biaya iklan', 'cost', 'total biaya',
        'advertising cost', 'biaya promosi', 'spend', 'pengeluaran iklan'
    ],
    grossRevenue: [
        'pendapatan kotor', 'gross revenue', 'revenue', 'pendapatan',
        'total pendapatan', 'total revenue', 'penjualan kotor', 'omzet',
        'total penjualan', 'gmv', 'gross merchandise value', 'penghasilan bruto (toko saat ini)'
    ],
    totalOrders: [
        'pesanan sku (toko saat ini)', 'pesanan', 'orders', 'total orders', 'jumlah pesanan', 'order',
        'total pesanan', 'jumlah order', 'qty', 'quantity', 'unit sold'
    ],
    productName: [
        'nama produk', 'product name', 'item', 'produk', 'nama barang', 'product'
    ]
};



/* --- TAB SWITCHING --- */
function switchTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.nav-tab[data-tab="${tab}"]`).classList.add('active');

    document.getElementById('tabAnalyzer').style.display = tab === 'analyzer' ? 'block' : 'none';
    document.getElementById('tabData').style.display = tab === 'data' ? 'block' : 'none';
    document.getElementById('tabIklan').style.display = tab === 'iklan' ? 'block' : 'none';
    document.getElementById('tabKeuangan').style.display = tab === 'keuangan' ? 'block' : 'none';
}



/* --- FILE HANDLING --- */
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragging');
});

uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragging');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragging');
    if (e.dataTransfer.files.length) {
        handleFiles(Array.from(e.dataTransfer.files));
    }
});

fileInput.addEventListener('change', function(e) {
    if (e.target.files.length) {
        handleFiles(Array.from(e.target.files));
    }
});

function handleFiles(files) {
    const validFiles = files.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return ['csv', 'xlsx', 'xls'].includes(ext);
    });

    if (validFiles.length === 0) {
        showToast('Format tidak didukung. Gunakan CSV atau Excel.', 'error');
        return;
    }

    // Process first valid file (primary)
    processFile(validFiles[0]);
}

function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    document.getElementById('fileName').textContent = '⏳ Memproses...';

    function onSuccess(headers, rows) {
        rawHeaders = headers;
        rawRows = rows;

        // Update UI
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileHint').textContent = `${rows.length} baris data ditemukan`;
        document.getElementById('fileBadge').textContent = ext.toUpperCase();
        uploadZone.classList.add('has-file');
        document.getElementById('uploadIcon').className = 'ti ti-file-check';

        // Update file list
        loadedFiles = [{ name: file.name, rows: rows.length, ext: ext }];
        renderFileList();

        // Auto-detect columns
        autoDetectColumns(headers);

        // Render data preview
        renderDataPreview();
        
        // Update Iklan Toko Tab
        updateIklanToko();

        showToast(`File "${file.name}" berhasil diproses — ${rows.length} baris`, 'success');

        // Auto calculate if inputs are filled
        const adminFee = document.getElementById('adminFee').value;
        const cogsVal = document.getElementById('cogsInput').value;
        if (adminFee && cogsVal && allColumnsMapped()) {
            calculate();
        }
    }

    function onError(err) {
        rawHeaders = [];
        rawRows = [];
        parsedData = null;
        document.getElementById('fileName').textContent = 'Drop file atau klik di sini';
        document.getElementById('fileHint').textContent = 'Mendukung CSV & Excel (.xlsx, .xls)';
        document.getElementById('fileBadge').style.display = 'none';
        uploadZone.classList.remove('has-file');
        document.getElementById('uploadIcon').className = 'ti ti-file-upload';
        showToast(err.message, 'error');
    }

    if (ext === 'csv') {
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const { headers, rows } = parseCSVFull(ev.target.result);
                onSuccess(headers, rows);
            } catch (err) { onError(err); }
        };
        reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const { headers, rows } = parseExcelFull(ev.target.result);
                onSuccess(headers, rows);
            } catch (err) { onError(err); }
        };
        reader.readAsArrayBuffer(file);
    }
}

// ═══════════════════════════════════════════════════
// CSV PARSER (Full - returns headers + row arrays)
// ═══════════════════════════════════════════════════
function parseCSVFull(text) {
    const lines = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (current.trim()) lines.push(current);
            current = '';
            if (ch === '\r' && text[i + 1] === '\n') i++;
        } else { current += ch; }
    }
    if (current.trim()) lines.push(current);
    if (lines.length === 0) throw new Error('File kosong');

    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.split(';').length > firstLine.split(',').length) delimiter = ';';
    if (firstLine.split('\t').length > firstLine.split(delimiter).length) delimiter = '\t';

    function splitRow(line) {
        const fields = [];
        let field = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') inQ = !inQ;
            else if (ch === delimiter && !inQ) { fields.push(field.trim()); field = ''; }
            else field += ch;
        }
        fields.push(field.trim());
        return fields;
    }

    const headers = splitRow(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const row = splitRow(lines[i]);
        if (row.length > 0 && row.some(cell => cell !== '')) {
            rows.push(row);
        }
    }
    return { headers, rows };
}

// ═══════════════════════════════════════════════════
// EXCEL PARSER (Full)
// ═══════════════════════════════════════════════════
function parseExcelFull(arrayBuffer) {
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const allRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });

    if (allRows.length === 0) throw new Error('Excel file kosong');

    const headers = allRows[0].map(h => String(h).trim());
    const rows = allRows.slice(1).filter(r => r.some(cell => cell !== '' && cell != null));

    return { headers, rows };
}

// ═══════════════════════════════════════════════════
// COLUMN AUTO-DETECTION
// ═══════════════════════════════════════════════════
function autoDetectColumns(headers) {
    const headerLower = headers.map(h => String(h).toLowerCase().trim());

    // Reset
    columnMapping = { adSpend: -1, grossRevenue: -1, totalOrders: -1, productName: -1 };

    for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
        for (const alias of aliases) {
            const idx = headerLower.findIndex(h => h === alias);
            if (idx !== -1) {
                columnMapping[key] = idx;
                break;
            }
        }
        // Partial match fallback
        if (columnMapping[key] === -1) {
            for (const alias of aliases) {
                const idx = headerLower.findIndex(h => h.includes(alias) || alias.includes(h));
                if (idx !== -1) {
                    columnMapping[key] = idx;
                    break;
                }
            }
        }
    }

    renderMappingUI(headers);
}

function renderMappingUI(headers) {
    const grid = document.getElementById('mappingGrid');
    const section = document.getElementById('mappingSection');
    section.style.display = 'block';

    const fields = [
        { key: 'adSpend', label: 'Ad Spend', icon: 'ti-speakerphone' },
        { key: 'grossRevenue', label: 'Revenue', icon: 'ti-cash' },
        { key: 'totalOrders', label: 'Orders', icon: 'ti-shopping-cart' },
        { key: 'productName', label: 'Product Name', icon: 'ti-box' },
    ];

    grid.innerHTML = fields.map(f => {
        const options = headers.map((h, i) =>
            `<option value="${i}" ${columnMapping[f.key] === i ? 'selected' : ''}>${h}</option>`
        ).join('');

        const isMapped = columnMapping[f.key] !== -1;

        return `
            <div class="mapping-row">
                <span class="mapping-label"><i class="ti ${f.icon}"></i> ${f.label}</span>
                <select class="mapping-select" onchange="updateMapping('${f.key}', this.value)">
                    <option value="-1">— Pilih kolom —</option>
                    ${options}
                </select>
                <span class="mapping-status ${isMapped ? 'ok' : 'missing'}">
                    <i class="ti ${isMapped ? 'ti-check' : 'ti-x'}"></i>
                </span>
            </div>
        `;
    }).join('');
}

function updateMapping(key, value) {
    columnMapping[key] = parseInt(value);
    renderMappingUI(rawHeaders);
    renderDataPreview(); // Refresh highlight
    updateIklanToko(); // Refresh Iklan Toko tab
}

function allColumnsMapped() {
    return columnMapping.adSpend !== -1 &&
           columnMapping.grossRevenue !== -1 &&
           columnMapping.totalOrders !== -1;
}



/* --- INIT --- */
renderHistory();

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle')) {
        sidebar.classList.remove('open');
    }
});

// Close export modal on backdrop click
document.getElementById('exportModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('exportModal')) {
        closeExportModal();
    }
});

// Keyboard shortcut: Ctrl+Enter to calculate
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        calculate();
    }
});