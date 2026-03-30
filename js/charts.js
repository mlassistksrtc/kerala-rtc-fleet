// ==================== CHARTS MODULE ====================

let chartInstances = {
    makeType: null,
    class: null,
    depot: null,
    workshop: null
};

function destroyAllCharts() {
    Object.keys(chartInstances).forEach(key => {
        if (chartInstances[key]) {
            chartInstances[key].destroy();
            chartInstances[key] = null;
        }
    });
}

function createMakeTypeChart(data) {
    const canvas = document.getElementById("makeTypeChart");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const map = new Map();
    
    data.forEach(bus => {
        let make = bus.makeType || "Unknown";
        if (make.includes("LL")) make = "LL";
        else if (make.includes("TT")) make = "TT";
        else if (make.includes("ER")) make = "ER";
        else if (make.includes("VOLVO")) make = "VOLVO";
        else if (make.includes("SCANIA")) make = "SCANIA";
        else if (make.includes("ELECTRIC") || make.includes("EL")) make = "ELECTRIC";
        map.set(make, (map.get(make) || 0) + 1);
    });
    
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const labels = sorted.map(item => item[0]);
    const counts = sorted.map(item => item[1]);
    
    if (chartInstances.makeType) chartInstances.makeType.destroy();
    
    chartInstances.makeType = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: ['#2c6e49', '#e67e22', '#3498db', '#9b59b6', '#f1c40f', 
                                  '#1abc9c', '#e74c3c', '#95a5a6', '#34495e', '#16a085']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 10 } } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} buses` } }
            }
        }
    });
}

function createClassChart(data) {
    const canvas = document.getElementById("classChart");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const map = new Map();
    
    data.forEach(bus => {
        let className = bus.busClass || "Unknown";
        if (className.includes("ORDINARY")) className = "ORDINARY";
        else if (className.includes("SUPER DELUXE")) className = "SUPER DELUXE";
        else if (className.includes("SUPER FAST")) className = "SUPER FAST";
        else if (className.includes("FAST PASSENGER")) className = "FAST PASSENGER";
        else if (className.includes("SWIFT")) className = "SWIFT";
        else if (className.includes("VOLVO")) className = "VOLVO";
        else if (className.includes("SCANIA")) className = "SCANIA";
        else if (className.includes("ELECTRIC")) className = "ELECTRIC";
        map.set(className, (map.get(className) || 0) + 1);
    });
    
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const counts = sorted.map(item => item[1]);
    
    if (chartInstances.class) chartInstances.class.destroy();
    
    chartInstances.class = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: ['#2c6e49', '#e67e22', '#3498db', '#9b59b6', '#f1c40f', 
                                  '#1abc9c', '#e74c3c', '#95a5a6', '#34495e', '#16a085']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 10 } } }
            }
        }
    });
}

function createDepotChart(data) {
    const canvas = document.getElementById("depotChart");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const map = new Map();
    
    data.forEach(bus => {
        let depot = bus.depot || "Unknown";
        map.set(depot, (map.get(depot) || 0) + 1);
    });
    
    // Show all depots
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const counts = sorted.map(item => item[1]);
    
    if (chartInstances.depot) chartInstances.depot.destroy();
    
    chartInstances.depot = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Buses',
                data: counts,
                backgroundColor: '#3498db',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw} buses` } }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: 'Number of Buses' },
                    ticks: { stepSize: 1 }
                },
                x: { 
                    ticks: { 
                        rotation: 45, 
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45
                    }, 
                    title: { display: true, text: 'Depot' } 
                }
            }
        }
    });
}

function createWorkshopChart(data) {
    const canvas = document.getElementById("workshopChart");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const map = new Map();
    
    data.forEach(bus => {
        let workshop = bus.workshop || "Unknown";
        map.set(workshop, (map.get(workshop) || 0) + 1);
    });
    
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const counts = sorted.map(item => item[1]);
    
    if (chartInstances.workshop) chartInstances.workshop.destroy();
    
    chartInstances.workshop = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Buses',
                data: counts,
                backgroundColor: '#e67e22',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw} buses` } }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: 'Number of Buses' },
                    ticks: { stepSize: 1 }
                },
                x: { 
                    title: { display: true, text: 'Workshop' } 
                }
            }
        }
    });
}

function updateAllCharts(fleetData) {
    if (!fleetData || fleetData.length === 0) return;
    createMakeTypeChart(fleetData);
    createClassChart(fleetData);
    createDepotChart(fleetData);
    createWorkshopChart(fleetData);
}

window.charts = {
    destroyAllCharts,
    updateAllCharts
};