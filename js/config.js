// ==================== CONFIGURATION ====================

// Storage Keys
const STORAGE_KEYS = {
    BUS_DATA: "keralaRtcFleetData",
    USERS: "rtcFleetUsers",
    CURRENT_USER: "rtcCurrentUser",
    TRANSFER_HISTORY: "keralaRtcTransferHistory",
    ACTIVITY_LOG: "keralaRtcActivityLog"
};

// Default Users (with full details for user management)
const DEFAULT_USERS = [
    { 
        id: 1, 
        username: "admin", 
        password: "admin123", 
        fullName: "Administrator", 
        email: "admin@keralartc.com", 
        role: "admin", 
        status: "active", 
        createdDate: new Date().toLocaleString(), 
        lastLogin: null, 
        createdBy: "system" 
    },
    { 
        id: 2, 
        username: "supervisor", 
        password: "super123", 
        fullName: "Supervisor", 
        email: "supervisor@keralartc.com", 
        role: "supervisor", 
        status: "active", 
        createdDate: new Date().toLocaleString(), 
        lastLogin: null, 
        createdBy: "system" 
    },
    { 
        id: 3, 
        username: "operator", 
        password: "oper123", 
        fullName: "Operator", 
        email: "operator@keralartc.com", 
        role: "operator", 
        status: "active", 
        createdDate: new Date().toLocaleString(), 
        lastLogin: null, 
        createdBy: "system" 
    },
    { 
        id: 4, 
        username: "viewer", 
        password: "view123", 
        fullName: "Viewer", 
        email: "viewer@keralartc.com", 
        role: "viewer", 
        status: "active", 
        createdDate: new Date().toLocaleString(), 
        lastLogin: null, 
        createdBy: "system" 
    }
];

// Role Permissions
const ROLE_PERMISSIONS = {
    admin: {
        dashboard: true,
        viewBusList: true,
        exportData: true,
        addBus: true,
        editBus: true,
        transferBus: true,
        viewTransferHistory: true,
        uploadExcel: true,
        clearData: true,
        manageUsers: true,
        resetPassword: true,
        deleteUser: true,
        viewActivityLog: true
    },
    supervisor: {
        dashboard: true,
        viewBusList: true,
        exportData: true,
        addBus: true,
        editBus: true,
        transferBus: true,
        viewTransferHistory: true,
        uploadExcel: false,
        clearData: false,
        manageUsers: false,
        resetPassword: false,
        deleteUser: false,
        viewActivityLog: false
    },
    operator: {
        dashboard: true,
        viewBusList: true,
        exportData: false,
        addBus: false,
        editBus: false,
        transferBus: false,
        viewTransferHistory: true,
        uploadExcel: false,
        clearData: false,
        manageUsers: false,
        resetPassword: false,
        deleteUser: false,
        viewActivityLog: false
    },
    viewer: {
        dashboard: true,
        viewBusList: true,
        exportData: false,
        addBus: false,
        editBus: false,
        transferBus: false,
        viewTransferHistory: true,
        uploadExcel: false,
        clearData: false,
        manageUsers: false,
        resetPassword: false,
        deleteUser: false,
        viewActivityLog: false
    }
};

// Age Bins Configuration (0-1, 1-2, ... up to 20+)
const AGE_BINS = [];
for (let i = 0; i <= 20; i++) {
    if (i === 20) {
        AGE_BINS.push({ min: 20, max: null, label: "20+" });
    } else {
        AGE_BINS.push({ min: i, max: i + 1, label: `${i}-${i+1}` });
    }
}

// Column Mappings (Excel to System)
const COLUMN_MAPPING = {
    busNo: ["BUSNO", "BUS NO", "Bus No"],
    regNo: ["REGNO", "REG NO", "Registration No"],
    regDate: ["Date_of_Reg", "Date of Reg", "RegistrationDate"],
    makeType: ["MAKE & TYPE", "MAKE AND TYPE", "Make & Type"],
    busClass: ["CLASS", "Class"],
    classDetail: ["CLASS - DETAIL", "Class Detail"],
    depot: ["ALLOTTED DEPOT", "Allotted Depot", "Depot"],
    workshop: ["WORKSHOP", "Workshop"],
    district: ["DISTRICT", "District"],
    engineNo: ["ENGINE NUMBER", "Engine Number"],
    chassisNo: ["CHASSIS NUMBER", "Chassis Number"]
};

// KPI Detail Configurations
const KPI_CONFIG = {
    makeType: {
        title: "Make & Type Details",
        getData: (fleetData) => {
            const map = new Map();
            if (!fleetData) return { items: [], total: 0 };
            fleetData.forEach(bus => {
                let make = bus.makeType || "Unknown";
                if (make && make !== "N/A" && make !== "Unknown") {
                    map.set(make, (map.get(make) || 0) + 1);
                }
            });
            const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
            return { items: sorted, total: map.size };
        }
    },
    busClass: {
        title: "Bus Class Details",
        getData: (fleetData) => {
            const map = new Map();
            if (!fleetData) return { items: [], total: 0 };
            fleetData.forEach(bus => {
                let className = bus.busClass || "Unknown";
                if (className && className !== "Unknown") {
                    map.set(className, (map.get(className) || 0) + 1);
                }
            });
            const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
            return { items: sorted, total: map.size };
        }
    },
    swiftBuses: {
        title: "Swift Bus Breakdown",
        getData: (fleetData) => {
            const map = new Map();
            if (!fleetData) return { items: [], total: 0 };
            fleetData.forEach(bus => {
                if (bus.busClass && bus.busClass.includes("SWIFT")) {
                    let type = bus.busClass;
                    if (type.includes("S/DLX")) type = "SWIFT Super Deluxe";
                    else if (type.includes("SFP")) type = "SWIFT Super Fast";
                    else if (type.includes("FP")) type = "SWIFT Fast Passenger";
                    else if (type.includes("EV")) type = "SWIFT Electric";
                    else type = "SWIFT";
                    map.set(type, (map.get(type) || 0) + 1);
                }
            });
            const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
            const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
            return { items: sorted, total: total };
        }
    },
    electricBuses: {
        title: "Electric Bus Breakdown",
        getData: (fleetData) => {
            const map = new Map();
            if (!fleetData) return { items: [], total: 0 };
            fleetData.forEach(bus => {
                if (bus.busClass && (bus.busClass.includes("ELECTRIC") || bus.busClass.includes("EV"))) {
                    let type = bus.busClass;
                    if (type.includes("PMI")) type = "PMI Electric";
                    else if (type.includes("ER")) type = "ER Electric";
                    else type = "Electric Bus";
                    map.set(type, (map.get(type) || 0) + 1);
                }
            });
            const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
            const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
            return { items: sorted, total: total };
        }
    },
    depots: {
        title: "Depot-wise Distribution",
        getData: (fleetData) => {
            const map = new Map();
            if (!fleetData) return { items: [], total: 0 };
            fleetData.forEach(bus => {
                let depot = bus.depot || "Unknown";
                if (depot && depot !== "Unknown") {
                    map.set(depot, (map.get(depot) || 0) + 1);
                }
            });
            const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
            return { items: sorted, total: map.size };
        }
    },
    workshops: {
        title: "Workshop-wise Distribution",
        getData: (fleetData) => {
            const map = new Map();
            if (!fleetData) return { items: [], total: 0 };
            fleetData.forEach(bus => {
                let workshop = bus.workshop || "Unknown";
                if (workshop && workshop !== "Unknown") {
                    map.set(workshop, (map.get(workshop) || 0) + 1);
                }
            });
            const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
            return { items: sorted, total: map.size };
        }
    },
    classDetail: {
        title: "Class Detail Distribution",
        getData: (fleetData) => {
            const map = new Map();
            if (!fleetData) return { items: [], total: 0 };
            fleetData.forEach(bus => {
                let detail = bus.classDetail || "Unknown";
                if (detail && detail !== "Unknown" && detail !== "") {
                    map.set(detail, (map.get(detail) || 0) + 1);
                }
            });
            const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
            return { items: sorted, total: map.size };
        }
    },
    district: {
        title: "District-wise Distribution",
        getData: (fleetData) => {
            const map = new Map();
            if (!fleetData) return { items: [], total: 0 };
            fleetData.forEach(bus => {
                let district = bus.district || "Unknown";
                if (district && district !== "Unknown" && district !== "") {
                    map.set(district, (map.get(district) || 0) + 1);
                }
            });
            const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
            return { items: sorted, total: map.size };
        }
    }
};

// Make config globally available
window.CONFIG = {
    STORAGE_KEYS,
    DEFAULT_USERS,
    AGE_BINS,
    COLUMN_MAPPING,
    KPI_CONFIG,
    ROLE_PERMISSIONS
};