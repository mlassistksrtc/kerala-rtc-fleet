// ==================== TRANSFER & ADDITION MODULE ====================

let selectedBusForTransfer = null;
let selectedBusForEdit = null;
let transferHistory = [];
let depotWorkshopDistrictMap = new Map();

// ==================== TRANSFER HISTORY FUNCTIONS ====================

// Load transfer history from localStorage
function loadTransferHistory() {
    const stored = localStorage.getItem(window.CONFIG.STORAGE_KEYS.TRANSFER_HISTORY);
    if (stored) {
        try {
            transferHistory = JSON.parse(stored);
        } catch (e) {
            transferHistory = [];
        }
    } else {
        transferHistory = [];
    }
    return transferHistory;
}

// Save transfer history to localStorage
function saveTransferHistory() {
    localStorage.setItem(window.CONFIG.STORAGE_KEYS.TRANSFER_HISTORY, JSON.stringify(transferHistory));
}

// Add transfer record
function addTransferRecord(busNo, fromDepot, toDepot, fromWorkshop, toWorkshop, transferredBy) {
    const record = {
        id: Date.now(),
        dateTime: new Date().toLocaleString(),
        busNo: busNo,
        fromDepot: fromDepot,
        toDepot: toDepot,
        fromWorkshop: fromWorkshop,
        toWorkshop: toWorkshop,
        transferredBy: transferredBy
    };
    transferHistory.unshift(record);
    saveTransferHistory();
    return record;
}

// Render transfer history table
function renderTransferHistory() {
    const tbody = document.getElementById("transferHistoryBody");
    if (!tbody) return;
    
    if (transferHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No transfer history available</td></tr>';
        return;
    }
    
    tbody.innerHTML = "";
    transferHistory.slice(0, 100).forEach(record => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = record.dateTime;
        row.insertCell(1).innerText = record.busNo;
        row.insertCell(2).innerText = record.fromDepot;
        row.insertCell(3).innerText = record.toDepot;
        row.insertCell(4).innerText = record.fromWorkshop;
        row.insertCell(5).innerText = record.toWorkshop;
        row.insertCell(6).innerText = record.transferredBy;
    });
}

// Clear transfer history (admin only)
function clearTransferHistory() {
    const currentUser = JSON.parse(localStorage.getItem("rtcCurrentUser") || "{}");
    if (currentUser.role !== "admin") {
        alert("Only admin can clear transfer history!");
        return;
    }
    
    if (confirm("⚠️ Delete all transfer history? This action cannot be undone.")) {
        transferHistory = [];
        saveTransferHistory();
        renderTransferHistory();
        alert("Transfer history cleared successfully!");
        
        // Add activity log
        if (window.auth && window.auth.addActivityLog) {
            window.auth.addActivityLog(currentUser.id, currentUser.username, "TRANSFER_HISTORY_CLEAR", "Transfer history cleared by admin");
        }
    }
}

// ==================== DEPOT-WORKSHOP-DISTRICT MAPPING ====================

// Build mapping from depot to its most common workshop and district
function buildDepotWorkshopDistrictMap() {
    if (typeof fleetData === 'undefined' || !fleetData || fleetData.length === 0) return;
    
    const depotData = new Map();
    
    fleetData.forEach(bus => {
        const depot = bus.depot;
        if (depot && depot !== "Unknown" && depot !== "") {
            if (!depotData.has(depot)) {
                depotData.set(depot, {
                    workshopCount: new Map(),
                    districtCount: new Map()
                });
            }
            const data = depotData.get(depot);
            
            if (bus.workshop && bus.workshop !== "Unknown" && bus.workshop !== "") {
                data.workshopCount.set(bus.workshop, (data.workshopCount.get(bus.workshop) || 0) + 1);
            }
            
            if (bus.district && bus.district !== "" && bus.district !== "Unknown") {
                data.districtCount.set(bus.district, (data.districtCount.get(bus.district) || 0) + 1);
            }
        }
    });
    
    // Also add manual mapping for common depots if needed
    const manualMappings = {
        // Add any manual mappings here if needed
        // Example: "TRIVANDRUM": { workshop: "TRIVANDRUM WORKSHOP", district: "THIRUVANANTHAPURAM" }
    };
    
    depotData.forEach((data, depot) => {
        let mostCommonWorkshop = "";
        let maxWorkshopCount = 0;
        data.workshopCount.forEach((count, workshop) => {
            if (count > maxWorkshopCount) {
                maxWorkshopCount = count;
                mostCommonWorkshop = workshop;
            }
        });
        
        let mostCommonDistrict = "";
        let maxDistrictCount = 0;
        data.districtCount.forEach((count, district) => {
            if (count > maxDistrictCount) {
                maxDistrictCount = count;
                mostCommonDistrict = district;
            }
        });
        
        depotWorkshopDistrictMap.set(depot, {
            workshop: mostCommonWorkshop,
            district: mostCommonDistrict
        });
    });
    
    // Apply manual mappings if they exist
    for (const [depot, mapping] of Object.entries(manualMappings)) {
        depotWorkshopDistrictMap.set(depot, mapping);
    }
    
    console.log("Depot mapping built. Total depots mapped:", depotWorkshopDistrictMap.size);
}

// Get workshop for a depot
function getWorkshopForDepot(depot) {
    const mapping = depotWorkshopDistrictMap.get(depot);
    if (mapping && mapping.workshop) {
        return mapping.workshop;
    }
    
    // Fallback: try to find any bus with this depot to get its workshop
    if (typeof fleetData !== 'undefined' && fleetData) {
        const busWithDepot = fleetData.find(b => b.depot === depot && b.workshop && b.workshop !== "Unknown");
        if (busWithDepot && busWithDepot.workshop) {
            return busWithDepot.workshop;
        }
    }
    
    return "Unknown";
}

// Get district for a depot
function getDistrictForDepot(depot) {
    const mapping = depotWorkshopDistrictMap.get(depot);
    if (mapping && mapping.district) {
        return mapping.district;
    }
    
    // Fallback: try to find any bus with this depot to get its district
    if (typeof fleetData !== 'undefined' && fleetData) {
        const busWithDepot = fleetData.find(b => b.depot === depot && b.district && b.district !== "");
        if (busWithDepot && busWithDepot.district) {
            return busWithDepot.district;
        }
    }
    
    return "";
}

// ==================== DROPDOWN POPULATION ====================

// Populate all dropdowns from database
function populateDropdowns() {
    if (typeof fleetData === 'undefined' || !fleetData) return;
    
    function safeStr(val) {
        if (val === null || val === undefined) return "";
        return String(val);
    }
    
    const makeTypes = [...new Set(fleetData.map(b => safeStr(b.makeType)).filter(m => m !== "Unknown" && m !== "N/A" && m !== ""))].sort();
    const classes = [...new Set(fleetData.map(b => safeStr(b.busClass)).filter(c => c !== "Unknown" && c !== ""))].sort();
    const classDetails = [...new Set(fleetData.map(b => safeStr(b.classDetail)).filter(cd => cd !== ""))].sort();
    const depots = [...new Set(fleetData.map(b => safeStr(b.depot)).filter(d => d !== "Unknown" && d !== ""))].sort();
    
    // Add Bus Form dropdowns
    const newMakeType = document.getElementById("newMakeType");
    const newClass = document.getElementById("newClass");
    const newClassDetail = document.getElementById("newClassDetail");
    const newDepot = document.getElementById("newDepot");
    const newWorkshop = document.getElementById("newWorkshop");
    
    if (newMakeType) newMakeType.innerHTML = '<option value="">Select Make & Type</option>' + makeTypes.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
    if (newClass) newClass.innerHTML = '<option value="">Select Class</option>' + classes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if (newClassDetail) newClassDetail.innerHTML = '<option value="">Select Class Detail</option>' + classDetails.map(cd => `<option value="${escapeHtml(cd)}">${escapeHtml(cd)}</option>`).join('');
    if (newDepot) newDepot.innerHTML = '<option value="">Select Depot</option>' + depots.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    
    // Transfer dropdowns
    const transferDepot = document.getElementById("transferDepot");
    if (transferDepot) transferDepot.innerHTML = '<option value="">Select Depot</option>' + depots.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    
    // Edit Bus Form dropdowns
    const editMakeType = document.getElementById("editMakeType");
    const editClass = document.getElementById("editClass");
    const editClassDetail = document.getElementById("editClassDetail");
    const editDepot = document.getElementById("editDepot");
    const editWorkshop = document.getElementById("editWorkshop");
    
    if (editMakeType) editMakeType.innerHTML = '<option value="">Select Make & Type</option>' + makeTypes.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
    if (editClass) editClass.innerHTML = '<option value="">Select Class</option>' + classes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if (editClassDetail) editClassDetail.innerHTML = '<option value="">Select Class Detail</option>' + classDetails.map(cd => `<option value="${escapeHtml(cd)}">${escapeHtml(cd)}</option>`).join('');
    if (editDepot) editDepot.innerHTML = '<option value="">Select Depot</option>' + depots.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    
    // Update workshop dropdown based on depot selection
    if (newDepot) {
        newDepot.onchange = function() {
            updateWorkshopAndDistrict(this.value, newWorkshop, "newDistrict");
        };
    }
    if (editDepot) {
        editDepot.onchange = function() {
            updateWorkshopAndDistrict(this.value, editWorkshop, "editDistrict");
        };
    }
}

// Update workshop dropdown and district based on depot selection
function updateWorkshopAndDistrict(depot, workshopSelect, districtId) {
    if (!depot) {
        if (workshopSelect) workshopSelect.innerHTML = '<option value="">Select Workshop</option>';
        document.getElementById(districtId).value = "";
        return;
    }
    
    // Get workshops for this depot from fleet data
    const workshopsForDepot = [...new Set(fleetData.filter(b => b.depot === depot).map(b => b.workshop).filter(w => w && w !== "Unknown"))].sort();
    
    if (workshopSelect) {
        workshopSelect.innerHTML = '<option value="">Select Workshop</option>' + workshopsForDepot.map(w => `<option value="${escapeHtml(w)}">${escapeHtml(w)}</option>`).join('');
    }
    
    // Auto-fill district based on depot
    const district = getDistrictForDepot(depot);
    if (district) {
        document.getElementById(districtId).value = district;
    }
}

// ==================== BUS TRANSFER FUNCTIONS ====================

// Setup live search for buses (Transfer)
function setupBusSearch() {
    const searchInput = document.getElementById("busSearchInput");
    const resultsContainer = document.getElementById("busSearchResults");
    
    if (!searchInput) return;
    
    searchInput.addEventListener("input", function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm.length < 2) {
            resultsContainer.classList.remove("show");
            return;
        }
        
        const matches = fleetData.filter(bus => 
            bus.busNo && String(bus.busNo).toLowerCase().includes(searchTerm)
        ).slice(0, 10);
        
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">No buses found</div>';
            resultsContainer.classList.add("show");
            return;
        }
        
        resultsContainer.innerHTML = matches.map(bus => `
            <div class="search-result-item" data-busno="${escapeHtml(String(bus.busNo))}">
                <span class="bus-no">${escapeHtml(String(bus.busNo))}</span>
                <span class="reg-no">${escapeHtml(String(bus.regNo || ''))}</span>
            </div>
        `).join('');
        resultsContainer.classList.add("show");
        
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const busNo = item.getAttribute('data-busno');
                searchInput.value = busNo;
                resultsContainer.classList.remove("show");
                selectBusForTransfer(busNo);
            });
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.remove("show");
        }
    });
}

// Select bus for transfer
function selectBusForTransfer(busNo) {
    const bus = fleetData.find(b => String(b.busNo) === busNo);
    if (!bus) return;
    
    selectedBusForTransfer = bus;
    
    document.getElementById("detailBusNo").innerText = String(bus.busNo || "-");
    document.getElementById("detailRegNo").innerText = String(bus.regNo || "-");
    document.getElementById("detailRegDate").innerText = window.utils.formatDateToDDMMYYYY(bus.registrationDate) || "-";
    document.getElementById("detailAge").innerText = window.utils.calculatePreciseAge(bus.registrationDate)?.toFixed(2) + " yrs" || "-";
    document.getElementById("detailMakeType").innerText = String(bus.makeType || "-");
    document.getElementById("detailClass").innerText = String(bus.busClass || "-");
    document.getElementById("detailClassDetail").innerText = String(bus.classDetail || "-");
    document.getElementById("detailCurrentDepot").innerText = String(bus.depot || "-");
    document.getElementById("detailCurrentWorkshop").innerText = String(bus.workshop || "-");
    document.getElementById("detailDistrict").innerText = String(bus.district || "-");
    document.getElementById("detailEngineNo").innerText = String(bus.engineNo || "-");
    document.getElementById("detailChassisNo").innerText = String(bus.chassisNo || "-");
    
    document.getElementById("selectedBusDetails").style.display = "block";
    document.getElementById("transferOptions").style.display = "block";
    
    const transferDepot = document.getElementById("transferDepot");
    const transferWorkshop = document.getElementById("transferWorkshop");
    if (transferDepot) transferDepot.value = "";
    if (transferWorkshop) transferWorkshop.value = "";
    
    const confirmBtn = document.getElementById("confirmTransferBtn");
    if (confirmBtn) confirmBtn.disabled = true;
    
    if (transferDepot) {
        transferDepot.onchange = () => {
            if (transferDepot.value) {
                // Auto-select workshop based on depot selection
                const selectedDepot = transferDepot.value;
                const autoWorkshop = getWorkshopForDepot(selectedDepot);
                const autoDistrict = getDistrictForDepot(selectedDepot);
                
                if (transferWorkshop && autoWorkshop) {
                    // Populate workshop dropdown first
                    updateWorkshopDropdownForTransfer(selectedDepot);
                    // Then select the auto-detected workshop
                    setTimeout(() => {
                        if (transferWorkshop.querySelector(`option[value="${autoWorkshop}"]`)) {
                            transferWorkshop.value = autoWorkshop;
                        }
                    }, 50);
                }
                
                // Show auto-detected info
                if (autoWorkshop && autoWorkshop !== "Unknown") {
                    showTransferMessage(`Auto-detected: Workshop - ${autoWorkshop} | District - ${autoDistrict || "Auto-detected"}`, "info");
                }
                
                if (transferWorkshop && transferWorkshop.value) {
                    confirmBtn.disabled = false;
                } else {
                    confirmBtn.disabled = true;
                }
            } else {
                confirmBtn.disabled = true;
            }
        };
    }
    
    if (transferWorkshop) {
        transferWorkshop.onchange = () => {
            if (transferDepot && transferDepot.value && transferWorkshop.value) {
                confirmBtn.disabled = false;
            } else {
                confirmBtn.disabled = true;
            }
        };
    }
}

// Update workshop dropdown for transfer based on depot
function updateWorkshopDropdownForTransfer(depot) {
    const transferWorkshop = document.getElementById("transferWorkshop");
    if (!transferWorkshop) return;
    
    if (!depot) {
        transferWorkshop.innerHTML = '<option value="">Select Workshop</option>';
        return;
    }
    
    const workshopsForDepot = [...new Set(fleetData.filter(b => b.depot === depot).map(b => b.workshop).filter(w => w && w !== "Unknown"))].sort();
    transferWorkshop.innerHTML = '<option value="">Select Workshop</option>' + workshopsForDepot.map(w => `<option value="${escapeHtml(w)}">${escapeHtml(w)}</option>`).join('');
    
    // Auto-select if only one workshop
    if (workshopsForDepot.length === 1) {
        transferWorkshop.value = workshopsForDepot[0];
    }
}

// Show temporary message
function showTransferMessage(message, type) {
    const msgDiv = document.getElementById("uploadMsg");
    if (!msgDiv) return;
    
    msgDiv.innerHTML = `<span class="${type}">${message}</span>`;
    msgDiv.style.display = "block";
    
    setTimeout(() => {
        msgDiv.style.display = "none";
    }, 3000);
}

// Confirm and execute transfer with auto allocation
function confirmTransfer() {
    if (!selectedBusForTransfer) {
        alert("Please select a bus first.");
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem("rtcCurrentUser") || "{}");
    const isAdmin = currentUser.role === "admin";
    const isSupervisor = currentUser.role === "supervisor";
    
    if (!isAdmin && !isSupervisor) {
        alert("Only Admin and Supervisor can perform bus transfers!");
        return;
    }
    
    const newDepot = document.getElementById("transferDepot").value;
    let newWorkshop = document.getElementById("transferWorkshop").value;
    
    if (!newDepot) {
        alert("Please select a depot for transfer.");
        return;
    }
    
    // Auto-select workshop if not manually selected
    if (!newWorkshop) {
        newWorkshop = getWorkshopForDepot(newDepot);
        if (newWorkshop === "Unknown") {
            alert("Please select a workshop for the new depot.");
            return;
        }
    }
    
    const oldDepot = selectedBusForTransfer.depot;
    const oldWorkshop = selectedBusForTransfer.workshop;
    
    if (oldDepot === newDepot && oldWorkshop === newWorkshop) {
        alert("Bus is already at the selected depot and workshop. No changes made.");
        return;
    }
    
    // Auto-get district for new depot
    const newDistrict = getDistrictForDepot(newDepot);
    
    const message = `Confirm Transfer:\n\n` +
        `Bus No: ${selectedBusForTransfer.busNo}\n` +
        `From: ${oldDepot} / ${oldWorkshop}\n` +
        `To: ${newDepot} / ${newWorkshop}\n` +
        `New District: ${newDistrict || "Auto-detected"}\n\n` +
        `Proceed with transfer?`;
    
    if (confirm(message)) {
        // Update bus details
        selectedBusForTransfer.depot = newDepot;
        selectedBusForTransfer.workshop = newWorkshop;
        if (newDistrict) {
            selectedBusForTransfer.district = newDistrict;
        }
        
        // Save to localStorage
        window.utils.saveFleetData(fleetData);
        
        // Add transfer record
        addTransferRecord(
            selectedBusForTransfer.busNo,
            oldDepot,
            newDepot,
            oldWorkshop,
            newWorkshop,
            currentUser ? currentUser.username : "system"
        );
        
        // Refresh all views
        renderTransferHistory();
        
        if (typeof refreshDashboard === 'function') {
            refreshDashboard();
        }
        
        if (window.buslist && typeof window.buslist.refresh === 'function') {
            window.buslist.refresh();
        }
        
        // Update displayed details
        document.getElementById("detailCurrentDepot").innerText = newDepot;
        document.getElementById("detailCurrentWorkshop").innerText = newWorkshop;
        if (newDistrict) {
            document.getElementById("detailDistrict").innerText = newDistrict;
        }
        
        // Add activity log
        if (window.auth && window.auth.addActivityLog) {
            window.auth.addActivityLog(
                currentUser.id, 
                currentUser.username, 
                "BUS_TRANSFER", 
                `Bus ${selectedBusForTransfer.busNo} transferred from ${oldDepot}/${oldWorkshop} to ${newDepot}/${newWorkshop}`
            );
        }
        
        alert(`✅ Transfer successful!\nBus ${selectedBusForTransfer.busNo} moved to ${newDepot} / ${newWorkshop}\nDistrict: ${newDistrict || "Auto-detected"}`);
        
        document.getElementById("confirmTransferBtn").disabled = true;
        
        // Rebuild mapping after transfer
        setTimeout(() => {
            buildDepotWorkshopDistrictMap();
            populateDropdowns();
        }, 100);
    }
}

// ==================== CANCEL TRANSFER FUNCTION ====================

function cancelTransfer() {
    selectedBusForTransfer = null;
    
    const selectedBusDetails = document.getElementById("selectedBusDetails");
    const transferOptions = document.getElementById("transferOptions");
    const busSearchInput = document.getElementById("busSearchInput");
    
    if (selectedBusDetails) selectedBusDetails.style.display = "none";
    if (transferOptions) transferOptions.style.display = "none";
    if (busSearchInput) busSearchInput.value = "";
    
    const transferDepot = document.getElementById("transferDepot");
    const transferWorkshop = document.getElementById("transferWorkshop");
    if (transferDepot) transferDepot.value = "";
    if (transferWorkshop) transferWorkshop.value = "";
    
    const confirmBtn = document.getElementById("confirmTransferBtn");
    if (confirmBtn) confirmBtn.disabled = true;
    
    const uploadMsg = document.getElementById("uploadMsg");
    if (uploadMsg) {
        uploadMsg.innerHTML = "<span class='success'>Transfer cancelled. You can select another bus.</span>";
        setTimeout(() => {
            if (uploadMsg.innerHTML.includes('Transfer cancelled')) {
                uploadMsg.innerHTML = '';
            }
        }, 3000);
    }
}

// ==================== ADD NEW BUS FUNCTIONS ====================

function addNewBus() {
    const currentUser = JSON.parse(localStorage.getItem("rtcCurrentUser") || "{}");
    const isAdmin = currentUser.role === "admin";
    const isSupervisor = currentUser.role === "supervisor";
    
    if (!isAdmin && !isSupervisor) {
        alert("Only Admin and Supervisor can add new buses!");
        return;
    }
    
    const busNo = document.getElementById("newBusNo").value.trim();
    const regNo = document.getElementById("newRegNo").value.trim();
    const regDateStr = document.getElementById("newRegDate").value;
    const makeType = document.getElementById("newMakeType").value;
    const busClass = document.getElementById("newClass").value;
    const classDetail = document.getElementById("newClassDetail").value;
    const depot = document.getElementById("newDepot").value;
    let workshop = document.getElementById("newWorkshop").value;
    const engineNo = document.getElementById("newEngineNo").value.trim();
    const chassisNo = document.getElementById("newChassisNo").value.trim();
    
    if (!busNo || !regNo || !regDateStr || !makeType || !busClass || !depot) {
        showAddBusMessage("Please fill all required fields (*)", "error");
        return;
    }
    
    if (fleetData.some(b => String(b.busNo) === busNo)) {
        showAddBusMessage(`Bus number "${busNo}" already exists!`, "error");
        return;
    }
    
    if (fleetData.some(b => String(b.regNo) === regNo)) {
        showAddBusMessage(`Registration number "${regNo}" already exists!`, "error");
        return;
    }
    
    // Auto-select workshop if not provided
    if (!workshop) {
        workshop = getWorkshopForDepot(depot);
    }
    
    // Auto-get district for depot
    const district = getDistrictForDepot(depot);
    
    const newBus = {
        busNo: busNo,
        regNo: regNo,
        registrationDate: regDateStr,
        makeType: makeType,
        busClass: busClass,
        classDetail: classDetail || "",
        depot: depot,
        workshop: workshop || "Unknown",
        district: district || "",
        engineNo: engineNo || "",
        chassisNo: chassisNo || ""
    };
    
    fleetData.push(newBus);
    window.utils.saveFleetData(fleetData);
    
    if (typeof refreshDashboard === 'function') {
        refreshDashboard();
    }
    if (window.buslist && typeof window.buslist.refresh === 'function') {
        window.buslist.refresh();
    }
    populateDropdowns();
    buildDepotWorkshopDistrictMap();
    
    resetAddBusForm();
    
    showAddBusMessage(`✅ Bus ${busNo} added successfully! District: ${district || "Auto-detected"}`, "success");
    
    // Add activity log
    if (window.auth && window.auth.addActivityLog) {
        window.auth.addActivityLog(
            currentUser.id, 
            currentUser.username, 
            "BUS_ADD", 
            `New bus ${busNo} added to ${depot}`
        );
    }
}

function resetAddBusForm() {
    document.getElementById("newBusNo").value = "";
    document.getElementById("newRegNo").value = "";
    document.getElementById("newRegDate").value = "";
    document.getElementById("newMakeType").value = "";
    document.getElementById("newClass").value = "";
    document.getElementById("newClassDetail").value = "";
    document.getElementById("newDepot").value = "";
    const newWorkshop = document.getElementById("newWorkshop");
    if (newWorkshop) newWorkshop.innerHTML = '<option value="">Select Workshop</option>';
    document.getElementById("newDistrict").value = "";
    document.getElementById("newEngineNo").value = "";
    document.getElementById("newChassisNo").value = "";
    document.getElementById("addBusMessage").style.display = "none";
}

function showAddBusMessage(message, type) {
    const msgDiv = document.getElementById("addBusMessage");
    msgDiv.textContent = message;
    msgDiv.className = `form-message ${type}`;
    msgDiv.style.display = "block";
    
    setTimeout(() => {
        msgDiv.style.display = "none";
    }, 5000);
}

// ==================== EDIT BUS FUNCTIONS ====================

// Setup edit bus search
function setupEditBusSearch() {
    const searchInput = document.getElementById("editBusSearchInput");
    const resultsContainer = document.getElementById("editBusSearchResults");
    
    if (!searchInput) return;
    
    searchInput.addEventListener("input", function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm.length < 2) {
            resultsContainer.classList.remove("show");
            const editContainer = document.getElementById("editBusFormContainer");
            if (editContainer) editContainer.style.display = "none";
            return;
        }
        
        const matches = fleetData.filter(bus => 
            bus.busNo && String(bus.busNo).toLowerCase().includes(searchTerm)
        ).slice(0, 10);
        
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">No buses found</div>';
            resultsContainer.classList.add("show");
            return;
        }
        
        resultsContainer.innerHTML = matches.map(bus => `
            <div class="search-result-item" data-busno="${escapeHtml(String(bus.busNo))}">
                <span class="bus-no">${escapeHtml(String(bus.busNo))}</span>
                <span class="reg-no">${escapeHtml(String(bus.regNo || ''))}</span>
            </div>
        `).join('');
        resultsContainer.classList.add("show");
        
        resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const busNo = item.getAttribute('data-busno');
                searchInput.value = busNo;
                resultsContainer.classList.remove("show");
                loadBusForEdit(busNo);
            });
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.remove("show");
        }
    });
}

// Load bus data into edit form
function loadBusForEdit(busNo) {
    const bus = fleetData.find(b => String(b.busNo) === busNo);
    if (!bus) return;
    
    selectedBusForEdit = bus;
    
    document.getElementById("editBusNo").value = bus.busNo;
    document.getElementById("editRegNo").value = bus.regNo;
    document.getElementById("editRegDate").value = bus.registrationDate;
    document.getElementById("editMakeType").value = bus.makeType;
    document.getElementById("editClass").value = bus.busClass;
    document.getElementById("editClassDetail").value = bus.classDetail;
    document.getElementById("editDepot").value = bus.depot;
    document.getElementById("editWorkshop").value = bus.workshop;
    document.getElementById("editDistrict").value = bus.district;
    document.getElementById("editEngineNo").value = bus.engineNo;
    document.getElementById("editChassisNo").value = bus.chassisNo;
    
    updateWorkshopForEdit(bus.depot);
    
    const editContainer = document.getElementById("editBusFormContainer");
    if (editContainer) editContainer.style.display = "block";
}

// Update workshop dropdown for edit based on depot
function updateWorkshopForEdit(depot) {
    const editWorkshop = document.getElementById("editWorkshop");
    if (!editWorkshop) return;
    
    if (!depot) {
        editWorkshop.innerHTML = '<option value="">Select Workshop</option>';
        return;
    }
    
    const workshopsForDepot = [...new Set(fleetData.filter(b => b.depot === depot).map(b => b.workshop).filter(w => w && w !== "Unknown"))].sort();
    editWorkshop.innerHTML = '<option value="">Select Workshop</option>' + workshopsForDepot.map(w => `<option value="${escapeHtml(w)}">${escapeHtml(w)}</option>`).join('');
    if (selectedBusForEdit && selectedBusForEdit.workshop) {
        editWorkshop.value = selectedBusForEdit.workshop;
    }
}

// Save edited bus details
function saveBusEdit() {
    if (!selectedBusForEdit) {
        alert("No bus selected for editing.");
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem("rtcCurrentUser") || "{}");
    const isAdmin = currentUser.role === "admin";
    const isSupervisor = currentUser.role === "supervisor";
    
    if (!isAdmin && !isSupervisor) {
        alert("Only Admin and Supervisor can edit bus details!");
        return;
    }
    
    const busNo = document.getElementById("editBusNo").value.trim();
    const regNo = document.getElementById("editRegNo").value.trim();
    const regDate = document.getElementById("editRegDate").value;
    const makeType = document.getElementById("editMakeType").value;
    const busClass = document.getElementById("editClass").value;
    const classDetail = document.getElementById("editClassDetail").value;
    const depot = document.getElementById("editDepot").value;
    let workshop = document.getElementById("editWorkshop").value;
    const engineNo = document.getElementById("editEngineNo").value.trim();
    const chassisNo = document.getElementById("editChassisNo").value.trim();
    
    if (!busNo || !regNo || !regDate || !makeType || !busClass || !depot) {
        showEditBusMessage("Please fill all required fields (*)", "error");
        return;
    }
    
    if (busNo !== selectedBusForEdit.busNo && fleetData.some(b => String(b.busNo) === busNo)) {
        showEditBusMessage(`Bus number "${busNo}" already exists!`, "error");
        return;
    }
    
    if (regNo !== selectedBusForEdit.regNo && fleetData.some(b => String(b.regNo) === regNo)) {
        showEditBusMessage(`Registration number "${regNo}" already exists!`, "error");
        return;
    }
    
    // Auto-select workshop if changed depot
    if (depot !== selectedBusForEdit.depot && !workshop) {
        workshop = getWorkshopForDepot(depot);
    }
    
    // Auto-get district if depot changed
    let district = document.getElementById("editDistrict").value;
    if (depot !== selectedBusForEdit.depot) {
        district = getDistrictForDepot(depot);
    }
    
    selectedBusForEdit.busNo = busNo;
    selectedBusForEdit.regNo = regNo;
    selectedBusForEdit.registrationDate = regDate;
    selectedBusForEdit.makeType = makeType;
    selectedBusForEdit.busClass = busClass;
    selectedBusForEdit.classDetail = classDetail;
    selectedBusForEdit.depot = depot;
    selectedBusForEdit.workshop = workshop || "Unknown";
    selectedBusForEdit.district = district || "";
    selectedBusForEdit.engineNo = engineNo;
    selectedBusForEdit.chassisNo = chassisNo;
    
    window.utils.saveFleetData(fleetData);
    
    if (typeof refreshDashboard === 'function') {
        refreshDashboard();
    }
    if (window.buslist && typeof window.buslist.refresh === 'function') {
        window.buslist.refresh();
    }
    populateDropdowns();
    buildDepotWorkshopDistrictMap();
    
    document.getElementById("editBusSearchInput").value = "";
    const editContainer = document.getElementById("editBusFormContainer");
    if (editContainer) editContainer.style.display = "none";
    selectedBusForEdit = null;
    
    showEditBusMessage(`✅ Bus ${busNo} updated successfully!`, "success");
    
    // Add activity log
    if (window.auth && window.auth.addActivityLog) {
        window.auth.addActivityLog(
            currentUser.id, 
            currentUser.username, 
            "BUS_EDIT", 
            `Bus ${busNo} details edited by ${currentUser.username}`
        );
    }
    
    setTimeout(() => {
        const msgDiv = document.getElementById("editBusMessage");
        if (msgDiv) msgDiv.style.display = "none";
    }, 3000);
}

// Cancel edit
function cancelEdit() {
    document.getElementById("editBusSearchInput").value = "";
    const editContainer = document.getElementById("editBusFormContainer");
    if (editContainer) editContainer.style.display = "none";
    selectedBusForEdit = null;
    const msgDiv = document.getElementById("editBusMessage");
    if (msgDiv) msgDiv.style.display = "none";
}

// Show edit bus message
function showEditBusMessage(message, type) {
    const msgDiv = document.getElementById("editBusMessage");
    if (!msgDiv) return;
    msgDiv.textContent = message;
    msgDiv.className = `form-message ${type}`;
    msgDiv.style.display = "block";
    
    setTimeout(() => {
        if (msgDiv) msgDiv.style.display = "none";
    }, 5000);
}

// ==================== INITIALIZATION & EVENT LISTENERS ====================

function initTransferModule() {
    console.log("Initializing transfer module...");
    
    loadTransferHistory();
    renderTransferHistory();
    buildDepotWorkshopDistrictMap();
    populateDropdowns();
    setupTransferEventListeners();
}

function setupTransferEventListeners() {
    const confirmBtn = document.getElementById("confirmTransferBtn");
    const cancelTransferBtn = document.getElementById("cancelTransferBtn");
    const addBusBtn = document.getElementById("addBusBtn");
    const resetFormBtn = document.getElementById("resetFormBtn");
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    const saveEditBtn = document.getElementById("saveEditBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    
    if (confirmBtn) confirmBtn.onclick = confirmTransfer;
    if (cancelTransferBtn) cancelTransferBtn.onclick = cancelTransfer;
    if (addBusBtn) addBusBtn.onclick = addNewBus;
    if (resetFormBtn) resetFormBtn.onclick = resetAddBusForm;
    if (clearHistoryBtn) clearHistoryBtn.onclick = clearTransferHistory;
    if (saveEditBtn) saveEditBtn.onclick = saveBusEdit;
    if (cancelEditBtn) cancelEditBtn.onclick = cancelEdit;
    
    setupBusSearch();
    setupEditBusSearch();
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize transfer module globally
window.transfer = {
    init: function() {
        if (typeof fleetData !== 'undefined' && fleetData && fleetData.length > 0) {
            initTransferModule();
        } else {
            console.log("Waiting for fleet data to load...");
            setTimeout(() => {
                if (typeof fleetData !== 'undefined' && fleetData && fleetData.length > 0) {
                    initTransferModule();
                }
            }, 500);
        }
    },
    refresh: function() {
        if (typeof fleetData !== 'undefined' && fleetData) {
            buildDepotWorkshopDistrictMap();
            populateDropdowns();
            renderTransferHistory();
        }
    }
};