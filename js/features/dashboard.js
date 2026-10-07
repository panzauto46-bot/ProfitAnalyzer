function renderDashboard(container) {
    if (!window.ordersStats) {
        container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-secondary);">Belum ada data. Silakan import file Excel terlebih dahulu.</div>';
        return;
    }

    let kurirHtml = '';
    const kurirEntries = Object.entries(window.ordersStats.kurirCount || {});
    kurirEntries.sort((a,b) => b[1] - a[1]);
    
    kurirEntries.forEach((k, i) => {
        kurirHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px 0; border-bottom: ${i === kurirEntries.length-1 ? 'none' : '1px dashed #e2e8f0'};">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:28px; height:28px; border-radius:6px; background:var(--brand-light); color:var(--brand-secondary); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px;">${i+1}</div>
                    <span style="font-weight:600; color:var(--text-primary); font-size:13px; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${k[0]}">${k[0]}</span>
                </div>
                <div style="font-weight:700; color:var(--brand-primary); font-size:12px; background:#f1f5f9; padding: 4px 8px; border-radius:20px;">${k[1]} pesanan</div>
            </div>
        `;
    });
    
    if (!kurirHtml) kurirHtml = '<div style="text-align:center; color:#94a3b8; font-size:13px; padding:20px 0;">Belum ada data ekspedisi</div>';

    let tStat = window.ordersStats.perluDikirim + window.ordersStats.dikirim + window.ordersStats.selesai + window.ordersStats.batal;
    let pctP = tStat ? Math.round((window.ordersStats.perluDikirim/tStat)*100) : 0;
    let pctD = tStat ? Math.round((window.ordersStats.dikirim/tStat)*100) : 0;
    let pctS = tStat ? Math.round((window.ordersStats.selesai/tStat)*100) : 0;
    let pctB = tStat ? Math.round((window.ordersStats.batal/tStat)*100) : 0;

    container.innerHTML = `
        <div style="animation: fadeIn 0.4s ease;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px;">
                
                <!-- Status Chart -->
                <div class="card" style="padding: 20px; display:flex; flex-direction:column; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light);">
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; display:flex; align-items:center; gap:8px;"><i class="ti ti-chart-pie" style="color:var(--brand-primary);"></i> Komposisi Status</h3>
                    
                    <div style="display:flex; justify-content:center; align-items:center; flex:1; min-height:180px; max-height:220px;">
                        <canvas id="packingStatusChart"></canvas>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px;">
                        <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-primary); font-weight:600;"><div style="width:16px; height:16px; border-radius:4px; background:#f97316;"></div> Perlu (${pctP}%)</div>
                        <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-primary); font-weight:600;"><div style="width:16px; height:16px; border-radius:4px; background:#3b82f6;"></div> Dikirim (${pctD}%)</div>
                        <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-primary); font-weight:600;"><div style="width:16px; height:16px; border-radius:4px; background:#22c55e;"></div> Selesai (${pctS}%)</div>
                        <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-primary); font-weight:600;"><div style="width:16px; height:16px; border-radius:4px; background:#ef4444;"></div> Batal (${pctB}%)</div>
                    </div>
                </div>

                <!-- Top Products Chart -->
                <div class="card" style="padding: 20px; display:flex; flex-direction:column; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light);">
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display:flex; align-items:center; gap:8px;"><i class="ti ti-trophy" style="color:#eab308;"></i> Top 5 Produk Terlaris</h3>
                    <div style="flex:1; display:flex; flex-direction:column; position:relative; min-height:200px;">
                        <canvas id="topProductsChart"></canvas>
                    </div>
                </div>
                
                <!-- Kurir Top List -->
                <div class="card" style="padding: 20px; display:flex; flex-direction:column; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light);">
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display:flex; align-items:center; gap:8px;"><i class="ti ti-truck-delivery" style="color:#f59e0b;"></i> Distribusi Ekspedisi</h3>
                    <div style="flex:1; overflow-y:auto; padding-right:4px;">
                        ${kurirHtml}
                    </div>
                </div>

            </div>
        </div>
    `;
    
    setTimeout(() => {
        // Doughnut Chart (Status)
        const ctxStatus = document.getElementById('packingStatusChart');
        if (ctxStatus && window.Chart) {
            if (window.packingStatusChartInstance) {
                window.packingStatusChartInstance.destroy();
            }
            window.packingStatusChartInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Perlu Dikirim', 'Dikirim', 'Selesai', 'Dibatalkan'],
                    datasets: [{
                        data: [window.ordersStats.perluDikirim, window.ordersStats.dikirim, window.ordersStats.selesai, window.ordersStats.batal],
                        backgroundColor: ['#f97316', '#3b82f6', '#22c55e', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleFont: { family: "'Inter', sans-serif" },
                            bodyFont: { family: "'Inter', sans-serif" },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    return ' ' + context.parsed + ' pesanan';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Horizontal Bar Chart (Top Products)
        const ctxProducts = document.getElementById('topProductsChart');
        if (ctxProducts && window.Chart) {
            if (window.topProductsChartInstance) {
                window.topProductsChartInstance.destroy();
            }

            // Calculate Top Products dynamically
            let productCounts = {};
            if (window.ordersData && window.ordersData.length > 0) {
                window.ordersData.forEach(o => {
                    if (o.items) {
                        o.items.forEach(item => {
                            if (!productCounts[item.produk]) productCounts[item.produk] = 0;
                            productCounts[item.produk] += item.jumlah;
                        });
                    }
                });
            }
            const topProducts = Object.entries(productCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
            
            // Labels and Data
            const labels = topProducts.map(p => p[0].length > 18 ? p[0].substring(0, 18) + '...' : p[0]);
            const data = topProducts.map(p => p[1]);

            if (topProducts.length === 0) {
                ctxProducts.parentElement.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-tertiary); font-size:13px;">Belum ada data produk</div>';
            } else {
                window.topProductsChartInstance = new Chart(ctxProducts, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: '#2563EB',
                            borderRadius: 4,
                            barThickness: 16
                        }]
                    },
                    options: {
                        indexAxis: 'y', // Makes it horizontal
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                titleFont: { family: "'Inter', sans-serif" },
                                bodyFont: { family: "'Inter', sans-serif" },
                                padding: 12,
                                cornerRadius: 8,
                                callbacks: {
                                    title: function(context) {
                                        return topProducts[context[0].dataIndex][0]; // Full name on tooltip
                                    },
                                    label: function(context) {
                                        return ' ' + context.parsed.x + ' terjual';
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                display: false, // Hide X axis
                                grid: { display: false }
                            },
                            y: {
                                grid: { display: false, drawBorder: false },
                                ticks: {
                                    font: { family: "'Inter', sans-serif", size: 11, weight: '600' },
                                    color: '#475569'
                                },
                                border: { display: false }
                            }
                        }
                    }
                });
            }
        }
    }, 100);
}
