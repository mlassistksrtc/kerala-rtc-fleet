// ==================== UTILITY FUNCTIONS ====================

// Convert Excel serial date number to Date object
function excelSerialToDate(serial) {
    if (typeof serial !== 'number') return null;
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + serial * 86400000);
}

// Format date to dd/mm/yyyy
function formatDateToDDMMYYYY(dateValue) {
    if (!dateValue) return "";
    
    if (typeof dateValue === 'number') {
        const date = excelSerialToDate(dateValue);
        if (date && !isNaN(date.getTime())) {
            let day = date.getDate().toString().padStart(2, '0');
            let month = (date.getMonth() + 1).toString().padStart(2, '0');
            let year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        return String(dateValue);
    }
    
    if (typeof dateValue === 'string') {
        let cleanDate = dateValue.split(' ')[0];
        
        if (cleanDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return cleanDate;
        }
        
        if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            let parts = cleanDate.split('-');
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        
        let parsedDate = new Date(cleanDate);
        if (!isNaN(parsedDate.getTime())) {
            let day = parsedDate.getDate().toString().padStart(2, '0');
            let month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
            let year = parsedDate.getFullYear();
            return `${day}/${month}/${year}`;
        }
    }
    
    return String(dateValue);
}

// Parse date for age calculation
function parseDateForAge(dateValue) {
    if (!dateValue) return null;
    
    if (typeof dateValue === 'number') {
        return excelSerialToDate(dateValue);
    }
    
    if (typeof dateValue === 'string') {
        let cleanDate = dateValue.split(' ')[0];
        
        if (cleanDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            let parts = cleanDate.split('/');
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        
        if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            let parts = cleanDate.split('-');
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        
        let parsedDate = new Date(cleanDate);
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
        }
    }
    
    return null;
}

// Precise age calculation
function calculatePreciseAge(dateValue) {
    const regDate = parseDateForAge(dateValue);
    if (!regDate) return null;
    
    const today = new Date();
    const diffTime = today - regDate;
    const diffDays = diffTime / (1000 * 3600 * 24);
    const fractionalYears = diffDays / 365.2425;
    
    return parseFloat(fractionalYears.toFixed(2));
}

// Get age bin
function getAgeBin(age) {
    if (age === null || age === undefined) return null;
    
    for (let bin of window.CONFIG.AGE_BINS) {
        if (bin.max === null) {
            if (age >= bin.min) return bin;
        } else {
            if (age >= bin.min && age < bin.max) return bin;
        }
    }
    return null;
}

// Check if bus is Swift
function isSwiftBus(bus) {
    const busClass = (bus.busClass || "").toUpperCase();
    return busClass.includes("SWIFT");
}

// Check if bus is Electric
function isElectricBus(bus) {
    const busClass = (bus.busClass || "").toUpperCase();
    return busClass.includes("ELECTRIC") || busClass.includes("EV");
}

// Parse Excel row to bus object
function parseBusFromExcel(row) {
    const mapping = window.CONFIG.COLUMN_MAPPING;
    
    const getValue = (keys) => {
        for (let key of keys) {
            if (row[key] !== undefined && row[key] !== "") {
                return row[key];
            }
        }
        return "";
    };
    
    let regDate = getValue(mapping.regDate);
    
    return {
        busNo: getValue(mapping.busNo) || getValue(mapping.regNo),
        regNo: getValue(mapping.regNo) || getValue(mapping.busNo),
        registrationDate: regDate,
        makeType: getValue(mapping.makeType) || "N/A",
        busClass: getValue(mapping.busClass) || "ORDINARY",
        classDetail: getValue(mapping.classDetail) || "",
        depot: getValue(mapping.depot) || "Unknown",
        workshop: getValue(mapping.workshop) || "Unknown",
        district: getValue(mapping.district) || "",
        engineNo: getValue(mapping.engineNo) || "",
        chassisNo: getValue(mapping.chassisNo) || ""
    };
}

// Save data to localStorage
function saveFleetData(data) {
    localStorage.setItem(window.CONFIG.STORAGE_KEYS.BUS_DATA, JSON.stringify(data));
}

// Load data from localStorage
function loadFleetData() {
    const stored = localStorage.getItem(window.CONFIG.STORAGE_KEYS.BUS_DATA);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    }
    return [];
}

// Export to Excel
function exportToExcel(fleetData) {
    if (!fleetData || fleetData.length === 0) {
        alert("No data to export!");
        return;
    }
    
    const exportData = fleetData.map((bus, index) => ({
        'Sl. No': index + 1,
        'Bus No': bus.busNo,
        'Reg No': bus.regNo,
        'Registration Date': formatDateToDDMMYYYY(bus.registrationDate),
        'Age (Years)': calculatePreciseAge(bus.registrationDate)?.toFixed(2) || "N/A",
        'Make & Type': bus.makeType,
        'Class': bus.busClass,
        'Class Detail': bus.classDetail,
        'Depot': bus.depot,
        'District': bus.district,
        'Workshop': bus.workshop,
        'Engine No': bus.engineNo,
        'Chassis No': bus.chassisNo
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fleet Data");
    XLSX.writeFile(workbook, `kerala_rtc_fleet_${new Date().toISOString().slice(0,10)}.xlsx`);
}

window.utils = {
    formatDateToDDMMYYYY,
    calculatePreciseAge,
    getAgeBin,
    isSwiftBus,
    isElectricBus,
    parseBusFromExcel,
    saveFleetData,
    loadFleetData,
    exportToExcel,
    parseDateForAge
};