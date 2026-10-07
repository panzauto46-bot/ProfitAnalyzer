
window.ordersData = [];
window.ordersStats = {
    total: 0,
    perluDikirim: 0,
    dikirim: 0,
    selesai: 0,
    batal: 0,
    qty: 0,
    kurir: {}
};

function updatePacking() {
    if (!rawRows || rawRows.length === 0) return;

    const headers = rawHeaders || rawRows[0] || [];
    const hMap = {};
    for (let i = 0; i < headers.length;i++) {
        const val = String(headers[i] || '').trim().toLowerCase();
        hMap[val] = i;
    }

    const idxNoPesanan = hMap['no. pesanan'];
    const idxResi = hMap['no. resi'];
    const idxKurir = hMap['opsi pengiriman'] || hMap['jasa kirim'];
    const idxProduk = hMap['nama produk'];
    const idxVariasi = hMap['nama variasi'];
    const idxJumlah = hMap['jumlah'];
    const idxCatatan = hMap['catatan dari pembeli'] || hMap['catatan pembeli'];
    const idxStatus = hMap['status pesanan'];
    const idxBatalText = hMap['status batal/ pengembalian'] || hMap['alasan pembatalan'] || hMap['status batal'];

    const isEmptyState = document.getElementById('packingEmptyState');
    const isResultsArea = document.getElementById('packingResultsArea');
    const warningState = document.getElementById('packingWarningState');

    if (idxNoPesanan === undefined || idxProduk === undefined || idxJumlah === undefined) {
        if (isEmptyState) isEmptyState.style.display = 'none';
        if (isResultsArea) isResultsArea.style.display = 'none';
        if (warningState) {
            warningState.style.display = 'flex';
            document.getElementById('packingWarningText').innerText = "File yang diupload bukan file Pesanan. Silakan pastikan file mengandung No. Pesanan, Nama Produk, dan Jumlah.";
        }
        return;
    }

    if (warningState) warningState.style.display = 'none';
    if (isEmptyState) isEmptyState.style.display = 'none';
    if (isResultsArea) isResultsArea.style.display = 'block';

    const ordersMap = {};
    window.ordersStats = { total: 0, perluDikirim: 0, dikirim: 0, selesai: 0, batal: 0, qty: 0, kurir: {} };

    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const noPesanan = String(row[idxNoPesanan] || '').trim();
        if (!noPesanan) continue;

        if (!ordersMap[noPesanan]) {
            ordersMap[noPesanan] = {
                noPesanan,
                resi: idxResi !== undefined ? String(row[idxResi] || '').trim() : '-',
                kurir: idxKurir !== undefined ? String(row[idxKurir] || '').trim() : '-',
                status: idxStatus !== undefined ? String(row[idxStatus] || '').trim() : 'Semua', // fallback
                batalText: idxBatalText !== undefined ? String(row[idxBatalText] || '').trim() : '',
                items: []
            };
        }

        const kurir = ordersMap[noPesanan].kurir;
        if (kurir && kurir !== '-') {
            let kClean = kurir.replace('Reguler (Cashless)-', '').trim();
            window.ordersStats.kurir[kClean] = true;
            if(!window.ordersStats.kurirCount) window.ordersStats.kurirCount = {};
            window.ordersStats.kurirCount[kClean] = (window.ordersStats.kurirCount[kClean] || 0) + 1;
            ordersMap[noPesanan].kurir = kClean; 
        }

        const jumlah = parseFloat(row[idxJumlah] || 0) || 0;
        window.ordersStats.qty += jumlah;

        ordersMap[noPesanan].items.push({
            produk: String(row[idxProduk] || '').trim(),
            variasi: idxVariasi !== undefined ? String(row[idxVariasi] || '').trim() : '',
            jumlah: jumlah,
            catatan: idxCatatan !== undefined ? String(row[idxCatatan] || '').trim() : ''
        });
    }

    window.ordersData = Object.values(ordersMap);
    
    // Calculate stats
    window.ordersData.forEach(o => {
        window.ordersStats.total++;
        let st = o.status.toLowerCase();
        if (st.includes('perlu dikirim')) window.ordersStats.perluDikirim++;
        else if (st.includes('dikirim') || st.includes('sedang dikirim')) window.ordersStats.dikirim++;
        else if (st.includes('selesai')) window.ordersStats.selesai++;
        else if (st.includes('batal') || st.includes('pengembalian') || st.includes('dikembalikan')) window.ordersStats.batal++;
    });

    // Update filter kurir dropdown
    const kurirSelect = document.getElementById('packingKurirFilter');
    if (kurirSelect) {
        let htmlKurir = '<option value="all">Semua Ekspedisi</option>';
        Object.keys(window.ordersStats.kurir).forEach(k => {
            htmlKurir += `<option value="${k}">${k}</option>`;
        });
        kurirSelect.innerHTML = htmlKurir;
    }

    renderPackingList();
}

function renderPackingList() {
    const container = document.getElementById('packingListContainer');
    if (!container) return;

    let tab = window.currentOrderTab || 'Semua';
    let filteredOrders = window.ordersData;

    // Filter by Tab
    if (tab === 'Perlu Dikirim') {
        filteredOrders = window.ordersData.filter(o => o.status.toLowerCase().includes('perlu dikirim'));
    } else if (tab === 'Dikirim') {
        filteredOrders = window.ordersData.filter(o => {
            let st = o.status.toLowerCase();
            return (st.includes('dikirim') || st.includes('sedang dikirim')) && !st.includes('perlu dikirim');
        });
    } else if (tab === 'Dibatalkan') {
        filteredOrders = window.ordersData.filter(o => o.status.toLowerCase().includes('batal') || o.status.toLowerCase().includes('pengembalian') || o.status.toLowerCase().includes('dikembalikan'));
    } else if (tab === 'Selesai') {
        filteredOrders = window.ordersData.filter(o => o.status.toLowerCase().includes('selesai'));
    } else if (tab === 'Dashboard') {
        if (typeof renderDashboard === 'function') {
            renderDashboard(container);
        } else {
            console.error('renderDashboard is not defined. Make sure dashboard.js is loaded.');
        }
        return;
    }

    const countPerlu = document.getElementById('count-perlu');
    const countDikirim = document.getElementById('count-dikirim');
    const countSelesai = document.getElementById('count-selesai');
    const countDibatalkan = document.getElementById('count-dibatalkan');
    
    if (countPerlu) countPerlu.innerText = window.ordersStats.perluDikirim;
    if (countDikirim) countDikirim.innerText = window.ordersStats.dikirim;
    if (countSelesai) countSelesai.innerText = window.ordersStats.selesai;
    if (countDibatalkan) countDibatalkan.innerText = window.ordersStats.batal;

    // Update Dashboard global stats
    const totalPesananEl = document.getElementById('packingStatPesanan');
    const totalBarangEl = document.getElementById('packingStatBarang');
    const totalAvgEl = document.getElementById('packingStatAvg');
    if (totalPesananEl) totalPesananEl.innerText = filteredOrders.length.toLocaleString('id-ID');
    // Calculate qty for filtered
    let filteredQty = 0;
    filteredOrders.forEach(o => {
        o.items.forEach(i => { filteredQty += i.jumlah; });
    });
    if (totalBarangEl) totalBarangEl.innerText = filteredQty.toLocaleString('id-ID');
      if (totalAvgEl) totalAvgEl.innerText = filteredOrders.length > 0 ? (filteredQty / filteredOrders.length).toFixed(2).replace('.', ',') : '0,00';

    let html = '';
    
    filteredOrders.forEach(order => {
        let itemsHtml = '';
        order.items.forEach((item, idx) => {
            const isLast = idx === order.items.length - 1;
            const variantBadge = item.variasi ? `<span style="display:inline-flex; align-items:center; gap:4px; margin-top:6px; padding: 4px 10px; background: #f1f5f9; color: #475569; font-size:11px; border-radius:4px; font-weight:600;"><i class="ti ti-tag"></i> ${item.variasi}</span>` : '';
            const batalBadge = order.batalText && order.batalText !== '-' ? `<div style="margin-top:8px; font-size:12px; color: #b91c1c; background:#fef2f2; padding:6px 10px; border-radius:6px; border: 1px solid #fca5a5; font-weight:600;"><i class="ti ti-alert-circle" style="margin-right:4px;"></i> <b>Info Retur/Batal:</b> ${order.batalText}</div>` : '';
            const catatanHtml = item.catatan ? `<div style="margin-top:8px; font-size:12px; color: #9a3412; background:#fff7ed; padding:8px 12px; border-radius:6px; border: 1px solid #ffedd5;"><i class="ti ti-message-2" style="margin-right:4px;"></i> <b>Catatan:</b> ${item.catatan}</div>` : '';
            
            itemsHtml += `
                <div style="display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: ${isLast ? '0' : '12px'}; margin-bottom: ${isLast ? '0' : '12px'}; border-bottom: ${isLast ? 'none' : '1px dashed #e2e8f0'};">
                    <div style="flex: 1; padding-right: 20px;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 13px; line-height: 1.4;">${item.produk}</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">${variantBadge}</div>
                        ${catatanHtml}
                        ${batalBadge}
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="font-size: 14px; font-weight: 700; color: var(--brand-primary); background: #ccfbf1; padding: 4px 12px; border-radius: 6px; border: 1px solid #99f6e4;">x${item.jumlah}</div>
                    </div>
                </div>
            `;
        });

        // Determine Status Badge Color
        let stBadgeColor = 'background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;'; // default grey
        let stText = order.status.toLowerCase();
        if (stText.includes('perlu dikirim')) {
            stBadgeColor = 'background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5;'; // orange
        } else if (stText.includes('dikirim') || stText.includes('sedang dikirim')) {
            stBadgeColor = 'background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe;'; // blue
        } else if (stText.includes('selesai')) {
            stBadgeColor = 'background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7;'; // green
        } else if (stText.includes('batal')) {
            stBadgeColor = 'background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2;'; // red
        }

        const isSelesai = localStorage.getItem('order_selesai_' + order.noPesanan) === 'true';
        const checkboxState = isSelesai ? 'checked' : '';
        const bgRow = isSelesai ? '#f8fafc' : '#ffffff';
        const opRow = isSelesai ? '0.85' : '1';

        html += `
            <div class="packing-order-card" id="card_${order.noPesanan}" style="background: ${bgRow}; opacity: ${opRow}; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: all 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <span style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${order.noPesanan}</span>
                        <span style="font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 12px; ${stBadgeColor}">${order.status || 'Baru'}</span>
                        <span style="font-size: 11px; font-weight: 600; color: #334155; background: #f1f5f9; padding: 3px 8px; border-radius: 12px; display:flex; align-items:center; gap:4px;"><i class="ti ti-truck-delivery"></i> ${order.kurir}</span>
                        <span style="font-size: 11px; color: #64748b; font-family: monospace; letter-spacing: 0.5px;">Resi: ${order.resi}</span>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size: 12px; font-weight:600; color: #475569; background: white; padding: 6px 12px; border-radius: 20px; border: 1px solid #cbd5e1; transition:all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" class="packing-checkbox-label">
                            <input type="checkbox" onchange="togglePackedCheckbox(this)" ${checkboxState} style="width: 14px; height: 14px; accent-color: var(--brand-primary); cursor:pointer;">
                            <span class="lbl-text">${isSelesai ? 'SUDAH PACKING' : 'Belum Packing'}</span>
                        </label>
                    </div>
                </div>
                
                <div>
                    ${itemsHtml}
                </div>
            </div>
        `;
    });

    if (filteredOrders.length === 0) {
        html = `<div style="text-align:center; padding: 40px; color: var(--text-secondary);">Tidak ada pesanan untuk status: ${tab}</div>`;
    }

    container.innerHTML = html;

    // Trigger UI updates for checkboxes
    filteredOrders.forEach(order => {
        const isSelesai = localStorage.getItem('order_selesai_' + order.noPesanan) === 'true';
        // No updateCardUI needed if it doesn't exist
    });
}

function filterPackingByKurir() {
    renderPackingList();
}

function togglePackedCheckbox(checkbox) {
    const label = checkbox.closest('label');
    const textSpan = label.querySelector('.status-text');
    const card = checkbox.closest('.order-card');
    
    if (checkbox.checked) {
        label.style.background = '#ecfdf5';
        label.style.borderColor = '#6ee7b7';
        textSpan.style.color = '#059669';
        textSpan.innerText = 'Selesai Packing';
        if(card) {
            card.style.opacity = '0.6';
            card.style.transform = 'scale(0.99)';
        }
    } else {
        label.style.background = '#fff';
        label.style.borderColor = '#cbd5e1';
        textSpan.style.color = '#64748b';
        textSpan.innerText = 'Belum Packing';
        if(card) {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }
    }
}


// --- TAB NAVIGATION UI ---
window.currentOrderTab = 'Semua';

function switchOrderTab(tabName) {
    window.currentOrderTab = tabName;
    
    // Handle Empty State UI specifically for Dashboard
    const uploadBtn = document.querySelector('#packingEmptyState button');
    const emptyTitle = document.querySelector('#packingEmptyState h3');
    const emptyDesc = document.querySelector('#packingEmptyState p');
    
    if (tabName === 'Dashboard') {
        if (uploadBtn) uploadBtn.style.display = 'none';
        if (emptyTitle) emptyTitle.innerText = 'Dashboard Kosong';
        if (emptyDesc) emptyDesc.innerText = 'Silakan ke tab "Semua" atau "Perlu Dikirim" untuk mengimpor file pesanan terlebih dahulu.';
    } else {
        if (uploadBtn) uploadBtn.style.display = 'flex';
        if (emptyTitle) emptyTitle.innerText = 'Sistem Manajemen Pesanan Kosong';
        if (emptyDesc) emptyDesc.innerText = 'Upload file "Pesanan Perlu Dikirim", "Dikirim", "Selesai", atau "Semua" untuk melacak status pesanan.';
    }

    // Update Title if Results Area is visible
    const titleEl = document.getElementById('orderListTitle');
    if (titleEl) {
        titleEl.innerHTML = '<i class="ti ti-list"></i> Daftar Pesanan: ' + tabName;
    }
    
    // Reset all tabs UI
    const tabs = ['Dashboard', 'Semua', 'Perlu Dikirim', 'Dikirim', 'Selesai', 'Dibatalkan'];
    tabs.forEach(t => {
        const elId = 'tab-' + t.replace(' ', '-');
        const el = document.getElementById(elId);
        if(el) {
            el.style.color = 'var(--text-secondary)';
            el.style.borderBottom = '3px solid transparent';
            el.classList.remove('active');
        }
    });
    
    // Set Active tab UI
    const activeEl = document.getElementById('tab-' + tabName.replace(' ', '-'));
    if(activeEl) {
        activeEl.style.color = 'var(--brand-primary)';
        activeEl.style.borderBottom = '3px solid var(--brand-primary)';
        activeEl.classList.add('active');
    }
    if (typeof renderPackingList === 'function') renderPackingList();
}



