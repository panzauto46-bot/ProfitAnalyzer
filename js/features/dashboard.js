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
                    <div style="width:32px; height:32px; border-radius:8px; background:#f1f5f9; color:#475569; display:flex; align-items:center; justify-content:center; font-weight:bold;">${i+1}</div>
                    <span style="font-weight:600; color:var(--text-primary); font-size:14px;">${k[0]}</span>
                </div>
                <div style="font-weight:700; color:var(--brand-primary); font-size:14px; background:#ccfbf1; padding: 4px 12px; border-radius:20px;">${k[1]} pesanan</div>
            </div>
        `;
    });
    
    if (!kurirHtml) kurirHtml = '<div style="text-align:center; color:#94a3b8; font-size:13px; padding:20px 0;">Belum ada data ekspedisi</div>';

    let tStat = window.ordersStats.perluDikirim + window.ordersStats.dikirim + window.ordersStats.selesai + window.ordersStats.batal;
    let pctP = tStat ? Math.round((window.ordersStats.perluDikirim/tStat)*100) : 0;
    let pctD = tStat ? Math.round((window.ordersStats.dikirim/tStat)*100) : 0;
    let pctS = tStat ? Math.round((window.ordersStats.selesai/tStat)*100) : 0;
    let pctB = tStat ? Math.round((window.ordersStats.batal/tStat)*100) : 0;

    // Custom HTML Legend inside a Flex layout
    container.innerHTML = `
        <div style="animation: fadeIn 0.4s ease;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                <!-- Status Chart -->
                <div style="background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; display:flex; align-items:center; gap:8px;"><i class="ti ti-chart-pie" style="color:var(--brand-primary);"></i> Komposisi Status Pesanan</h3>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; height: 260px;">
                        <div style="flex: 1; position: relative; height: 100%;">
                            <canvas id="packingStatusChart"></canvas>
                        </div>
                        <div style="width: 160px; display: flex; flex-direction: column; gap: 16px; padding-left: 20px;">
                            <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-secondary); font-weight:600;">
                                <div style="width:16px; height:16px; border-radius:4px; background:#f97316;"></div>
                                Perlu Dikirim (${pctP}%)
                            </div>
                            <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-secondary); font-weight:600;">
                                <div style="width:16px; height:16px; border-radius:4px; background:#3b82f6;"></div>
                                Dikirim (${pctD}%)
                            </div>
                            <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-secondary); font-weight:600;">
                                <div style="width:16px; height:16px; border-radius:4px; background:#22c55e;"></div>
                                Selesai (${pctS}%)
                            </div>
                            <div style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-secondary); font-weight:600;">
                                <div style="width:16px; height:16px; border-radius:4px; background:#ef4444;"></div>
                                Dibatalkan (${pctB}%)
                            </div>
                        </div>
                    </div>

                </div>
                
                <!-- Kurir Top List -->
                <div style="background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display:flex; flex-direction:column;">
                    <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display:flex; align-items:center; gap:8px;"><i class="ti ti-truck-delivery" style="color:#f59e0b;"></i> Distribusi Ekspedisi</h3>
                    <div style="flex:1; overflow-y:auto; padding-right:8px; height: 260px;">
                        ${kurirHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
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
                    maintainAspectRatio: false,
                    cutoutPercentage: 65,
                    legend: {
                        display: false // We use our custom HTML legend!
                    },
                    tooltips: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFontFamily: "'Inter', sans-serif",
                        bodyFontFamily: "'Inter', sans-serif",
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(tooltipItem, data) {
                                var dataset = data.datasets[tooltipItem.datasetIndex];
                                var currentValue = dataset.data[tooltipItem.index];
                                return ' ' + currentValue + ' pesanan';
                            }
                        }
                    }
                }
            });
        }
    }, 50);

    // Update stats top row
    const statPesanan = document.getElementById('packingStatPesanan');
    const statBarang = document.getElementById('packingStatBarang');
    if (statPesanan) statPesanan.innerText = window.ordersStats.total.toLocaleString('id-ID');
    if (statBarang) statBarang.innerText = window.ordersStats.qty.toLocaleString('id-ID');
}

