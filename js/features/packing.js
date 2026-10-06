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

    const isEmptyState = document.getElementById('packingEmptyState');
    const isResultsArea = document.getElementById('packingResultsArea');
    const warningState = document.getElementById('packingWarningState');

    if (idxNoPesanan === undefined || idxProduk === undefined || idxJumlah === undefined) {
        if (isEmptyState) isEmptyState.style.display = 'none';
        if (isResultsArea) isResultsArea.style.display = 'none';
        if (warningState) {
            warningState.style.display = 'flex';
            document.getElementById('packingWarningText').innerText = "File yang diupload bukan file Pesanan (Order to Ship). Silakan upload file dengan format Pesanan Perlu Dikirim.";
        }
        return;
    }

    if (warningState) warningState.style.display = 'none';
    if (isEmptyState) isEmptyState.style.display = 'none';
    if (isResultsArea) isResultsArea.style.display = 'block';

    const ordersMap = {};
    let totalBarang = 0;
    let kurirMap = {};

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
                status: idxStatus !== undefined ? String(row[idxStatus] || '').trim() : '',
                items: []
            };
        }

        const kurir = ordersMap[noPesanan].kurir;
        if (kurir && kurir !== '-') {
            let kClean = kurir.replace('Reguler (Cashless)-', '').trim();
            kurirMap[kClean] = true;
            ordersMap[noPesanan].kurir = kClean; 
        }

        const jumlah = parseFloat(row[idxJumlah] || 0) || 0;
        totalBarang += jumlah;

        ordersMap[noPesanan].items.push({
            produk: String(row[idxProduk] || '').trim(),
            variasi: idxVariasi !== undefined ? String(row[idxVariasi] || '').trim() : '',
            jumlah: jumlah,
            catatan: idxCatatan !== undefined ? String(row[idxCatatan] || '').trim() : ''
        });
    }

    const totalPesanan = Object.keys(ordersMap).length;
    const container = document.getElementById('packingListContainer');
    if (!container) return; 

    let html = '';
    
    Object.values(ordersMap).forEach(order => {
        let itemsHtml = '';
        order.items.forEach((item, idx) => {
            const isLast = idx === order.items.length - 1;
            const variantBadge = item.variasi ? `<span style="display:inline-flex; align-items:center; gap:4px; margin-top:6px; padding: 4px 10px; background: #f1f5f9; color: #475569; font-size:11px; border-radius:4px; font-weight:600;"><i class="ti ti-tag"></i> ${item.variasi}</span>` : '';
            const catatanHtml = item.catatan ? `<div style="margin-top:8px; font-size:12px; color: #9a3412; background:#fff7ed; padding:8px 12px; border-radius:6px; border: 1px solid #ffedd5;"><i class="ti ti-message-2" style="margin-right:4px;"></i> <b>Catatan:</b> ${item.catatan}</div>` : '';
            
            itemsHtml += `
                <div style="display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: ${isLast ? '0' : '12px'}; margin-bottom: ${isLast ? '0' : '12px'}; border-bottom: ${isLast ? 'none' : '1px dashed #e2e8f0'};">
                    <div style="flex: 1; padding-right: 20px;">
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 13px; line-height: 1.4;">${item.produk}</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">${variantBadge}</div>
                        ${catatanHtml}
                    </div>
                    <div style="display: flex; align-items: center;">
                        <div style="font-size: 14px; font-weight: 700; color: var(--brand-primary); background: #ccfbf1; padding: 4px 12px; border-radius: 6px; border: 1px solid #99f6e4;">x${item.jumlah}</div>
                    </div>
                </div>
            `;
        });

        const statusBadge = order.status ? `<span style="background: #fef3c7; color: #b45309; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">${order.status}</span>` : '';

        html += `
            <div class="order-card" data-kurir="${order.kurir}" style="border: 1px solid var(--border-light); border-radius: var(--radius-lg); background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden; transition: all 0.2s;">
                <div style="background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <span style="font-weight: 800; color: var(--text-primary); font-size: 14px;">${order.noPesanan}</span>
                        ${statusBadge}
                        <span style="background: #e2e8f0; color: #334155; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;"><i class="ti ti-truck"></i> ${order.kurir}</span>
                        <span style="color: #64748b; font-size: 12px; font-family: monospace; font-weight: 500;"><i class="ti ti-barcode"></i> Resi: ${order.resi}</span>
                    </div>
                    <div>
                        <label style="cursor:pointer; display:inline-flex; align-items:center; gap:8px; padding: 6px 12px; background: #fff; border: 1px solid #cbd5e1; border-radius: 20px; transition: all 0.2s;">
                            <input type="checkbox" onchange="togglePackedCheckbox(this)" style="width:16px; height:16px; accent-color: var(--brand-primary); cursor:pointer;">
                            <span class="status-text" style="font-weight:700; color:#64748b; font-size:12px;">Belum Packing</span>
                        </label>
                    </div>
                </div>
                <div style="padding: 16px;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    if (document.getElementById('packingStatPesanan')) {
        document.getElementById('packingStatPesanan').innerText = totalPesanan.toLocaleString('id-ID');
    }
    if (document.getElementById('packingStatBarang')) {
        document.getElementById('packingStatBarang').innerText = totalBarang.toLocaleString('id-ID');
    }

    const filterSelect = document.getElementById('packingKurirFilter');
    if (filterSelect) {
        let options = '<option value="all">Semua Ekspedisi</option>';
        Object.keys(kurirMap).sort().forEach(k => {
            options += `<option value="${k}">${k}</option>`;
        });
        filterSelect.innerHTML = options;
    }
}

function filterPackingByKurir() {
    const val = document.getElementById('packingKurirFilter').value;
    const cards = document.querySelectorAll('.order-card');
    cards.forEach(card => {
        if (val === 'all') {
            card.style.display = 'block';
        } else {
            const rowKurir = card.getAttribute('data-kurir') || '';
            card.style.display = (rowKurir === val) ? 'block' : 'none';
        }
    });
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
    
    // Update Title
    document.getElementById('orderListTitle').innerHTML = '<i class="ti ti-list"></i> Daftar Pesanan: ' + tabName;
    
    // Reset all tabs UI
    const tabs = ['Dashboard', 'Semua', 'Perlu Dikirim', 'Dikirim', 'Selesai'];
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
    
    // For now, if we already have data loaded, just re-render the table with filtering (to be implemented)
    // filterPackingTable();
}

