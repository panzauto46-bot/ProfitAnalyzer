/* --- CALCULATE --- */
function calculate() {
    if (rawRows.length === 0) {
        showToast('Silakan import laporan terlebih dahulu', 'error');
        return;
    }

    if (!allColumnsMapped()) {
        showToast('Lengkapi pemetaan kolom terlebih dahulu (Ad Spend, Revenue, Orders)', 'error');
        return;
    }

    const adminFeeStr = document.getElementById('adminFee').value;
    const cogsStr = document.getElementById('cogsInput').value;

    if (!adminFeeStr || !cogsStr) {
        showToast('Mohon lengkapi data Admin Fee dan COGS', 'error');
        return;
    }

    const adminFeeRate = parseFloat(adminFeeStr);
    const cogsPerItem = parseFloat(cogsStr);

    if (isNaN(adminFeeRate) || isNaN(cogsPerItem)) {
        showToast('Masukkan angka yang valid', 'error');
        return;
    }

    if (adminFeeRate < 0 || adminFeeRate > 100) {
        showToast('Admin Fee harus antara 0 - 100%', 'error');
        return;
    }

    // Aggregate data from mapped columns
    let adSpend = 0, grossRevenue = 0, totalOrders = 0;
    const { adSpend: adIdx, grossRevenue: gIdx, totalOrders: oIdx } = columnMapping;

    for (const row of rawRows) {
        adSpend += parseNumber(row[adIdx]);
        grossRevenue += parseNumber(row[gIdx]);
        totalOrders += parseNumber(row[oIdx]);
    }

    // Calculation (per PRD formula)
    const adminFeeDeduction = grossRevenue * (adminFeeRate / 100);
    const cogsDeduction = totalOrders * cogsPerItem;
    const netProfit = grossRevenue - adSpend - adminFeeDeduction - cogsDeduction;
    const isPositive = netProfit >= 0;
    const margin = grossRevenue > 0 ? (netProfit / grossRevenue * 100) : 0;
    const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    lastCalcResult = {
        grossRevenue, adSpend, totalOrders, adminFeeRate,
        adminFeeDeduction, cogsPerItem, cogsDeduction,
        netProfit, margin, isPositive, avgOrderValue,
        fileName: loadedFiles[0]?.name || 'Unknown',
        date: new Date().toISOString()
    };

    // ─── Update Hero Card ───
    const heroValue = document.getElementById('heroValue');
    heroValue.textContent = rp(netProfit);
    heroValue.className = 'hero-value' + (isPositive ? '' : ' negative');

    const marginChip = document.getElementById('marginChip');
    marginChip.innerHTML = `<i class="ti ${isPositive ? 'ti-trending-up' : 'ti-trending-down'}"></i> <span>${pct(margin)} margin</span>`;
    marginChip.className = 'margin-chip' + (isPositive ? '' : ' negative');

    document.getElementById('heroStatus').innerHTML = isPositive
        ? '<i class="ti ti-mood-smile"></i> Bisnis menguntungkan — ROAS positif'
        : '<i class="ti ti-mood-sad"></i> Bisnis merugi — perlu evaluasi strategi';

    // ─── Update Stats ───
    document.getElementById('statGross').textContent = rp(grossRevenue);
    document.getElementById('statOrders').textContent = Math.floor(totalOrders).toLocaleString('id-ID');
    document.getElementById('statOrdersChip').textContent = rp(avgOrderValue) + '/order';
    document.getElementById('statAdSpend').textContent = rp(adSpend);
    document.getElementById('statFee').textContent = rp(adminFeeDeduction);
    document.getElementById('statCogs').textContent = rp(cogsDeduction);

    if (grossRevenue > 0) {
        document.getElementById('statAdPct').textContent = pct(adSpend / grossRevenue * 100);
        document.getElementById('statFeePct').textContent = pct(adminFeeRate);
        document.getElementById('statCogsPct').textContent = pct(cogsDeduction / grossRevenue * 100);
    } else {
        document.getElementById('statAdPct').textContent = '0%';
        document.getElementById('statFeePct').textContent = '0%';
        document.getElementById('statCogsPct').textContent = '0%';
    }

    // ─── Breakdown Bar ───
    const parts = [
        { val: Math.max(netProfit, 0), color: '#14B8A6', label: 'Net Profit' },
        { val: cogsDeduction, color: '#0F766E', label: 'COGS' },
        { val: adSpend, color: '#5EEAD4', label: 'Ad Spend' },
        { val: adminFeeDeduction, color: '#99F6E4', label: 'Admin Fee' },
    ];
    const sum = parts.reduce((s, p) => s + p.val, 0) || 1;
    document.getElementById('breakdownBar').innerHTML = parts
        .map(p => {
            const w = (p.val / sum * 100);
            return w > 0 ? `<div style="width:${w}%;background:${p.color};" data-tooltip="${p.label}: ${rp(p.val)} (${pct(p.val / (grossRevenue || 1) * 100)})"></div>` : '';
        }).join('');

    // ─── Deduction Table ───
    const tbody = document.getElementById('deductionTableBody');
    const deductions = [
        { name: 'Gross Revenue', val: grossRevenue, pctVal: 100, type: 'positive' },
        { name: 'Ad Spend', val: -adSpend, pctVal: grossRevenue > 0 ? adSpend / grossRevenue * 100 : 0, type: 'negative' },
        { name: `Admin Fee (${pct(adminFeeRate)})`, val: -adminFeeDeduction, pctVal: grossRevenue > 0 ? adminFeeDeduction / grossRevenue * 100 : 0, type: 'negative' },
        { name: `COGS (${rp(cogsPerItem)} × ${Math.floor(totalOrders).toLocaleString('id-ID')})`, val: -cogsDeduction, pctVal: grossRevenue > 0 ? cogsDeduction / grossRevenue * 100 : 0, type: 'negative' },
        { name: 'Net Profit', val: netProfit, pctVal: Math.abs(margin), type: isPositive ? 'positive' : 'negative', bold: true },
    ];

    tbody.innerHTML = deductions.map(d => `
        <tr style="${d.bold ? 'font-weight:700; background: var(--bg-primary);' : ''}">
            <td>${d.name}</td>
            <td style="text-align:right; color: ${d.type === 'negative' ? 'var(--danger)' : 'var(--success)'};">${d.val >= 0 ? rp(d.val) : '-' + rp(Math.abs(d.val))}</td>
            <td style="text-align:right; color: var(--text-secondary);">${pct(d.pctVal)}</td>
        </tr>
    `).join('');

    // ─── Quick Summary Sidebar ───
    document.getElementById('quickSummary').style.display = 'block';
    document.getElementById('qRevenue').textContent = rpShort(grossRevenue);
    document.getElementById('qProfit').textContent = rpShort(netProfit);
    document.getElementById('qProfit').style.color = isPositive ? 'var(--success)' : 'var(--danger)';
    document.getElementById('qMargin').textContent = pct(margin);
    document.getElementById('qMargin').style.color = isPositive ? 'var(--success)' : 'var(--danger)';

    // ─── Show Results ───
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('resultsArea').classList.add('visible');
    document.getElementById('exportBtn').style.display = 'flex';

    // ─── Save to History ───
    saveHistory(lastCalcResult);

    showToast('Kalkulasi berhasil!', 'success');
}