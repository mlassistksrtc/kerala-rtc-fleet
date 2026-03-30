// ==================== MAIN APPLICATION ====================

let fleetData = [];

// ==================== MODAL FUNCTIONS ====================

function showDetailModal(title, items, total, unit = "buses") {
    const modal = document.getElementById("detailModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalContent = document.getElementById("modalContent");
    const modalFooter = document.getElementById("modalFooter");
    
    if (!modal) return;
    
    modalTitle.innerHTML = `<i class="fas fa-chart-line"></i> ${title}`;
    
    if (!items || items.length === 0) {
        modalContent.innerHTML = '<p style="text-align:center; color:#6b7280;">No data available</p>';
    } else {
        let contentHtml = '<ul class="detail-list">';
        items.forEach((item, index) => {
            const isFirst = index === 0;
            contentHtml += `
                <li class="detail-list-item ${isFirst ? 'highlight' : ''}">
                    <span class="detail-item-name">${escapeHtml(String(item[0]))}</span>
                    <span class="detail-item-count">${item[1]} ${unit}</span>
                </li>
            `;
        });
        contentHtml += '</ul>';
        modalContent.innerHTML = contentHtml;
    }
    
    const unitText = unit === 'buses' ? 'buses' : 'types';
    modalFooter.innerHTML = `Total: ${total} ${unitText}`;
    
    modal.classList.remove("hide");
}

function closeModal() {
    const modal = document.getElementById("detailModal");
    if (modal) modal.classList.add("hide");
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== KPI CLICK HANDLERS ====================

function setupKpiClickHandlers() {
    const kpiCards = document.querySelectorAll('.kpi-card.clickable');
    console.log("Setting up click handlers for", kpiCards.length, "KPIs");
    
    kpiCards.forEach(card => {
        const kpiType = card.getAttribute('data-kpi');
        const config = window.CONFIG.KPI_CONFIG[kpiType];
        
        if (config) {
            card.onclick = function(e) {
                e.stopPropagation();
                console.log("KPI clicked:", kpiType);
                if (!fleetData || fleetData.length === 0) {
                    alert("No fleet data available. Please upload an Excel file first.");
                    return;
                }
                const data = config.getData(fleetData);
                if (data.items && data.items.length > 0) {
                    showDetailModal(config.title, data.items, data.total, "buses");
                } else {
                    alert("No data available for this KPI.");
                }
            };
        }
    });
}

// ==================== AGE DISTRIBUTION HANDLERS ====================

function setupAgeDistributionClickHandler() {
    const ageSection = document.getElementById("ageSectionTitle");
    const ageGrid = document.getElementById("ageGrid");
    
    if (ageSection) {
        ageSection.onclick = () => {
            console.log("Age section clicked");
            if (!fleetData || fleetData.length === 0) {
                alert("No fleet data available. Please upload an Excel file first.");
                return;
            }
            showAgeDistributionModal();
        };
    }
    
    if (ageGrid) {
        ageGrid.onclick = (e) => {
            const ageCard = e.target.closest('.age-card');
            if (ageCard) {
                const ageRange = ageCard.querySelector('.age-range')?.innerText || "";
                const count = ageCard.querySelector('.age-count')?.innerText || "0";
                if (parseInt(count) > 0) {
                    showAgeRangeDetail(ageRange, parseInt(count));
                }
            }
        };
    }
}

function showAgeDistributionModal() {
    const ageCounts = {};
    window.CONFIG.AGE_BINS.forEach(bin => { ageCounts[bin.label] = 0; });
    
    fleetData.forEach(bus => {
        const age = window.utils.calculatePreciseAge(bus.registrationDate);
        if (age !== null) {
            const bin = window.utils.getAgeBin(age);
            if (bin) ageCounts[bin.label]++;
        }
    });
    
    const items = Object.entries(ageCounts).filter(([_, count]) => count > 0);
    showDetailModal("Age Distribution (Years)", items, fleetData.length, "buses");
}

function showAgeRangeDetail(ageRange, count) {
    const bin = window.CONFIG.AGE_BINS.find(b => b.label === ageRange);
    if (!bin) return;
    
    const busesInRange = fleetData.filter(bus => {
        const age = window.utils.calculatePreciseAge(bus.registrationDate);
        if (age === null) return false;
        if (bin.max === null) return age >= bin.min;
        return age >= bin.min && age < bin.max;
    });
    
    const classMap = new Map();
    busesInRange.forEach(bus => {
        let className = bus.busClass || "Unknown";
        if (className.includes("SWIFT")) {
            if (className.includes("S/DLX")) className = "SWIFT Super Deluxe";
            else if (className.includes("SFP")) className = "SWIFT Super Fast";
            else if (className.includes("FP")) className = "SWIFT Fast Passenger";
            else className = "SWIFT";
        } else if (className.includes("ORDINARY")) className = "ORDINARY";
        else if (className.includes("SUPER DELUXE")) className = "SUPER DELUXE";
        else if (className.includes("SUPER FAST")) className = "SUPER FAST";
        else if (className.includes("FAST PASSENGER")) className = "FAST PASSENGER";
        else if (className.includes("VOLVO")) className = "VOLVO";
        else if (className.includes("SCANIA")) className = "SCANIA";
        else if (className.includes("ELECTRIC") || className.includes("EV")) className = "ELECTRIC";
        classMap.set(className, (classMap.get(className) || 0) + 1);
    });
    
    const items = Array.from(classMap.entries()).sort((a, b) => b[1] - a[1]);
    showDetailModal(`Buses aged ${ageRange} years`, items, busesInRange.length, "buses");
}

// ==================== AGE GRID UPDATE ====================

function updateAgeGrid(fleetData) {
    const ageGrid = document.getElementById("ageGrid");
    if (!ageGrid) return;
    
    const ageCounts = {};
    window.CONFIG.AGE_BINS.forEach(bin => { ageCounts[bin.label] = 0; });
    
    fleetData.forEach(bus => {
        const age = window.utils.calculatePreciseAge(bus.registrationDate);
        if (age !== null) {
            const bin = window.utils.getAgeBin(age);
            if (bin) ageCounts[bin.label]++;
        }
    });
    
    const maxCount = Math.max(...Object.values(ageCounts));
    let html = '';
    
    window.CONFIG.AGE_BINS.forEach(bin => {
        const count = ageCounts[bin.label];
        const isMax = count === maxCount && maxCount > 0;
        const percentage = fleetData.length > 0 ? ((count / fleetData.length) * 100).toFixed(2) : "0.00";
        html += `
            <div class="age-card ${isMax ? 'highlight' : ''}">
                <div class="age-range">${bin.label} yrs</div>
                <div class="age-count">${count}</div>
                <div class="age-percentage">${percentage}%</div>
            </div>
        `;
    });
    
    ageGrid.innerHTML = html;
}

// ==================== KPI UPDATES ====================

function updateKPIs(fleetData) {
    const total = fleetData.length;
    
    const makeTypes = new Set(fleetData.map(b => b.makeType || "Unknown").filter(m => m !== "Unknown" && m !== "N/A"));
    const classCount = new Set(fleetData.map(b => b.busClass || "Unknown").filter(c => c !== "Unknown")).size;
    const classDetailCount = new Set(fleetData.map(b => b.classDetail || "").filter(cd => cd !== "")).size;
    const districtCount = new Set(fleetData.map(b => b.district || "").filter(d => d !== "")).size;
    const swiftCount = fleetData.filter(b => window.utils.isSwiftBus(b)).length;
    const electricCount = fleetData.filter(b => window.utils.isElectricBus(b)).length;
    const depotCount = new Set(fleetData.map(b => b.depot || "Unknown").filter(d => d !== "Unknown")).size;
    const workshopCount = new Set(fleetData.map(b => b.workshop || "Unknown").filter(w => w !== "Unknown")).size;
    
    document.getElementById("totalFleet").innerText = total.toLocaleString();
    document.getElementById("makeTypeCount").innerText = makeTypes.size;
    document.getElementById("classCount").innerText = classCount;
    document.getElementById("classDetailCount").innerText = classDetailCount;
    document.getElementById("districtCount").innerText = districtCount;
    document.getElementById("swiftCount").innerText = swiftCount.toLocaleString();
    document.getElementById("electricCount").innerText = electricCount.toLocaleString();
    document.getElementById("depotCount").innerText = depotCount;
    document.getElementById("workshopCount").innerText = workshopCount;
}

// ==================== DASHBOARD REFRESH ====================

function refreshDashboard() {
    console.log("Refreshing dashboard with", fleetData.length, "buses");
    updateKPIs(fleetData);
    updateAgeGrid(fleetData);
    
    if (window.charts && fleetData.length > 0) {
        window.charts.updateAllCharts(fleetData);
    }
    
    setupKpiClickHandlers();
    setupAgeDistributionClickHandler();
}

// ==================== EXCEL UPLOAD ====================

function uploadExcel(file) {
    const reader = new FileReader();
    const uploadMsg = document.getElementById("uploadMsg");
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
            
            if (!rows.length) {
                uploadMsg.innerHTML = "<span class='error'>Excel is empty!</span>";
                return;
            }
            
            const newFleet = [];
            for (let row of rows) {
                const bus = window.utils.parseBusFromExcel(row);
                if ((bus.busNo || bus.regNo) && bus.registrationDate) {
                    newFleet.push(bus);
                }
            }
            
            if (newFleet.length === 0) {
                uploadMsg.innerHTML = "<span class='error'>No valid bus entries found. Required: BUSNO/REGNO and Date_of_Reg</span>";
                return;
            }
            
            fleetData = newFleet;
            window.utils.saveFleetData(fleetData);
            uploadMsg.innerHTML = `<span class='success'>✅ Success! ${newFleet.length.toLocaleString()} buses imported. Database updated.</span>`;
            refreshDashboard();
            
            document.getElementById("excelUpload").value = "";
            setTimeout(() => {
                if (uploadMsg.innerHTML.includes('Success')) uploadMsg.innerHTML = '';
            }, 5000);
        } catch (error) {
            console.error("Upload error:", error);
            uploadMsg.innerHTML = "<span class='error'>Error parsing Excel file. Please check format.</span>";
        }
    };
    
    reader.onerror = function() {
        uploadMsg.innerHTML = "<span class='error'>Error reading file.</span>";
    };
    
    reader.readAsArrayBuffer(file);
}

// ==================== CLEAR DATA ====================

function clearAllData() {
    if (confirm("⚠️ Delete entire fleet database? This action cannot be undone.")) {
        fleetData = [];
        window.utils.saveFleetData(fleetData);
        refreshDashboard();
        document.getElementById("uploadMsg").innerHTML = "<span class='success'>Database cleared.</span>";
        
        setTimeout(() => {
            const msg = document.getElementById("uploadMsg");
            if (msg.innerHTML.includes('cleared')) msg.innerHTML = '';
        }, 3000);
    }
}

// ==================== AUTH UI UPDATE ====================

function updateUIByAuth() {
    const loginStatusSpan = document.getElementById("loginStatusSpan");
    const logoutBtn = document.getElementById("logoutBtn");
    const adminZone = document.getElementById("adminZone");
    const usermanagerTabBtn = document.querySelector('.tab-btn[data-tab="usermanager"]');
    
    if (window.auth.isLoggedIn()) {
        const user = window.auth.getCurrentUser();
        loginStatusSpan.innerHTML = `<i class="fas fa-check-circle"></i> ${user.username} (${user.role})`;
        logoutBtn.style.display = "inline-block";
        adminZone.style.display = window.auth.isAdmin() ? "block" : "none";
        
        if (usermanagerTabBtn) {
            usermanagerTabBtn.style.display = window.auth.hasPermission('manageUsers') ? "inline-block" : "none";
        }
    } else {
        loginStatusSpan.innerHTML = `<i class="fas fa-user-circle"></i> Not logged in`;
        logoutBtn.style.display = "none";
        adminZone.style.display = "none";
        if (usermanagerTabBtn) usermanagerTabBtn.style.display = "none";
    }
}

function updateTabVisibilityByRole() {
    const user = window.auth.getCurrentUser();
    const transferTabBtn = document.querySelector('.tab-btn[data-tab="transfer"]');
    const userManagerTabBtn = document.querySelector('.tab-btn[data-tab="usermanager"]');
    
    if (user && user.role === 'viewer') {
        if (transferTabBtn) transferTabBtn.style.display = 'none';
        if (userManagerTabBtn) userManagerTabBtn.style.display = 'none';
    } else {
        if (transferTabBtn) transferTabBtn.style.display = 'inline-block';
        if (userManagerTabBtn && window.auth.hasPermission('manageUsers')) {
            userManagerTabBtn.style.display = 'inline-block';
        } else if (userManagerTabBtn) {
            userManagerTabBtn.style.display = 'none';
        }
    }
}

// ==================== TAB NAVIGATION ====================

function setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const dashboardTab = document.getElementById('dashboardTab');
    const buslistTab = document.getElementById('buslistTab');
    const transferTab = document.getElementById('transferTab');
    const usermanagerTab = document.getElementById('usermanagerTab');
    
    if (!tabBtns.length) return;
    
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            const targetTab = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (dashboardTab) dashboardTab.classList.remove('active');
            if (buslistTab) buslistTab.classList.remove('active');
            if (transferTab) transferTab.classList.remove('active');
            if (usermanagerTab) usermanagerTab.classList.remove('active');
            
            if (targetTab === 'dashboard' && dashboardTab) {
                dashboardTab.classList.add('active');
            } else if (targetTab === 'buslist' && buslistTab) {
                buslistTab.classList.add('active');
                if (window.buslist && fleetData.length > 0) {
                    setTimeout(() => {
                        if (typeof window.buslist.refresh === 'function') {
                            window.buslist.refresh();
                        } else if (typeof window.buslist.init === 'function') {
                            window.buslist.init();
                        }
                    }, 100);
                }
            } else if (targetTab === 'transfer' && transferTab) {
                transferTab.classList.add('active');
                if (window.transfer && fleetData.length > 0) {
                    setTimeout(() => {
                        if (typeof window.transfer.refresh === 'function') {
                            window.transfer.refresh();
                        } else if (typeof window.transfer.init === 'function') {
                            window.transfer.init();
                        }
                    }, 100);
                }
            } else if (targetTab === 'usermanager' && usermanagerTab) {
                usermanagerTab.classList.add('active');
                if (window.usermanager && window.auth.hasPermission('manageUsers')) {
                    setTimeout(() => {
                        if (typeof window.usermanager.refresh === 'function') {
                            window.usermanager.refresh();
                        } else if (typeof window.usermanager.init === 'function') {
                            window.usermanager.init();
                        }
                    }, 100);
                }
            }
        };
    });
}

// ==================== EVENT LISTENERS ====================

function initEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            window.auth.logout();
            updateUIByAuth();
            refreshDashboard();
            // Use base path for redirect
            const basePath = window.basePath || '';
            window.location.href = basePath + 'login.html';
        };
    }
    
    // Detail modal close
    const closeModalBtn = document.getElementById("closeModalBtn");
    const detailModal = document.getElementById("detailModal");
    
    if (closeModalBtn) closeModalBtn.onclick = closeModal;
    if (detailModal) detailModal.onclick = (e) => { if (e.target === detailModal) closeModal(); };
    
    // Admin buttons
    const uploadBtn = document.getElementById("uploadBtn");
    const clearBtn = document.getElementById("clearDataBtn");
    const exportBtn = document.getElementById("exportBtn");
    const fileInput = document.getElementById("excelUpload");
    
    if (uploadBtn) {
        uploadBtn.onclick = () => {
            if (!window.auth.hasPermission('uploadExcel')) {
                document.getElementById("uploadMsg").innerHTML = "<span class='error'>You don't have permission to upload database.</span>";
                return;
            }
            if (fileInput.files.length === 0) {
                document.getElementById("uploadMsg").innerHTML = "<span class='error'>Select an Excel file first.</span>";
                return;
            }
            uploadExcel(fileInput.files[0]);
        };
    }
    
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (!window.auth.hasPermission('clearData')) {
                alert("You don't have permission to clear fleet data.");
                return;
            }
            clearAllData();
        };
    }
    
    if (exportBtn) {
        exportBtn.onclick = () => {
            if (!window.auth.hasPermission('exportData')) {
                alert("You don't have permission to export data.");
                return;
            }
            window.utils.exportToExcel(fleetData);
        };
    }
}

// ==================== INITIALIZATION ====================

function init() {
    console.log("Initializing application...");
    console.log("Base path:", window.basePath);
    
    if (typeof window.CONFIG === 'undefined') {
        console.error("CONFIG not loaded!");
        return;
    }
    
    if (typeof window.utils === 'undefined') {
        console.error("UTILS not loaded!");
        return;
    }
    
    window.auth.loadUsers();
    window.auth.loadSession();
    fleetData = window.utils.loadFleetData();
    console.log("Loaded fleet data:", fleetData.length, "buses");
    
    initEventListeners();
    updateUIByAuth();
    refreshDashboard();
    setupTabNavigation();
    
    // Initialize buslist if there's data
    if (window.buslist && fleetData.length > 0) {
        setTimeout(() => {
            if (typeof window.buslist.init === 'function') {
                console.log("Initializing buslist...");
                window.buslist.init();
            }
        }, 200);
    }
    
    // Initialize transfer module if there's data
    if (window.transfer && fleetData.length > 0) {
        setTimeout(() => {
            if (typeof window.transfer.init === 'function') {
                console.log("Initializing transfer module...");
                window.transfer.init();
            }
        }, 300);
    }
    
    // Initialize user management if admin and data loaded
    if (window.usermanager && window.auth.hasPermission('manageUsers')) {
        setTimeout(() => {
            if (typeof window.usermanager.init === 'function') {
                console.log("Initializing user management...");
                window.usermanager.init();
            }
        }, 400);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}