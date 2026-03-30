// ==================== BUS LIST MODULE ====================

let filteredBuses = [];
let currentPage = 1;
const rowsPerPage = 100;
let currentSort = { column: 'slno', direction: 'asc' };

// Filter state for multi-select
let filterState = {
    makeType: [],
    busClass: [],
    depot: [],
    workshop: [],
    district: [],
    classDetail: []
};

// Helper function to safely convert to string for searching
function safeToString(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}

// Initialize bus list when fleet data is available
function initBusList() {
    console.log("Initializing bus list...");
    
    if (typeof fleetData === 'undefined' || !fleetData || fleetData.length === 0) {
        const tbody = document.getElementById("fullBusTableBody");
        if (tbody) {
            tbody.innerHTML = '春节<td colspan="13">No data available. Please upload Excel file in Dashboard.春节</div>';
        }
        return;
    }
    
    console.log(`Bus list init with ${fleetData.length} buses`);
    updateFilterOptions();
    setupMultiSelects();
    applyFiltersAndRender();
    attachEventListeners();
    setupCollapsibleFilter();
}

// Update filter dropdown options based on fleet data
function updateFilterOptions() {
    if (typeof fleetData === 'undefined' || !fleetData) return;
    
    try {
        // Get unique values for each filter
        const makeTypes = [...new Set(fleetData.map(b => safeToString(b.makeType)).filter(m => m !== "Unknown" && m !== "N/A" && m !== ""))].sort();
        const classes = [...new Set(fleetData.map(b => safeToString(b.busClass)).filter(c => c !== "Unknown" && c !== ""))].sort();
        const depots = [...new Set(fleetData.map(b => safeToString(b.depot)).filter(d => d !== "Unknown" && d !== ""))].sort();
        const workshops = [...new Set(fleetData.map(b => safeToString(b.workshop)).filter(w => w !== "Unknown" && w !== ""))].sort();
        const districts = [...new Set(fleetData.map(b => safeToString(b.district)).filter(d => d !== ""))].sort();
        const classDetails = [...new Set(fleetData.map(b => safeToString(b.classDetail)).filter(cd => cd !== ""))].sort();
        
        // Populate multi-select containers
        populateMultiSelect("makeType", makeTypes);
        populateMultiSelect("busClass", classes);
        populateMultiSelect("depot", depots);
        populateMultiSelect("workshop", workshops);
        populateMultiSelect("district", districts);
        populateMultiSelect("classDetail", classDetails);
    } catch (error) {
        console.error("Error updating filter options:", error);
    }
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">All</option>';
    options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
    });
    if (currentValue && options.includes(currentValue)) {
        select.value = currentValue;
    }
}

function populateMultiSelect(filterId, options) {
    const container = document.getElementById(`multi-select-${filterId}`);
    if (!container) return;
    
    const dropdown = container.querySelector('.multi-select-dropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = `
        <div class="dropdown-header">
            <button class="select-all-btn">Select All</button>
            <button class="clear-all-btn">Clear All</button>
        </div>
    `;
    
    options.forEach(opt => {
        const isChecked = filterState[filterId].includes(opt);
        const div = document.createElement('div');
        div.className = 'dropdown-option';
        div.innerHTML = `
            <input type="checkbox" value="${escapeHtml(opt)}" ${isChecked ? 'checked' : ''}>
            <label>${escapeHtml(opt)}</label>
        `;
        dropdown.appendChild(div);
    });
    
    updateSelectedTags(filterId);
    updateButtonText(filterId);
}

function updateSelectedTags(filterId) {
    const tagsContainer = document.getElementById(`tags-${filterId}`);
    if (!tagsContainer) return;
    
    const selected = filterState[filterId];
    tagsContainer.innerHTML = '';
    
    selected.forEach(value => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `${escapeHtml(value)} <i class="fas fa-times" data-filter="${filterId}" data-value="${escapeHtml(value)}"></i>`;
        tagsContainer.appendChild(tag);
    });
    
    tagsContainer.querySelectorAll('.fa-times').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const filter = icon.getAttribute('data-filter');
            const value = icon.getAttribute('data-value');
            removeFilterValue(filter, value);
        });
    });
}

function removeFilterValue(filterId, value) {
    filterState[filterId] = filterState[filterId].filter(v => v !== value);
    
    const container = document.getElementById(`multi-select-${filterId}`);
    if (container) {
        const checkbox = container.querySelector(`input[value="${value.replace(/"/g, '&quot;')}"]`);
        if (checkbox) checkbox.checked = false;
    }
    
    updateSelectedTags(filterId);
    updateButtonText(filterId);
    applyFiltersAndRender();
}

function updateButtonText(filterId) {
    const btn = document.getElementById(`btn-${filterId}`);
    if (!btn) return;
    
    const selectedCount = filterState[filterId].length;
    const btnText = btn.querySelector('.btn-text');
    const countSpan = btn.querySelector('.selected-count');
    
    if (btnText) {
        if (selectedCount > 0) {
            btnText.textContent = `${selectedCount} selected`;
        } else {
            btnText.textContent = 'Select';
        }
    }
    
    if (countSpan) {
        countSpan.textContent = selectedCount > 0 ? selectedCount : '';
        countSpan.style.display = selectedCount > 0 ? 'inline-block' : 'none';
    }
}

function setupMultiSelects() {
    const filterIds = ['makeType', 'busClass', 'depot', 'workshop', 'district', 'classDetail'];
    
    filterIds.forEach(filterId => {
        const container = document.getElementById(`multi-select-${filterId}`);
        if (!container) return;
        
        const btn = document.getElementById(`btn-${filterId}`);
        const dropdown = container.querySelector('.multi-select-dropdown');
        
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.multi-select-dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            };
        }
        
        if (dropdown) {
            dropdown.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    const value = e.target.value;
                    if (e.target.checked) {
                        if (!filterState[filterId].includes(value)) {
                            filterState[filterId].push(value);
                        }
                    } else {
                        filterState[filterId] = filterState[filterId].filter(v => v !== value);
                    }
                    updateSelectedTags(filterId);
                    updateButtonText(filterId);
                    applyFiltersAndRender();
                }
            });
            
            const selectAllBtn = dropdown.querySelector('.select-all-btn');
            if (selectAllBtn) {
                selectAllBtn.onclick = (e) => {
                    e.stopPropagation();
                    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
                    const allValues = Array.from(checkboxes).map(cb => cb.value);
                    filterState[filterId] = [...allValues];
                    checkboxes.forEach(cb => cb.checked = true);
                    updateSelectedTags(filterId);
                    updateButtonText(filterId);
                    applyFiltersAndRender();
                };
            }
            
            const clearAllBtn = dropdown.querySelector('.clear-all-btn');
            if (clearAllBtn) {
                clearAllBtn.onclick = (e) => {
                    e.stopPropagation();
                    filterState[filterId] = [];
                    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(cb => cb.checked = false);
                    updateSelectedTags(filterId);
                    updateButtonText(filterId);
                    applyFiltersAndRender();
                };
            }
        }
    });
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.multi-select-dropdown').forEach(d => {
            d.classList.remove('show');
        });
    });
}

function setupCollapsibleFilter() {
    const filterToggle = document.getElementById('filterToggle');
    const filterContent = document.getElementById('filterContent');
    
    if (filterToggle && filterContent) {
        filterToggle.onclick = () => {
            filterToggle.classList.toggle('active');
            filterContent.classList.toggle('show');
        };
    }
}

function getSafeComputedAge(registrationDate) {
    try {
        if (typeof utils !== 'undefined' && utils.calculatePreciseAge) {
            return utils.calculatePreciseAge(registrationDate);
        }
        return null;
    } catch (error) {
        console.error("Error calculating age:", error);
        return null;
    }
}

function getSafeFormattedDate(registrationDate) {
    try {
        if (typeof utils !== 'undefined' && utils.formatDateToDDMMYYYY) {
            return utils.formatDateToDDMMYYYY(registrationDate);
        }
        return registrationDate || "";
    } catch (error) {
        console.error("Error formatting date:", error);
        return registrationDate || "";
    }
}

function applyFiltersAndRender() {
    try {
        if (typeof fleetData === 'undefined' || !fleetData) {
            console.warn("No fleet data available");
            return;
        }
        
        const searchTerm = document.getElementById("universalSearch")?.value.toLowerCase().trim() || "";
        const ageFrom = parseFloat(document.getElementById("ageFrom")?.value);
        const ageTo = parseFloat(document.getElementById("ageTo")?.value);
        
        let results = fleetData.map(bus => ({
            ...bus,
            computedAge: getSafeComputedAge(bus.registrationDate)
        }));
        
        if (searchTerm) {
            results = results.filter(bus => {
                try {
                    const formattedDate = getSafeFormattedDate(bus.registrationDate);
                    return (bus.busNo && safeToString(bus.busNo).toLowerCase().includes(searchTerm)) ||
                           (bus.regNo && safeToString(bus.regNo).toLowerCase().includes(searchTerm)) ||
                           safeToString(formattedDate).toLowerCase().includes(searchTerm) ||
                           (bus.computedAge !== null && safeToString(bus.computedAge).includes(searchTerm)) ||
                           (bus.makeType && safeToString(bus.makeType).toLowerCase().includes(searchTerm)) ||
                           (bus.busClass && safeToString(bus.busClass).toLowerCase().includes(searchTerm)) ||
                           (bus.depot && safeToString(bus.depot).toLowerCase().includes(searchTerm)) ||
                           (bus.workshop && safeToString(bus.workshop).toLowerCase().includes(searchTerm)) ||
                           (bus.classDetail && safeToString(bus.classDetail).toLowerCase().includes(searchTerm)) ||
                           (bus.district && safeToString(bus.district).toLowerCase().includes(searchTerm)) ||
                           (bus.engineNo && safeToString(bus.engineNo).toLowerCase().includes(searchTerm)) ||
                           (bus.chassisNo && safeToString(bus.chassisNo).toLowerCase().includes(searchTerm));
                } catch (error) {
                    console.error("Error in search filter:", error);
                    return false;
                }
            });
        }
        
        if (filterState.makeType.length > 0) {
            results = results.filter(bus => filterState.makeType.includes(safeToString(bus.makeType)));
        }
        
        if (filterState.busClass.length > 0) {
            results = results.filter(bus => filterState.busClass.includes(safeToString(bus.busClass)));
        }
        
        if (filterState.depot.length > 0) {
            results = results.filter(bus => filterState.depot.includes(safeToString(bus.depot)));
        }
        
        if (filterState.workshop.length > 0) {
            results = results.filter(bus => filterState.workshop.includes(safeToString(bus.workshop)));
        }
        
        if (filterState.district.length > 0) {
            results = results.filter(bus => filterState.district.includes(safeToString(bus.district)));
        }
        
        if (filterState.classDetail.length > 0) {
            results = results.filter(bus => filterState.classDetail.includes(safeToString(bus.classDetail)));
        }
        
        if (!isNaN(ageFrom)) {
            results = results.filter(bus => bus.computedAge !== null && bus.computedAge >= ageFrom);
        }
        if (!isNaN(ageTo)) {
            results = results.filter(bus => bus.computedAge !== null && bus.computedAge <= ageTo);
        }
        
        filteredBuses = results;
        
        const filteredCountSpan = document.getElementById("filteredCount");
        const totalFilteredSpan = document.getElementById("totalFilteredCount");
        if (filteredCountSpan) filteredCountSpan.innerText = filteredBuses.length;
        if (totalFilteredSpan) totalFilteredSpan.innerText = filteredBuses.length;
        
        currentPage = 1;
        
        sortFilteredBuses();
        renderBusTable();
        updatePaginationInfo();
    } catch (error) {
        console.error("Error in applyFiltersAndRender:", error);
    }
}

function sortFilteredBuses() {
    try {
        filteredBuses.sort((a, b) => {
            let valA, valB;
            
            switch(currentSort.column) {
                case 'slno':
                    valA = filteredBuses.indexOf(a);
                    valB = filteredBuses.indexOf(b);
                    break;
                case 'busNo':
                    valA = safeToString(a.busNo).toLowerCase();
                    valB = safeToString(b.busNo).toLowerCase();
                    break;
                case 'regNo':
                    valA = safeToString(a.regNo).toLowerCase();
                    valB = safeToString(b.regNo).toLowerCase();
                    break;
                case 'regDate':
                    valA = a.registrationDate || "";
                    valB = b.registrationDate || "";
                    break;
                case 'age':
                    valA = a.computedAge !== null ? a.computedAge : -1;
                    valB = b.computedAge !== null ? b.computedAge : -1;
                    break;
                case 'makeType':
                    valA = safeToString(a.makeType).toLowerCase();
                    valB = safeToString(b.makeType).toLowerCase();
                    break;
                case 'busClass':
                    valA = safeToString(a.busClass).toLowerCase();
                    valB = safeToString(b.busClass).toLowerCase();
                    break;
                case 'depot':
                    valA = safeToString(a.depot).toLowerCase();
                    valB = safeToString(b.depot).toLowerCase();
                    break;
                case 'workshop':
                    valA = safeToString(a.workshop).toLowerCase();
                    valB = safeToString(b.workshop).toLowerCase();
                    break;
                case 'classDetail':
                    valA = safeToString(a.classDetail).toLowerCase();
                    valB = safeToString(b.classDetail).toLowerCase();
                    break;
                case 'district':
                    valA = safeToString(a.district).toLowerCase();
                    valB = safeToString(b.district).toLowerCase();
                    break;
                case 'engineNo':
                    valA = safeToString(a.engineNo).toLowerCase();
                    valB = safeToString(b.engineNo).toLowerCase();
                    break;
                case 'chassisNo':
                    valA = safeToString(a.chassisNo).toLowerCase();
                    valB = safeToString(b.chassisNo).toLowerCase();
                    break;
                default:
                    valA = safeToString(a.busNo).toLowerCase();
                    valB = safeToString(b.busNo).toLowerCase();
            }
            
            if (valA === valB) return 0;
            
            const compareResult = valA > valB ? 1 : -1;
            return currentSort.direction === 'asc' ? compareResult : -compareResult;
        });
    } catch (error) {
        console.error("Error sorting filtered buses:", error);
    }
}

function renderBusTable() {
    try {
        const tbody = document.getElementById("fullBusTableBody");
        if (!tbody) return;
        
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredBuses.length);
        const pageBuses = filteredBuses.slice(startIndex, endIndex);
        
        if (pageBuses.length === 0) {
            tbody.innerHTML = '春节<td colspan="13">No buses match your filters.春节</div>';
            return;
        }
        
        tbody.innerHTML = "";
        pageBuses.forEach((bus, idx) => {
            const serialNo = startIndex + idx + 1;
            const age = bus.computedAge !== null ? bus.computedAge.toFixed(2) : "N/A";
            const formattedDate = getSafeFormattedDate(bus.registrationDate);
            
            const row = tbody.insertRow();
            row.insertCell(0).innerText = serialNo;
            row.insertCell(1).innerText = safeToString(bus.busNo) || "—";
            row.insertCell(2).innerText = safeToString(bus.regNo) || "—";
            row.insertCell(3).innerText = formattedDate || "—";
            row.insertCell(4).innerText = age !== "N/A" ? `${age} yrs` : "N/A";
            row.insertCell(5).innerText = safeToString(bus.makeType) || "—";
            row.insertCell(6).innerText = safeToString(bus.busClass) || "—";
            row.insertCell(7).innerText = safeToString(bus.depot) || "—";
            row.insertCell(8).innerText = safeToString(bus.workshop) || "—";
            row.insertCell(9).innerText = safeToString(bus.classDetail) || "—";
            row.insertCell(10).innerText = safeToString(bus.district) || "—";
            row.insertCell(11).innerText = safeToString(bus.engineNo) || "—";
            row.insertCell(12).innerText = safeToString(bus.chassisNo) || "—";
        });
        
        const pageStartSpan = document.getElementById("pageStart");
        const pageEndSpan = document.getElementById("pageEnd");
        const pageInfoSpan = document.getElementById("pageInfo");
        
        if (pageStartSpan) pageStartSpan.innerText = filteredBuses.length > 0 ? startIndex + 1 : 0;
        if (pageEndSpan) pageEndSpan.innerText = endIndex;
        if (pageInfoSpan) pageInfoSpan.innerText = `Page ${currentPage}`;
        
        const prevBtn = document.getElementById("prevPageBtn");
        const nextBtn = document.getElementById("nextPageBtn");
        const totalPages = Math.ceil(filteredBuses.length / rowsPerPage);
        
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    } catch (error) {
        console.error("Error rendering bus table:", error);
    }
}

function updatePaginationInfo() {
    try {
        const totalPages = Math.ceil(filteredBuses.length / rowsPerPage);
        const prevBtn = document.getElementById("prevPageBtn");
        const nextBtn = document.getElementById("nextPageBtn");
        const pageInfoSpan = document.getElementById("pageInfo");
        const pageStartSpan = document.getElementById("pageStart");
        const pageEndSpan = document.getElementById("pageEnd");
        
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredBuses.length);
        
        if (pageStartSpan) pageStartSpan.innerText = filteredBuses.length > 0 ? startIndex + 1 : 0;
        if (pageEndSpan) pageEndSpan.innerText = endIndex;
        if (pageInfoSpan) pageInfoSpan.innerText = `Page ${currentPage} of ${totalPages || 1}`;
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    } catch (error) {
        console.error("Error updating pagination:", error);
    }
}

function clearAllFilters() {
    try {
        filterState = {
            makeType: [],
            busClass: [],
            depot: [],
            workshop: [],
            district: [],
            classDetail: []
        };
        
        const filterIds = ['makeType', 'busClass', 'depot', 'workshop', 'district', 'classDetail'];
        filterIds.forEach(filterId => {
            const container = document.getElementById(`multi-select-${filterId}`);
            if (container) {
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(cb => cb.checked = false);
            }
            updateSelectedTags(filterId);
            updateButtonText(filterId);
        });
        
        const universalSearch = document.getElementById("universalSearch");
        const ageFrom = document.getElementById("ageFrom");
        const ageTo = document.getElementById("ageTo");
        
        if (universalSearch) universalSearch.value = "";
        if (ageFrom) ageFrom.value = "";
        if (ageTo) ageTo.value = "";
        
        applyFiltersAndRender();
    } catch (error) {
        console.error("Error clearing filters:", error);
    }
}

function exportFilteredData() {
    try {
        if (filteredBuses.length === 0) {
            alert("No data to export!");
            return;
        }
        
        const exportData = filteredBuses.map((bus, idx) => ({
            'Sl. No': idx + 1,
            'Bus No': safeToString(bus.busNo),
            'Reg No': safeToString(bus.regNo),
            'Registration Date': getSafeFormattedDate(bus.registrationDate),
            'Age (Years)': bus.computedAge !== null ? bus.computedAge.toFixed(2) : "N/A",
            'Make & Type': safeToString(bus.makeType),
            'Class': safeToString(bus.busClass),
            'Class Detail': safeToString(bus.classDetail),
            'Depot': safeToString(bus.depot),
            'District': safeToString(bus.district),
            'Workshop': safeToString(bus.workshop),
            'Engine No': safeToString(bus.engineNo),
            'Chassis No': safeToString(bus.chassisNo)
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Fleet Data");
        XLSX.writeFile(workbook, `kerala_rtc_filtered_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (error) {
        console.error("Error exporting data:", error);
        alert("Error exporting data. Please try again.");
    }
}

function setupSortHandlers() {
    try {
        const headers = document.querySelectorAll("#fullBusTableHead th[data-sort]");
        headers.forEach(header => {
            header.style.cursor = "pointer";
            header.onclick = function() {
                const column = this.getAttribute("data-sort");
                
                if (currentSort.column === column) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.column = column;
                    currentSort.direction = 'asc';
                }
                
                document.querySelectorAll("#fullBusTableHead th[data-sort]").forEach(th => {
                    th.classList.remove('sort-asc', 'sort-desc');
                    const icon = th.querySelector('.sort-icon');
                    if (icon) icon.className = 'fas fa-sort sort-icon';
                });
                
                this.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
                const icon = this.querySelector('.sort-icon');
                if (icon) icon.className = currentSort.direction === 'asc' ? 'fas fa-sort-up sort-icon' : 'fas fa-sort-down sort-icon';
                
                sortFilteredBuses();
                renderBusTable();
            };
        });
    } catch (error) {
        console.error("Error setting up sort handlers:", error);
    }
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function attachEventListeners() {
    try {
        console.log("Attaching event listeners...");
        
        const universalSearch = document.getElementById("universalSearch");
        if (universalSearch) {
            universalSearch.oninput = function() {
                applyFiltersAndRender();
            };
        }
        
        const ageFrom = document.getElementById("ageFrom");
        const ageTo = document.getElementById("ageTo");
        
        if (ageFrom) ageFrom.oninput = function() { applyFiltersAndRender(); };
        if (ageTo) ageTo.oninput = function() { applyFiltersAndRender(); };
        
        const clearBtn = document.getElementById("clearAllFiltersBtn");
        if (clearBtn) clearBtn.onclick = function() { clearAllFilters(); };
        
        const exportBtn = document.getElementById("exportFilteredBtn");
        if (exportBtn) exportBtn.onclick = function() { exportFilteredData(); };
        
        const prevBtn = document.getElementById("prevPageBtn");
        const nextBtn = document.getElementById("nextPageBtn");
        
        if (prevBtn) {
            prevBtn.onclick = function() {
                if (currentPage > 1) {
                    currentPage--;
                    renderBusTable();
                    updatePaginationInfo();
                }
            };
        }
        
        if (nextBtn) {
            nextBtn.onclick = function() {
                const totalPages = Math.ceil(filteredBuses.length / rowsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderBusTable();
                    updatePaginationInfo();
                }
            };
        }
        
        setupSortHandlers();
    } catch (error) {
        console.error("Error attaching event listeners:", error);
    }
}

window.buslist = {
    init: initBusList,
    refresh: function() {
        if (typeof fleetData !== 'undefined' && fleetData && fleetData.length > 0) {
            updateFilterOptions();
            applyFiltersAndRender();
        }
    }
};