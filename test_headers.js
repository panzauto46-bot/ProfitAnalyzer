const XLSX = require('xlsx');

function checkFile(filename) {
    const workbook = XLSX.readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    console.log(`\n--- ${filename} ---`);
    if (rows.length === 0) {
        console.log("Empty sheet");
        return;
    }
    const headers = Object.keys(rows[0]);
    console.log("HEADERS:", headers);
    
    // Test the heuristic
    const isExcludedCol = (h) => {
        let hl = h.toLowerCase();
        return hl.includes('waktu') || hl.includes('tanggal') || hl.includes('date') || hl.includes('time') || 
               hl.match(/\bid\b/) || hl.includes('id ') || hl.includes('no.') || hl.includes('nomor') || hl.includes('pesanan') || hl.includes('resi');
    };

    let selectedCol = null;
    let fallbackCol = null;
    
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
                if (isNumeric) {
                    selectedCol = h;
                    break;
                }
            }
        }
    }
    
    for (let h of headers) {
        if (!isExcludedCol(h)) {
            for(let i=0; i<Math.min(5, rows.length); i++) {
                if (typeof rows[i][h] === 'number') {
                    fallbackCol = h;
                    break;
                }
            }
            if (fallbackCol) break;
        }
    }
    
    console.log("SELECTED COL (Heuristic):", selectedCol);
    console.log("SELECTED COL (Fallback):", fallbackCol);
    
    if (selectedCol) {
        console.log("First 3 values in selected col:");
        for(let i=0; i<Math.min(3, rows.length); i++) {
            console.log("  ", rows[i][selectedCol]);
        }
    } else if (fallbackCol) {
        console.log("First 3 values in fallback col:");
        for(let i=0; i<Math.min(3, rows.length); i++) {
            console.log("  ", rows[i][fallbackCol]);
        }
    } else {
        console.log("NO COLUMN MATCHED!");
    }
}

checkFile('test_pending.xlsx');
checkFile('test_selesai.xlsx');
