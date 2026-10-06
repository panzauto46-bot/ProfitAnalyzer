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
    // Keep track of unique orders to count properly
        const idxUsername = hMap["username (pembeli)"] || hMap["username"];
    const idxTotalPay = hMap["total pembayaran"];
    const idxPaymentMethod = hMap["metode pembayaran"];
    const idxStatus = hMap["status pesanan"];

    let cardsHtml = "";
    const ordersMap = {};
    const uniqueOrders = new Set();

    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const noPesanan = String(row[idxNoPesanan] || "").trim();
        if (!noPesanan) continue;

        uniqueOrders.add(noPesanan);
        
        const jumlah = parseFloat(row[idxJumlah] || 0) || 0;
        totalBarang += jumlah;

        if (!ordersMap[noPesanan]) {
            const kurir = idxKurir !== undefined ? String(row[idxKurir] || "").trim() : "-";
            if (kurir && kurir !== "-") kurirMap[kurir] = true;

            ordersMap[noPesanan] = {
                noPesanan: noPesanan,
                username: idxUsername !== undefined ? String(row[idxUsername] || "").trim() : "Pembeli",
                kurir: kurir,
                resi: idxResi !== undefined ? String(row[idxResi] || "").trim() : "-",
                totalPay: idxTotalPay !== undefined ? String(row[idxTotalPay] || "").trim() : "0",
                paymentMethod: idxPaymentMethod !== undefined ? String(row[idxPaymentMethod] || "").trim() : "-",
                status: idxStatus !== undefined ? String(row[idxStatus] || "").trim() : "Perlu Dikirim",
                catatan: idxCatatan !== undefined ? String(row[idxCatatan] || "").trim() : "",
                products: []
            };
        }
        
        ordersMap[noPesanan].products.push({
            nama: String(row[idxProduk] || "").trim(),
            variasi: idxVariasi !== undefined ? String(row[idxVariasi] || "").trim() : "",
            jumlah: jumlah
        });
    }
    
    for (const orderNo in ordersMap) {
        const order = ordersMap[orderNo];
        
        let productsHtml = "";
        order.products.forEach(p => {
            let varHtml = p.variasi ? `<div style="color:var(--text-tertiary); font-size:12px; margin-top:4px;">Variasi: ${p.variasi}</div>` : "";
            productsHtml += `
                <div style="display:flex; gap:12px; margin-bottom: 12px; align-items:flex-start;">
                    <div style="width:50px; height:50px; background:#f1f5f9; border-radius:4px; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#cbd5e1;"><i class="ti ti-photo" style="font-size:24px;"></i></div>
                    <div>
                        <div style="font-size:13px; color:var(--text-primary); font-weight:500; line-height:1.4;">${p.nama} <span style="color:var(--brand-primary); font-weight:700;">x${p.jumlah}</span></div>
                        ${varHtml}
                    </div>
                </div>
            `;
        });
        
        let catatanHtml = order.catatan ? `<div style="background:#f8fafc; border-top:1px solid #f1f5f9; padding:12px 16px; font-size:13px; color:var(--text-secondary);"><span style="color:var(--brand-primary); font-weight:600;">Pesan:</span> ${order.catatan}</div>` : "";
        
        let kurirSplit = order.kurir.split("-");
        let kurirTipe = kurirSplit[0] ? kurirSplit[0].trim() : "";
        let kurirNama = kurirSplit[1] ? kurirSplit[1].trim() : order.kurir;

        cardsHtml += `
            <div class="order-card" data-kurir="${order.kurir}" style="background:#fff; border:1px solid var(--border-light); border-radius:var(--radius-lg); margin-bottom:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                <div style="background:#f8fafc; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-light);">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:24px; height:24px; background:#e2e8f0; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#64748b;"><i class="ti ti-user" style="font-size:14px;"></i></div>
                        <span style="font-weight:600; font-size:13px; color:var(--text-primary);">${order.username}</span>
                        <i class="ti ti-message-circle-2" style="color:var(--brand-primary); font-size:16px; margin-left:4px;"></i>
                    </div>
                    <div style="font-size:13px; color:var(--text-secondary);">No. Pesanan <span style="font-weight:600; color:var(--text-primary);">${order.noPesanan}</span></div>
                </div>
                
                <div style="padding:16px; display:grid; grid-template-columns: minmax(200px, 2fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) 120px; gap:16px; align-items:start;">
                    <div>${productsHtml}</div>
                    <div>
                        <div style="font-weight:600; color:var(--text-primary); font-size:13px;">Rp${order.totalPay}</div>
                        <div style="color:var(--text-tertiary); font-size:12px; margin-top:4px;">${order.paymentMethod}</div>
                    </div>
                    <div>
                        <div style="font-weight:600; color:var(--text-primary); font-size:13px;">${order.status}</div>
                        <div style="color:var(--text-tertiary); font-size:11px; margin-top:4px; line-height:1.4;">Menunggu pengiriman diverifikasi oleh Jasa Kirim.</div>
                    </div>
                    <div>
                        <div style="color:var(--text-primary); font-size:13px; font-weight:500;">${kurirTipe}</div>
                        <div style="color:var(--text-secondary); font-size:12px; margin-top:4px;">${kurirNama}</div>
                        <div style="color:var(--text-tertiary); font-size:12px; margin-top:2px;">Drop off</div>
                        <div style="color:var(--text-tertiary); font-size:12px; margin-top:2px; font-family:monospace;">${order.resi}</div>
                    </div>
                    <div style="text-align:right;">
                        <a href="#" onclick="alert('Fitur rincian dalam pengembangan'); return false;" style="display:block; color:var(--brand-primary); text-decoration:none; font-size:13px; margin-bottom:8px; font-weight:500;">Lihat Rincian Pengiriman</a>
                        <a href="#" onclick="window.print(); return false;" style="display:block; color:var(--brand-primary); text-decoration:none; font-size:13px; font-weight:500;">Cetak Label (Internal)</a>
                    </div>
                </div>
                
                ${catatanHtml}
            </div>
        `;
    }
    
    totalPesanan = uniqueOrders.size;
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

    if (tbody) tbody.innerHTML = cardsHtml;
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

function printSimpleLabel(noPesanan) {
    const w = window.open("", "_blank", "width=800,height=600");
    w.document.write(`
        <html>
        <head>
            <title>Cetak Label Internal - ${noPesanan}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                .label { border: 2px dashed #334155; padding: 20px; max-width: 400px; margin: 0 auto; text-align: center; border-radius: 8px; }
                h1 { margin-top: 0; font-size: 24px; color: #0f172a; }
                .resi { font-size: 24px; font-weight: bold; background: #f1f5f9; padding: 10px; margin: 20px 0; border: 1px solid #cbd5e1; border-radius: 4px; }
                .print-btn { padding: 12px 24px; background: #0f172a; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 20px; font-weight: bold; font-size: 16px; }
                @media print { .print-btn { display: none; } .label { border: 2px solid #000; border-radius: 0; } }
            </style>
        </head>
        <body>
            <button class="print-btn" onclick="window.print()">Print Label Ini</button>
            <div class="label">
                <h1>LABEL INTERNAL</h1>
                <p style="color:#64748b; font-size:14px;">Nomor Pesanan:</p>
                <div class="resi">${noPesanan}</div>
                <p style="color: #ef4444; font-size: 12px; font-weight: bold;">(KHUSUS GUDANG - JANGAN DITEMPEL DI PAKET LUAR)</p>
            </div>
        </body>
        </html>
    `);
    w.document.close();
}

