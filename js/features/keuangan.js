/* --- KEUANGAN LOGIC --- */
let currentKeuanganTab = 'dashboard';
let keuanganData = { penarikan: null, pending: null, selesai: null };
let keuanganChartInstance = null;

function switchKeuanganTab(tab) {
    currentKeuanganTab = tab;
    
    // Update buttons
    ['dashboard', 'penarikan', 'pending', 'selesai'].forEach(t => {
        const btn = document.getElementById('btnKeuangan' + t.charAt(0).toUpperCase() + t.slice(1));
        if (t === tab) {
            btn.style.background = 'var(--brand-light)';
            btn.style.color = 'var(--brand-dark)';
            btn.style.borderColor = 'var(--brand-secondary)';
        } else {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-secondary)';
            btn.style.borderColor = 'var(--border-light)';
        }
    });

    if (tab === 'dashboard') {
        document.getElementById('keuanganFileArea').style.display = 'none';
        document.getElementById('keuanganDashboardArea').style.display = 'block';
        updateKeuanganDashboard();
    } else {
        document.getElementById('keuanganDashboardArea').style.display = 'none';
        document.getElementById('keuanganFileArea').style.display = 'block';
        
        // Update UI text based on tab
        let title = tab === 'penarikan' ? 'Penarikan Dana' : tab === 'pending' ? 'Transaksi Pending' : 'Transaksi Selesai';
        document.getElementById('fileNameKeuangan').innerText = `Drop file ${title} (.xlsx) di sini`;
        
        // Render data if exists
        if (keuanganData[tab]) {
            renderKeuanganData(keuanganData[tab]);
        } else {
            document.getElementById('keuanganResults').style.display = 'none';
            document.getElementById('fileInputKeuangan').value = ""; // clear input
        }
    }
}

function extractNumber(val) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        let n = parseFloat(val.replace(/[^0-9.-]/g, ''));
        return isNaN(n) ? 0 : n;
    }
    return 0;
}

function updateKeuanganDashboard() {
    let hasData = keuanganData.penarikan || keuanganData.pending || keuanganData.selesai;
    
    if (!hasData) {
        document.getElementById('dashEmptyState').style.display = 'block';
        document.querySelector('#keuanganDashboardArea .stats-grid').style.display = 'none';
        document.querySelector('#keuanganDashboardArea .card').style.display = 'none';
        return;
    }
    
    document.getElementById('dashEmptyState').style.display = 'none';
    document.querySelector('#keuanganDashboardArea .stats-grid').style.display = 'grid';
    document.querySelector('#keuanganDashboardArea .card').style.display = 'block';
    
    let totalGmv = 0;
    let totalSelesai = 0;
    let totalPending = 0;
    let totalPenarikan = 0;
    
    // Calculate Selesai & GMV
    if (keuanganData.selesai) {
        let moneyCol = findMoneyCol(keuanganData.selesai);
        let typeCol = Object.keys(keuanganData.selesai[0]).find(h => h.toLowerCase().includes('jenis') || h.toLowerCase().includes('tipe'));
        
        keuanganData.selesai.forEach(row => {
            if (moneyCol) {
                let val = extractNumber(row[moneyCol]);
                let isGmv = typeCol && String(row[typeCol]).toLowerCase().includes('gmv');
                if (isGmv) {
                    totalGmv += val;
                } else {
                    totalSelesai += val;
                }
            }
        });
    }
    
    // Calculate Pending
    if (keuanganData.pending) {
        let moneyCol = findMoneyCol(keuanganData.pending);
        if (moneyCol) {
            keuanganData.pending.forEach(row => {
                totalPending += extractNumber(row[moneyCol]);
            });
        }
    }
    
    // Calculate Penarikan
    if (keuanganData.penarikan) {
        let moneyCol = findMoneyCol(keuanganData.penarikan);
        if (moneyCol) {
            keuanganData.penarikan.forEach(row => {
                totalPenarikan += extractNumber(row[moneyCol]);
            });
        }
    }
    
    document.getElementById('dashTotalGmv').innerText = rp(Math.abs(totalGmv));
    document.getElementById('dashTotalSelesai').innerText = rp(totalSelesai);
    document.getElementById('dashTotalPending').innerText = rp(totalPending);
    document.getElementById('dashTotalPenarikan').innerText = rp(totalPenarikan);
    
    // Update Chart
    const ctx = document.getElementById('keuanganChart').getContext('2d');
    if (keuanganChartInstance) {
        keuanganChartInstance.destroy();
    }
    
    keuanganChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total GMV', 'Selesai (Non-GMV)', 'Pending', 'Penarikan'],
            datasets: [{
                label: 'Nominal (Rp)',
                data: [Math.abs(totalGmv), Math.abs(totalSelesai), Math.abs(totalPending), Math.abs(totalPenarikan)],
                backgroundColor: [
                    'rgba(15, 118, 110, 0.7)',
                    'rgba(20, 184, 166, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(22, 163, 74, 0.7)'
                ],
                borderColor: [
                    'rgb(15, 118, 110)',
                    'rgb(20, 184, 166)',
                    'rgb(245, 158, 11)',
                    'rgb(22, 163, 74)'
                ],
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + (value/1000000 >= 1 ? (value/1000000).toFixed(1) + 'Jt' : value/1000 + 'Rb');
                        }
                    }
                }
            }
        }
    });
}

function findMoneyCol(rows) {
    if (!rows || rows.length === 0) return null;
    const headers = Object.keys(rows[0]);
    
    const isExcludedCol = (h) => {
        let hl = h.toLowerCase();
        return hl.includes('waktu') || hl.includes('tanggal') || hl.includes('date') || hl.includes('time') || 
               hl.match(/\bid\b/) || hl.includes('id ') || hl.includes('no.') || hl.includes('nomor') || hl.includes('pesanan') || hl.includes('resi');
    };

    for (let h of headers) {
        if (!isExcludedCol(h)) {
            let hl = h.toLowerCase();
            if (hl.includes('jumlah') || hl.includes('nominal') || hl.includes('total') || hl.includes('pelepasan') || hl.includes('dana') || hl.includes('amount') || hl.includes('pembayaran') || hl.includes('penghasilan') || hl.includes('subtotal')) {
                let isNumeric = false;
                for(let i=0; i<Math.min(5, rows.length); i++) {
                    let val = rows[i][h];
                    if (val === "" || val === null || val === undefined) continue;
                    if (typeof val === 'number' || !isNaN(parseFloat(String(val).replace(/[^0-9.-]/g, '')))) {
                        isNumeric = true; break;
                    }
                }
                if (isNumeric) return h;
            }
        }
    }
    for (let h of headers) {
        if (!isExcludedCol(h)) {
            for(let i=0; i<Math.min(5, rows.length); i++) {
                if (typeof rows[i][h] === 'number') return h;
            }
        }
    }
    return null;
}

document.getElementById('fileInputKeuangan').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.SheetNames[0];
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
            
            keuanganData[currentKeuanganTab] = rows;
            renderKeuanganData(rows);
            showToast('Data berhasil dimuat', 'success');
        } catch (err) {
            console.error(err);
            showToast('Gagal memuat file Excel', 'error');
        }
    };
    reader.readAsBinaryString(file);
});

function renderKeuanganData(rows) {
    if (!rows || rows.length === 0) {
        document.getElementById('keuanganResults').style.display = 'none';
        return;
    }
    
    document.getElementById('keuanganResults').style.display = 'block';
    document.getElementById('keuanganRowCount').innerText = rows.length;
    
        // Detect money column intelligently
    let moneyCol = findMoneyCol(rows);
    
    let total = 0;
    if (moneyCol) {
        rows.forEach(r => {
            let val = r[moneyCol];
            let num = 0;
            if (typeof val === 'number') num = val;
            else if (typeof val === 'string') {
                num = parseFloat(val.replace(/[^0-9.-]/g, ''));
            }
            if (!isNaN(num)) total += num;
        });
        document.getElementById('keuanganTotalTitle').innerText = 'Total ' + moneyCol;
        document.getElementById('keuanganTotalValue').innerText = rp(total);
    } else {
        document.getElementById('keuanganTotalTitle').innerText = 'Total Nominal';
        document.getElementById('keuanganTotalValue').innerText = '-';
    }
    
    // Render table
    const thead = document.getElementById('keuanganTableHead');
    const tbody = document.getElementById('keuanganTableBody');
    
    let headHTML = '<tr>';
    headers.forEach(h => { headHTML += `<th style="white-space:nowrap;">${h}</th>`; });
    headHTML += '</tr>';
    thead.innerHTML = headHTML;
    
    let bodyHTML = '';
    // show up to 100 rows to prevent lag
    const maxRows = Math.min(rows.length, 100);
    for (let i = 0; i < maxRows; i++) {
        bodyHTML += '<tr>';
        headers.forEach(h => {
            let val = rows[i][h];
            // Format money columns neatly
            if (h === moneyCol && !isNaN(parseFloat(String(val).replace(/[^0-9.-]/g, '')))) {
                let num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
                val = rp(num);
                bodyHTML += `<td style="white-space:nowrap; text-align:right;">${val}</td>`;
            } else {
                bodyHTML += `<td>${val}</td>`;
            }
        });
        bodyHTML += '</tr>';
    }
    if (rows.length > 100) {
        bodyHTML += `<tr><td colspan="${headers.length}" style="text-align:center; color:var(--text-tertiary);">... dan ${rows.length - 100} baris lainnya (hanya 100 baris pertama yang ditampilkan agar ringan) ...</td></tr>`;
    }
    tbody.innerHTML = bodyHTML;
}

// Drag & drop support for keuangan upload
const uploadZoneK = document.getElementById('uploadZoneKeuangan');
const fileInputK = document.getElementById('fileInputKeuangan');
if(uploadZoneK && fileInputK) {
    uploadZoneK.addEventListener('click', () => fileInputK.click());
    uploadZoneK.addEventListener('dragover', (e) => { e.preventDefault(); uploadZoneK.classList.add('dragging'); });
    uploadZoneK.addEventListener('dragleave', (e) => { e.preventDefault(); uploadZoneK.classList.remove('dragging'); });
    uploadZoneK.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZoneK.classList.remove('dragging');
        if (e.dataTransfer.files.length > 0) {
            fileInputK.files = e.dataTransfer.files;
            fileInputK.dispatchEvent(new Event('change'));
        }
    });
}