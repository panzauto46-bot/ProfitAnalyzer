function updatePacking() {
    if (!window.rawRows || window.rawRows.length === 0) return;

    // Detect if this is an "Order to Ship" file by checking specific columns
    // Common columns in Shopee To Ship file:
    // "No. Pesanan", "No. Resi", "Opsi Pengiriman", "Nama Produk"
    
    // First, find header index map
    const headers = window.rawRows[0] || [];
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

    for (let i = 1; i < window.rawRows.length; i++) {
        const row = window.rawRows[i];
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

        let variantBadge = variasi ? `<span style="display:inline-block; margin-top:4px; padding: 2px 6px; background:var(--brand-light); color:var(--brand-primary); font-size:11px; border-radius:4px; font-weight:600;">${variasi}</span>` : '';
        let catatanHtml = catatan ? `<div style="margin-top:6px; font-size:11px; color:var(--warning); background:#fffbeb; padding:4px 8px; border-radius:4px; border-left:2px solid var(--warning);"><i class="ti ti-message-2"></i> ${catatan}</div>` : '';

        rowsHtml += `
            <tr data-kurir="${kurir}">
                <td>
                    <div style="font-weight:600; color:var(--text-primary); font-size:13px;">${noPesanan}</div>
                    <div style="color:var(--text-tertiary); font-size:11px; margin-top:2px;">Resi: ${resi}</div>
                </td>
                <td>
                    <span style="font-weight:500; color:var(--text-secondary); font-size:12px;">${kurir}</span>
                </td>
                <td style="max-width:300px; white-space:normal; line-height:1.4;">
                    <div style="font-size:13px; color:var(--text-secondary);">${produk}</div>
                    ${variantBadge}
                    ${catatanHtml}
                </td>
                <td style="text-align:center;">
                    <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:var(--bg-secondary); border-radius:50%; font-weight:700; color:var(--text-primary); font-size:14px;">${jumlah}</span>
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
