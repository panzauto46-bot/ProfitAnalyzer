function renderDashboard(container) {
    if (!window.ordersStats) {
        container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-secondary);">Belum ada data. Silakan import file Excel terlebih dahulu.</div>';
        return;
    }

    // KURIR LIST (Redesigned as Progress Bars)
    let kurirHtml = '';
    const kurirEntries = Object.entries(window.ordersStats.kurirCount || {});
    kurirEntries.sort((a,b) => b[1] - a[1]);
    
    let maxKurir = kurirEntries.length > 0 ? kurirEntries[0][1] : 1;
    kurirEntries.forEach((k, i) => {
        let pct = Math.round((k[1] / maxKurir) * 100);
        kurirHtml += `
            <div style="margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span style="font-size:13px; font-weight:600; color:var(--text-primary);"><span style="color:var(--text-tertiary); margin-right:4px;">${i+1}.</span> ${k[0]}</span>
                    <span style="font-size:13px; font-weight:700; color:var(--text-primary);">${k[1]} pcs</span>
                </div>
                <div style="width:100%; background:#f1f5f9; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:var(--brand-gradient); border-radius:4px;"></div>
                </div>
            </div>
        `;
    });
    if (!kurirHtml) kurirHtml = '<div style="text-align:center; color:#94a3b8; font-size:13px; padding:20px 0;">Belum ada data</div>';

    // STATS
    let tStat = window.ordersStats.perluDikirim + window.ordersStats.dikirim + window.ordersStats.selesai + window.ordersStats.batal;
    let pctP = tStat ? Math.round((window.ordersStats.perluDikirim/tStat)*100) : 0;
    let pctD = tStat ? Math.round((window.ordersStats.dikirim/tStat)*100) : 0;
    let pctS = tStat ? Math.round((window.ordersStats.selesai/tStat)*100) : 0;
    let pctB = tStat ? Math.round((window.ordersStats.batal/tStat)*100) : 0;

    container.innerHTML = `
        <div style="animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);">
            
            <!-- HIGHLIGHT STATS ROW (NEW) -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 24px;">
                <div class="card" style="padding: 20px; display:flex; align-items:center; gap:16px; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light); border-bottom: 4px solid #f97316; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <div style="width:52px; height:52px; border-radius:14px; background:#fff7ed; color:#f97316; display:flex; align-items:center; justify-content:center; font-size:26px;"><i class="ti ti-box"></i></div>
                    <div><div style="font-size:13px; color:var(--text-secondary); font-weight:600; margin-bottom:2px;">Perlu Dikirim</div><div style="font-size:26px; font-weight:800; color:var(--text-primary); line-height:1;">${window.ordersStats.perluDikirim}</div></div>
                </div>
                <div class="card" style="padding: 20px; display:flex; align-items:center; gap:16px; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light); border-bottom: 4px solid #3b82f6; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <div style="width:52px; height:52px; border-radius:14px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:26px;"><i class="ti ti-truck"></i></div>
                    <div><div style="font-size:13px; color:var(--text-secondary); font-weight:600; margin-bottom:2px;">Dikirim</div><div style="font-size:26px; font-weight:800; color:var(--text-primary); line-height:1;">${window.ordersStats.dikirim}</div></div>
                </div>
                <div class="card" style="padding: 20px; display:flex; align-items:center; gap:16px; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light); border-bottom: 4px solid #22c55e; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <div style="width:52px; height:52px; border-radius:14px; background:#f0fdf4; color:#22c55e; display:flex; align-items:center; justify-content:center; font-size:26px;"><i class="ti ti-circle-check"></i></div>
                    <div><div style="font-size:13px; color:var(--text-secondary); font-weight:600; margin-bottom:2px;">Selesai</div><div style="font-size:26px; font-weight:800; color:var(--text-primary); line-height:1;">${window.ordersStats.selesai}</div></div>
                </div>
                <div class="card" style="padding: 20px; display:flex; align-items:center; gap:16px; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light); border-bottom: 4px solid #ef4444; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <div style="width:52px; height:52px; border-radius:14px; background:#fef2f2; color:#ef4444; display:flex; align-items:center; justify-content:center; font-size:26px;"><i class="ti ti-x"></i></div>
                    <div><div style="font-size:13px; color:var(--text-secondary); font-weight:600; margin-bottom:2px;">Dibatalkan</div><div style="font-size:26px; font-weight:800; color:var(--text-primary); line-height:1;">${window.ordersStats.batal}</div></div>
                </div>
            </div>

            <!-- MASONRY LAYOUT -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; align-items: start;">
                
                <!-- LEFT COLUMN: CHARTS (Doesn't stretch to full height) -->
                <div style="display:flex; flex-direction:column; gap:24px;">
                    
                    <div class="card" style="padding: 24px; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; display:flex; align-items:center; gap:8px;"><i class="ti ti-chart-bar" style="color:var(--brand-primary);"></i> Top 5 Produk Terlaris</h3>
                        <div style="height: 300px; width: 100%;">
                            <canvas id="topProductsChart"></canvas>
                        </div>
                    </div>

                    <div class="card" style="padding: 24px; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; display:flex; align-items:center; gap:8px;"><i class="ti ti-chart-pie-2" style="color:#8b5cf6;"></i> Rasio Status Pesanan</h3>
                        <div style="display:flex; align-items:center; justify-content:center; gap:48px;">
                            <div style="width:220px; height:220px; position:relative; flex-shrink:0;">
                                <canvas id="packingStatusChart"></canvas>
                                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center;">
                                    <div style="font-size:28px; font-weight:800; color:var(--text-primary); line-height:1;">${tStat}</div>
                                    <div style="font-size:12px; font-weight:600; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-top:4px;">Total</div>
                                </div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:20px; min-width: 180px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; color:var(--text-secondary);"><div style="width:14px; height:14px; border-radius:4px; background:#f97316;"></div> Perlu Dikirim</div> <div style="font-weight:700; font-size:15px;">${pctP}%</div></div>
                                <div style="display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; color:var(--text-secondary);"><div style="width:14px; height:14px; border-radius:4px; background:#3b82f6;"></div> Dikirim</div> <div style="font-weight:700; font-size:15px;">${pctD}%</div></div>
                                <div style="display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; color:var(--text-secondary);"><div style="width:14px; height:14px; border-radius:4px; background:#22c55e;"></div> Selesai</div> <div style="font-weight:700; font-size:15px;">${pctS}%</div></div>
                                <div style="display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; color:var(--text-secondary);"><div style="width:14px; height:14px; border-radius:4px; background:#ef4444;"></div> Dibatalkan</div> <div style="font-weight:700; font-size:15px;">${pctB}%</div></div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- RIGHT COLUMN: KURIR (Scrolls internally) -->
                <div class="card" style="padding: 24px; background:white; border-radius:var(--radius-md); border:1px solid var(--border-light); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; display:flex; align-items:center; justify-content:space-between;">
                        <span style="display:flex; align-items:center; gap:8px;"><i class="ti ti-truck-delivery" style="color:#f59e0b;"></i> Ekspedisi</span>
                        <span style="font-size:12px; font-weight:600; color:var(--brand-primary); background:var(--brand-light); padding:4px 10px; border-radius:20px;">${kurirEntries.length} Layanan</span>
                    </h3>
                    <div style="max-height: 560px; overflow-y:auto; padding-right:8px;" class="custom-scroll">
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
            if (window.packingStatusChartInstance) window.packingStatusChartInstance.destroy();
            window.packingStatusChartInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Perlu Dikirim', 'Dikirim', 'Selesai', 'Dibatalkan'],
                    datasets: [{
                        data: [window.ordersStats.perluDikirim, window.ordersStats.dikirim, window.ordersStats.selesai, window.ordersStats.batal],
                        backgroundColor: ['#f97316', '#3b82f6', '#22c55e', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            padding: 12, cornerRadius: 8
                        }
                    }
                }
            });
        }

        // Horizontal Bar Chart (Top Products)
        const ctxProducts = document.getElementById('topProductsChart');
        if (ctxProducts && window.Chart) {
            if (window.topProductsChartInstance) window.topProductsChartInstance.destroy();

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
            const labels = topProducts.map(p => p[0].length > 25 ? p[0].substring(0, 25) + '...' : p[0]);
            const data = topProducts.map(p => p[1]);

            if (topProducts.length > 0) {
                
                // Create gradient for bars
                let ctx = ctxProducts.getContext('2d');
                let gradient = ctx.createLinearGradient(0, 0, 400, 0);
                gradient.addColorStop(0, '#1E3A8A');
                gradient.addColorStop(1, '#3B82F6');

                window.topProductsChartInstance = new Chart(ctxProducts, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: gradient,
                            borderRadius: 6,
                            maxBarThickness: 32 // Prevent ultra-thin or ultra-thick bars
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                padding: 12, cornerRadius: 8,
                                callbacks: {
                                    title: function(context) { return topProducts[context[0].dataIndex][0]; },
                                    label: function(context) { return ' ' + context.parsed.x + ' pcs'; }
                                }
                            }
                        },
                        scales: {
                            x: { display: false, grid: { display: false } },
                            y: { 
                                grid: { display: false, drawBorder: false },
                                ticks: { font: { family: "'Inter', sans-serif", size: 12, weight: '600' }, color: '#334155' },
                                border: { display: false }
                            }
                        }
                    }
                });
            }
        }
    }, 100);
}
