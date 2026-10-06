function updatePacking() {
    if (!rawRows || rawRows.length === 0) return;

    // Detect if this is an "Order to Ship" file by checking specific columns
    // Common columns in Shopee To Ship file:
    // "No. Pesanan", "No. Resi", "Opsi Pengiriman", "Nama Produk"
    
    // First, find header index map
    const headers = rawHeaders || rawRows[0] || [];
    const hMap = {};
    for (let i = 0; i < headers.length; i++) {
        const val = String(headers[i] || '').trim().toLowerCase();
        hMap[val] = i;
    }

    // Try to find required columns
    const idxNoPesanan = hMap['no. pesanan'];
    const idxResi = hMap['no. resi'];
    const idxKurir = hMap['opsi pengiriman'] || hMap['jasa kirim'];
    const idxProduk = hMap['nama produk'];
    const idxVariasi = hMap['nama variasi'];
    const idxJumlah = hMap['jumlah'];
    const idxCatatan = hMap['catatan dari pembeli'] || hMap['catatan pembeli'];

    const isEmptyState = document.getElementById('packingEmptyState');
    const isResultsArea = document.getElementById('packingResultsArea');
    const warningState = document.getElementById('packingWarningState');

    if (idxNoPesanan === undefined || idxProduk === undefined || idxJumlah === undefined) {
        // Not a packing file
        if (isEmptyState) isEmptyState.style.display = 'none';
        if (isResultsArea) isResultsArea.style.display = 'none';
        if (warningState) {
            warningState.style.display = 'flex';
            document.getElementById('packingWarningText').innerText = "File yang diupload bukan file Pesanan (Order to Ship). Silakan upload file dengan format Pesanan Perlu Dikirim.";
        }
        return;
    }

    // It is a packing file!
    if (warningState) warningState.style.display = 'none';
    if (isEmptyState) isEmptyState.style.display = 'none';
    if (isResultsArea) isResultsArea.style.display = 'block';

    let totalPesanan = 0;
    let totalBarang = 0;
    let kurirMap = {}; // for filter options

    const tbody = document.getElementById('packingTableBody');
    let rowsHtml = '';
    
    // Keep track of unique orders to count properly
    const uniqueOrders = new Set();

        for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const noPesanan = String(row[idxNoPesanan] || '').trim();
        if (!noPesanan) continue;

        uniqueOrders.add(noPesanan);

        const resi = idxResi !== undefined ? String(row[idxResi] || '').trim() : '-';
        const kurir = idxKurir !== undefined ? String(row[idxKurir] || '').trim() : '-';
        const produk = String(row[idxProduk] || '').trim();
        const variasi = idxVariasi !== undefined ? String(row[idxVariasi] || '').trim() : '';
        const jumlah = parseFloat(row[idxJumlah] || 0) || 0;
        const catatan = idxCatatan !== undefined ? String(row[idxCatatan] || '').trim() : '';

        totalBarang += jumlah;
        
        if (kurir && kurir !== '-') {
            kurirMap[kurir] = true;
        }

        let kurirClean = kurir.replace('Reguler (Cashless)-', '').trim();
        let variantBadge = variasi ? `<span style="display:inline-flex; align-items:center; gap:4px; margin-top:8px; padding: 4px 10px; background: #f0fdf4; color: #166534; font-size:12px; border-radius:var(--radius-sm); font-weight:600; border: 1px solid #bbf7d0;"><i class="ti ti-tag"></i> ${variasi}</span>` : '';
        let catatanHtml = catatan ? `<div style="margin-top:10px; font-size:13px; color: #9a3412; background:#fff7ed; padding:10px 14px; border-radius:var(--radius-md); border: 1px solid #ffedd5;"><i class="ti ti-message-2" style="margin-right:4px;"></i> <b>Catatan:</b> ${catatan}</div>` : '';

        rowsHtml += `
            <tr data-kurir="${kurir}" style="background: transparent; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <td style="padding: 16px 20px; vertical-align: top; border-bottom: 1px solid var(--border-light);">
                    <div style="font-weight:700; color:var(--text-primary); font-size:14px; letter-spacing:0.3px;">${noPesanan}</div>
                    <div style="color:var(--text-tertiary); font-size:12px; margin-top:6px; font-family: monospace;"><i class="ti ti-barcode"></i> Resi: ${resi}</div>
                </td>
                <td style="padding: 16px 20px; vertical-align: top; border-bottom: 1px solid var(--border-light);">
                    <span style="display:inline-flex; align-items:center; background:#f1f5f9; color:#334155; padding:6px 12px; border-radius:var(--radius-full); font-size:12px; font-weight:600; border: 1px solid #e2e8f0; line-height:1.2; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        ${kurirClean}
                    </span>
                </td>
                <td style="max-width:350px; white-space:normal; line-height:1.5; padding: 16px 20px; vertical-align: top; border-bottom: 1px solid var(--border-light);">
                    <div style="font-size:14px; color:var(--text-primary); font-weight:500;">${produk}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${variantBadge}
                    </div>
                    ${catatanHtml}
                </td>
                <td style="text-align:center; padding: 16px 20px; vertical-align: top; border-bottom: 1px solid var(--border-light);">
                    <div style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; background:var(--brand-primary); border-radius:8px; font-weight:700; color:#fff; font-size:16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);">
                        ${jumlah}
                    </div>
                </td>
            </tr>
        `;
    }

    totalPesanan = uniqueOrders.size;

    // Update Stats
    document.getElementById('packingStatPesanan').innerText = totalPesanan.toLocaleString('id-ID');
    document.getElementById('packingStatBarang').innerText = totalBarang.toLocaleString('id-ID');

    // Update Filter Options
    const filterSelect = document.getElementById('packingKurirFilter');
    if (filterSelect) {
        let options = '<option value="all">Semua Ekspedisi</option>';
        Object.keys(kurirMap).sort().forEach(k => {
            options += `<option value="${k}">${k}</option>`;
        });
        filterSelect.innerHTML = options;
    }

    if (tbody) tbody.innerHTML = rowsHtml;
}

function filterPackingByKurir() {
    const selected = document.getElementById('packingKurirFilter').value;
    const tbody = document.getElementById('packingTableBody');
    if (!tbody) return;

    const trs = tbody.querySelectorAll('tr');
    trs.forEach(tr => {
        if (selected === 'all' || tr.getAttribute('data-kurir') === selected) {
            tr.style.display = '';
        } else {
            tr.style.display = 'none';
        }
    });
}
