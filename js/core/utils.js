/* --- FORMATTING --- */
function rp(v) {
    const abs = Math.abs(Math.round(v));
    const formatted = abs.toLocaleString('id-ID');
    return (v < 0 ? '-Rp' : 'Rp') + formatted;
}

function pct(v) {
    return (Math.round(v * 10) / 10).toString().replace('.', ',') + '%';
}

function rpShort(v) {
    const abs = Math.abs(v);
    if (abs >= 1e9) return (v < 0 ? '-' : '') + 'Rp' + (abs / 1e9).toFixed(1).replace('.0', '') + 'M';
    if (abs >= 1e6) return (v < 0 ? '-' : '') + 'Rp' + (abs / 1e6).toFixed(1).replace('.0', '') + 'Jt';
    if (abs >= 1e3) return (v < 0 ? '-' : '') + 'Rp' + (abs / 1e3).toFixed(0) + 'Rb';
    return rp(v);
}

// ═══════════════════════════════════════════════════
// NUMBER PARSER (supports Indonesian formatting)
// ═══════════════════════════════════════════════════
function parseNumber(str) {
    if (str == null) return 0;
    if (typeof str === 'number') return isNaN(str) ? 0 : str;
    str = String(str).trim();
    if (str === '' || str === '-') return 0;

    const directNum = Number(str);
    if (!isNaN(directNum)) return directNum;

    let cleaned = str.replace(/[^0-9.,\-]/g, '');
    if (cleaned === '') return 0;

    const dotCount = (cleaned.match(/\./g) || []).length;
    const commaCount = (cleaned.match(/,/g) || []).length;

    let normalized;
    if (dotCount > 1 || (dotCount >= 1 && commaCount === 1)) {
        normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (commaCount > 1) {
        normalized = cleaned.replace(/,/g, '');
    } else if (commaCount === 1 && dotCount === 0) {
        const afterComma = cleaned.split(',')[1];
        normalized = afterComma.length <= 2
            ? cleaned.replace(',', '.')
            : cleaned.replace(',', '');
    } else {
        normalized = cleaned;
    }
    return parseFloat(normalized) || 0;
}



/* --- TOAST --- */
function showToast(msg, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;

    const iconMap = { info: 'ti-info-circle', success: 'ti-check', error: 'ti-alert-triangle', warning: 'ti-alert-circle' };
    toast.innerHTML = `<i class="ti ${iconMap[type] || iconMap.info}"></i><span>${msg}</span>`;

    container.appendChild(toast);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ═══════════════════════════════════════════════════
// SIDEBAR TOGGLE (mobile)
// ═══════════════════════════════════════════════════
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}



/* --- DATA PREVIEW TABLE --- */
function renderDataPreview() {
    if (rawHeaders.length === 0) return;

    document.getElementById('dataPreviewEmpty').style.display = 'none';
    document.getElementById('dataPreviewTable').style.display = 'block';

    const mappedIndices = new Set([columnMapping.adSpend, columnMapping.grossRevenue, columnMapping.totalOrders].filter(i => i !== -1));

    // Head
    const thead = document.getElementById('previewHead');
    thead.innerHTML = `<tr>
        <th style="width:40px;">#</th>
        ${rawHeaders.map((h, i) => `<th class="${mappedIndices.has(i) ? 'col-mapped-header' : ''}">${h} ${mappedIndices.has(i) ? '<span class="col-badge">mapped</span>' : ''}</th>`).join('')}
    </tr>`;

    // Body (first 100 rows)
    const displayRows = rawRows.slice(0, 100);
    const tbody = document.getElementById('previewBody');
    tbody.innerHTML = displayRows.map((row, ri) => `<tr>
        <td style="color: var(--text-tertiary); font-size:11px;">${ri + 1}</td>
        ${rawHeaders.map((_, ci) => `<td class="${mappedIndices.has(ci) ? 'col-mapped' : ''}">${row[ci] != null ? row[ci] : ''}</td>`).join('')}
    </tr>`).join('');

    // Footer
    document.getElementById('previewFooter').innerHTML = `
        <span>Menampilkan ${Math.min(displayRows.length, 100)} dari ${rawRows.length} baris</span>
        <span>${rawHeaders.length} kolom</span>
    `;

    document.getElementById('dataPreviewInfo').textContent = `${rawRows.length} baris · ${rawHeaders.length} kolom`;
}



/* --- FILE LIST --- */
function renderFileList() {
    const list = document.getElementById('fileList');
    list.innerHTML = loadedFiles.map((f, i) => `
        <div class="file-item">
            <i class="ti ti-file-check"></i>
            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f.name}</span>
            <span style="color:var(--text-tertiary);">${f.rows} rows</span>
        </div>
    `).join('');
}



/* --- EXPORT --- */
function openExportModal() {
    if (!lastCalcResult) return;
    const r = lastCalcResult;

    document.getElementById('exportPreview').textContent = buildExportText(r);
    document.getElementById('exportModal').classList.add('open');
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('open');
}

function buildExportText(r) {
    return `═══════════════════════════════════════
  PROFIT ANALYZER — Laporan Kalkulasi
═══════════════════════════════════════

📁 File: ${r.fileName}
📅 Tanggal: ${new Date(r.date).toLocaleString('id-ID')}

─── Ringkasan ─────────────────────────
Gross Revenue     : ${rp(r.grossRevenue)}
Total Orders      : ${Math.floor(r.totalOrders).toLocaleString('id-ID')}
Avg Order Value   : ${rp(r.avgOrderValue)}

─── Potongan ──────────────────────────
Ad Spend          : ${rp(r.adSpend)}
Admin Fee (${pct(r.adminFeeRate)})  : ${rp(r.adminFeeDeduction)}
COGS (${rp(r.cogsPerItem)} × ${Math.floor(r.totalOrders).toLocaleString('id-ID')}) : ${rp(r.cogsDeduction)}

─── Hasil ─────────────────────────────
NET PROFIT        : ${rp(r.netProfit)}
MARGIN            : ${pct(r.margin)}
STATUS            : ${r.isPositive ? '✅ UNTUNG' : '❌ RUGI'}

═══════════════════════════════════════
Generated by ProfitAnalyzer v2.0`;
}

function exportText() {
    if (!lastCalcResult) return;
    const text = buildExportText(lastCalcResult);
    downloadFile(text, 'profit-report.txt', 'text/plain');
    closeExportModal();
    showToast('File TXT berhasil di-export', 'success');
}

function exportCSV() {
    if (!lastCalcResult) return;
    const r = lastCalcResult;

    const csvRows = [
        ['Komponen', 'Jumlah (IDR)', '% dari Revenue'],
        ['Gross Revenue', Math.round(r.grossRevenue), '100%'],
        ['Total Orders', Math.floor(r.totalOrders), '-'],
        ['Ad Spend', Math.round(r.adSpend), pct(r.grossRevenue > 0 ? r.adSpend / r.grossRevenue * 100 : 0)],
        ['Admin Fee', Math.round(r.adminFeeDeduction), pct(r.adminFeeRate)],
        ['COGS', Math.round(r.cogsDeduction), pct(r.grossRevenue > 0 ? r.cogsDeduction / r.grossRevenue * 100 : 0)],
        ['Net Profit', Math.round(r.netProfit), pct(r.margin)],
    ];

    const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    downloadFile(csv, 'profit-report.csv', 'text/csv');
    closeExportModal();
    showToast('File CSV berhasil di-export', 'success');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}



/* --- RESET --- */
function resetAll() {
    rawHeaders = [];
    rawRows = [];
    parsedData = null;
    lastCalcResult = null;
    columnMapping = { adSpend: -1, grossRevenue: -1, totalOrders: -1, productName: -1 };
    loadedFiles = [];

    // Reset file input
    document.getElementById('fileInput').value = '';
    document.getElementById('adminFee').value = '';
    document.getElementById('cogsInput').value = '';

    // Reset upload zone
    uploadZone.classList.remove('has-file');
    document.getElementById('fileName').textContent = 'Drop file atau klik di sini';
    document.getElementById('fileHint').textContent = 'Mendukung CSV & Excel (.xlsx, .xls)';
    document.getElementById('fileBadge').style.display = 'none';
    document.getElementById('uploadIcon').className = 'ti ti-file-upload';

    // Reset mapping
    document.getElementById('mappingSection').style.display = 'none';
    document.getElementById('mappingGrid').innerHTML = '';

    // Reset file list
    document.getElementById('fileList').innerHTML = '';

    // Reset data preview
    document.getElementById('dataPreviewEmpty').style.display = 'block';
    document.getElementById('dataPreviewTable').style.display = 'none';
    document.getElementById('dataPreviewInfo').textContent = 'Belum ada data';

    // Reset results
    document.getElementById('resultsArea').classList.remove('visible');
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('exportBtn').style.display = 'none';
    document.getElementById('quickSummary').style.display = 'none';
    
    // Reset Iklan Toko tab
    document.getElementById('iklanResultsArea').style.display = 'none';
    document.getElementById('iklanEmptyState').style.display = 'flex';

    // Switch to analyzer tab
    switchTab('analyzer');

    showToast('Data telah direset', 'success');
}