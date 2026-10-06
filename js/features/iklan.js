/* --- IKLAN TOKO --- */
function updateIklanToko() {
    if (rawRows.length === 0) return;
    
    // We only need adSpend, grossRevenue, and totalOrders to calculate Iklan Toko summary
    const { adSpend: adIdx, grossRevenue: gIdx, totalOrders: oIdx, productName: pIdx } = columnMapping;
    
    if (adIdx === -1 || gIdx === -1 || oIdx === -1) {
        document.getElementById('iklanEmptyState').style.display = 'flex';
        document.getElementById('iklanResultsArea').style.display = 'none';
        return;
    }

    let totalBiaya = 0;
    let totalPendapatan = 0;
    let totalPesanan = 0;

    const productMap = {};

    for (const row of rawRows) {
        const biaya = parseNumber(row[adIdx]);
        const pendapatan = parseNumber(row[gIdx]);
        const pesanan = parseNumber(row[oIdx]);

        totalBiaya += biaya;
        totalPendapatan += pendapatan;
        totalPesanan += pesanan;

        // Grouping by product
        let pName = pIdx !== -1 && row[pIdx] ? String(row[pIdx]) : 'Produk Umum / Campaign Overview';
        
        if (!productMap[pName]) {
            productMap[pName] = { biaya: 0, pendapatan: 0, pesanan: 0 };
        }
        productMap[pName].biaya += biaya;
        productMap[pName].pendapatan += pendapatan;
        productMap[pName].pesanan += pesanan;
    }

    const roi = totalBiaya > 0 ? (totalPendapatan / totalBiaya).toFixed(2) : (totalPendapatan > 0 ? '∞' : '0.00');
    const cpa = totalPesanan > 0 ? (totalBiaya / totalPesanan) : 0;

    // Render Summary
    const summaryGrid = document.getElementById('iklanSummaryGrid');
    summaryGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-card-name"><i class="ti ti-speakerphone"></i> Total Biaya</span>
            </div>
            <div class="stat-card-value">${rp(totalBiaya)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-card-name"><i class="ti ti-shopping-cart"></i> Pesanan SKU</span>
            </div>
            <div class="stat-card-value">${Math.floor(totalPesanan).toLocaleString('id-ID')}</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-card-name"><i class="ti ti-receipt"></i> Biaya per Pesanan</span>
            </div>
            <div class="stat-card-value">${rp(cpa)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-card-name"><i class="ti ti-cash"></i> Pendapatan Kotor</span>
            </div>
            <div class="stat-card-value" style="color: var(--brand-primary);">${rp(totalPendapatan)}</div>
        </div>
        <div class="stat-card accent">
            <div class="stat-card-header">
                <span class="stat-card-name"><i class="ti ti-chart-arrows"></i> ROI</span>
            </div>
            <div class="stat-card-value">${roi}</div>
        </div>
    `;

    // Render Table
    const tbody = document.getElementById('iklanProductBody');
    const sortedProducts = Object.entries(productMap).sort((a, b) => b[1].pendapatan - a[1].pendapatan);

    tbody.innerHTML = sortedProducts.map(([name, data]) => {
        const prodRoi = data.biaya > 0 ? (data.pendapatan / data.biaya).toFixed(2) : (data.pendapatan > 0 ? '∞' : '0.00');
        const roiColor = parseFloat(prodRoi) > 1 || prodRoi === '∞' ? 'var(--success)' : (parseFloat(prodRoi) > 0 ? 'var(--warning)' : 'var(--text-tertiary)');
        return `
            <tr>
                <td style="font-weight: 500; max-width: 300px; white-space: normal; line-height:1.4;">${name}</td>
                <td style="text-align:right;">${rp(data.biaya)}</td>
                <td style="text-align:right;">${Math.floor(data.pesanan).toLocaleString('id-ID')}</td>
                <td style="text-align:right; color: var(--brand-primary); font-weight:600;">${rp(data.pendapatan)}</td>
                <td style="text-align:right; color: ${roiColor}; font-weight:700;">${prodRoi}</td>
            </tr>
        `;
    }).join('');

    document.getElementById('iklanEmptyState').style.display = 'none';
    document.getElementById('iklanResultsArea').style.display = 'flex';
}

// ═══════════════════════════════════════════════════
// HISTORY (localStorage)
// ═══════════════════════════════════════════════════
function getHistory() {
    try {
        return JSON.parse(localStorage.getItem('profitAnalyzerHistory') || '[]');
    } catch { return []; }
}

function saveHistory(result) {
    const history = getHistory();
    history.unshift({
        fileName: result.fileName,
        netProfit: result.netProfit,
        grossRevenue: result.grossRevenue,
        margin: result.margin,
        date: result.date,
        adminFeeRate: result.adminFeeRate,
        cogsPerItem: result.cogsPerItem,
    });
    // Keep last 20
    if (history.length > 20) history.length = 20;
    localStorage.setItem('profitAnalyzerHistory', JSON.stringify(history));
    renderHistory();
}

function clearHistory() {
    if (confirm('Anda yakin ingin menghapus semua riwayat kalkulasi?')) {
        localStorage.removeItem('profitHistory');
        renderHistory();
        showToast('Riwayat berhasil dihapus', 'success');
    }
}

function renderHistory() {
    const history = getHistory();
    const list = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');

    if (history.length === 0) {
        empty.style.display = 'block';
        list.innerHTML = '';
        list.appendChild(empty);
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = history.map((h, i) => {
        const d = new Date(h.date);
        const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const isPos = h.netProfit >= 0;

        return `
            <div class="history-item" onclick="loadHistory(${i})" title="Klik untuk memuat konfigurasi ini">
                <div class="history-item-name">${h.fileName}</div>
                <div class="history-item-info">
                    <span>${dateStr}</span> · <span>${timeStr}</span>
                </div>
                <div class="history-item-profit ${isPos ? 'positive' : 'negative'}">
                    ${rpShort(h.netProfit)} (${pct(h.margin)})
                </div>
            </div>
        `;
    }).join('');
}

function loadHistory(index) {
    const history = getHistory();
    const h = history[index];
    if (!h) return;

    document.getElementById('adminFee').value = h.adminFeeRate;
    document.getElementById('cogsInput').value = h.cogsPerItem;
    showToast(`Konfigurasi dari "${h.fileName}" dimuat. Upload file yang sama lalu klik Kalkulasi.`, 'info', 5000);
}

function clearHistory() {
    localStorage.removeItem('profitAnalyzerHistory');
    renderHistory();
    showToast('Riwayat dihapus', 'success');
}



/* --- IKLAN SIMULATOR LOGIC --- */
function switchIklanTab(tab) {
    const btnSim = document.getElementById('btnIklanSimulator');
    const btnAna = document.getElementById('btnIklanAnalitik');
    
    if (tab === 'simulator') {
        document.getElementById('iklanSimulatorArea').style.display = 'block';
        document.getElementById('iklanAnalitikArea').style.display = 'none';
        
        btnSim.style.background = 'var(--brand-light)';
        btnSim.style.color = 'var(--brand-dark)';
        btnSim.style.borderColor = 'var(--brand-secondary)';
        
        btnAna.style.background = 'transparent';
        btnAna.style.color = 'var(--text-secondary)';
        btnAna.style.borderColor = 'var(--border-light)';
    } else {
        document.getElementById('iklanSimulatorArea').style.display = 'none';
        document.getElementById('iklanAnalitikArea').style.display = 'block';
        
        btnAna.style.background = 'var(--brand-light)';
        btnAna.style.color = 'var(--brand-dark)';
        btnAna.style.borderColor = 'var(--brand-secondary)';
        
        btnSim.style.background = 'transparent';
        btnSim.style.color = 'var(--text-secondary)';
        btnSim.style.borderColor = 'var(--border-light)';
    }
}

function calculateSimulator() {
    let harga = parseFloat(document.getElementById('simHargaJual').value) || 0;
    let cogs = parseFloat(document.getElementById('simModal').value) || 0;
    let adminFee = parseFloat(document.getElementById('simAdminFee').value) || 0;
    let budget = parseFloat(document.getElementById('simBudget').value) || 0;
    let targetRoi = parseFloat(document.getElementById('simTargetRoi').value) || 0;

    let grossProfit = harga - cogs - (harga * (adminFee / 100));
    let grossMargin = harga > 0 ? (grossProfit / harga) * 100 : 0;
    let breakevenRoi = grossMargin > 0 ? (100 / grossMargin) : 0;
    let projectedAdSpend = targetRoi > 0 ? (100 / targetRoi) : 0;
    let netProfit = grossProfit - (harga * (projectedAdSpend / 100));

    let marginEl = document.getElementById('simGrossMargin');
    let breakevenEl = document.getElementById('simBreakevenRoi');
    let netProfitEl = document.getElementById('simNetProfit');
    let alertBox = document.getElementById('simBurnRateAlert');

    marginEl.innerText = grossMargin.toFixed(1) + '%';
    breakevenEl.innerText = breakevenRoi > 0 ? breakevenRoi.toFixed(2) : '0.0';
    netProfitEl.innerText = rp(netProfit);

    // Dynamic Coloring for Net Profit
    netProfitEl.style.color = netProfit > 0 ? 'var(--success)' : (netProfit < 0 ? 'var(--danger)' : 'var(--text-primary)');

    if (harga === 0 || targetRoi === 0) {
        alertBox.style.background = 'var(--bg-tertiary)';
        alertBox.style.color = 'var(--text-secondary)';
        alertBox.style.border = 'none';
        alertBox.innerHTML = 'Silakan isi <strong>Selling Price</strong>, <strong>COGS</strong>, dan <strong>Target ROI</strong> untuk melihat simulasi strategi iklan Anda.';
    } else if (targetRoi < breakevenRoi) {
        alertBox.style.background = '#fef2f2';
        alertBox.style.color = '#dc2626';
        alertBox.style.border = '1px solid #f87171';
        alertBox.innerHTML = '<strong>🔴 CRITICAL (Loss Warning):</strong><br>Target ROI terlalu rendah! Biaya pengeluaran iklan Anda melebihi gross margin. Anda akan RUGI (Burn Rate 100% loss). Tingkatkan Target ROI Anda setidaknya melebihi ' + breakevenRoi.toFixed(2) + '!';
    } else if (targetRoi <= breakevenRoi + 2.0) {
        alertBox.style.background = '#fefce8';
        alertBox.style.color = '#ca8a04';
        alertBox.style.border = '1px solid #facc15';
        alertBox.innerHTML = '<strong>🟡 WARNING (Aggressive Strategy):</strong><br>Budget harian akan cepat habis (Burn Rate 1-3 jam). Risiko tinggi jika konversi melambat. Sangat butuh pantauan ketat!';
    } else {
        alertBox.style.background = '#f0fdf4';
        alertBox.style.color = '#16a34a';
        alertBox.style.border = '1px solid #4ade80';
        alertBox.innerHTML = '<strong>🟢 SAFE (Conservative Strategy):</strong><br>Budget harian akan awet berjam-jam (kemungkinan bertahan 24 jam). Sistem hanya akan melempar iklan ke audiens yang sangat tertarget/pasti beli. Aman ditinggal tidur.';
    }
}