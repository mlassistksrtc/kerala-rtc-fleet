(function() {
    // ==================== AUTHENTICATION MODULE ====================

    let currentUser = null;
    let users = [];
    let activityLog = [];

    function loadUsers() {
        const stored = localStorage.getItem("rtcFleetUsers");
        if (stored) {
            try {
                users = JSON.parse(stored);
                if (users.length > 0) {
                    return users;
                }
            } catch(e) {
                users = [];
            }
        }
        
        // Default users
        users = [
            { id: 1, username: "admin", password: "admin123", fullName: "Administrator", email: "admin@keralartc.com", role: "admin", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null, createdBy: "system" },
            { id: 2, username: "supervisor", password: "super123", fullName: "Supervisor", email: "supervisor@keralartc.com", role: "supervisor", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null, createdBy: "system" },
            { id: 3, username: "operator", password: "oper123", fullName: "Operator", email: "operator@keralartc.com", role: "operator", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null, createdBy: "system" },
            { id: 4, username: "viewer", password: "view123", fullName: "Viewer", email: "viewer@keralartc.com", role: "viewer", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null, createdBy: "system" }
        ];
        localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
        return users;
    }

    function loadActivityLog() {
        const storedLog = localStorage.getItem("keralaRtcActivityLog");
        if (storedLog) {
            try {
                activityLog = JSON.parse(storedLog);
            } catch(e) {
                activityLog = [];
            }
        }
        return activityLog;
    }

    function saveActivityLog() {
        localStorage.setItem("keralaRtcActivityLog", JSON.stringify(activityLog));
    }

    function addActivityLog(action, details, userId) {
        const logEntry = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            action: action,
            details: details,
            user: currentUser ? currentUser.username : "system",
            userId: userId || (currentUser ? currentUser.id : null)
        };
        activityLog.unshift(logEntry);
        if (activityLog.length > 1000) activityLog = activityLog.slice(0, 1000);
        saveActivityLog();
    }

    function getNextUserId() {
        let maxId = 0;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id > maxId) maxId = users[i].id;
        }
        return maxId + 1;
    }

    function saveCurrentUser(user) {
        if (user) {
            localStorage.setItem("rtcCurrentUser", JSON.stringify(user));
            currentUser = user;
            for (let i = 0; i < users.length; i++) {
                if (users[i].id === user.id) {
                    users[i].lastLogin = new Date().toLocaleString();
                    localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
                    addActivityLog("LOGIN", "User logged in", user.id);
                    break;
                }
            }
        } else {
            localStorage.removeItem("rtcCurrentUser");
            currentUser = null;
        }
    }

    function loadSession() {
        const sess = localStorage.getItem("rtcCurrentUser");
        if (sess) {
            try {
                currentUser = JSON.parse(sess);
            } catch(e) {
                currentUser = null;
            }
        }
        return currentUser;
    }

    function login(username, password) {
        let foundUser = null;
        for (let i = 0; i < users.length; i++) {
            if (users[i].username === username && users[i].password === password && users[i].status === "active") {
                foundUser = users[i];
                break;
            }
        }
        if (foundUser) {
            saveCurrentUser({ 
                id: foundUser.id, 
                username: foundUser.username, 
                role: foundUser.role, 
                fullName: foundUser.fullName 
            });
            return true;
        }
        return false;
    }

    function logout() {
        if (currentUser) {
            addActivityLog("LOGOUT", "User logged out", currentUser.id);
        }
        saveCurrentUser(null);
    }

    function isAdmin() {
        return currentUser && currentUser.role === "admin";
    }

    function isLoggedIn() {
        return currentUser !== null;
    }

    function getCurrentUser() {
        return currentUser;
    }

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
            viewTransferHistory: false,
            uploadExcel: false,
            clearData: false,
            manageUsers: false,
            resetPassword: false,
            deleteUser: false,
            viewActivityLog: false
        }
    };

    function hasPermission(permission) {
        if (!currentUser) return false;
        const role = currentUser.role;
        const permissions = ROLE_PERMISSIONS[role];
        return permissions ? permissions[permission] : false;
    }

    function getAllUsers() {
        return users;
    }

    function addUser(username, password, fullName, email, role) {
        if (!isAdmin()) {
            alert("Only admin can add users!");
            return false;
        }
        
        let exists = false;
        for (let i = 0; i < users.length; i++) {
            if (users[i].username === username) {
                exists = true;
                break;
            }
        }
        if (exists) {
            alert("Username already exists!");
            return false;
        }
        
        const newUser = {
            id: getNextUserId(),
            username: username,
            password: password,
            fullName: fullName || "",
            email: email || "",
            role: role,
            status: "active",
            createdDate: new Date().toLocaleString(),
            lastLogin: null,
            createdBy: currentUser.username
        };
        
        users.push(newUser);
        localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
        addActivityLog("USER_ADD", "User " + username + " (" + role + ") added", currentUser.id);
        alert("User " + username + " added successfully!");
        return true;
    }

    function editUser(userId, updates) {
        if (!isAdmin()) {
            alert("Only admin can edit users!");
            return false;
        }
        
        let userIndex = -1;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === userId) {
                userIndex = i;
                break;
            }
        }
        if (userIndex === -1) return false;
        
        for (let key in updates) {
            if (updates.hasOwnProperty(key)) {
                users[userIndex][key] = updates[key];
            }
        }
        localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
        addActivityLog("USER_EDIT", "User " + users[userIndex].username + " edited", currentUser.id);
        return true;
    }

    function resetUserPassword(userId, newPassword) {
        if (!isAdmin()) {
            alert("Only admin can reset passwords!");
            return false;
        }
        
        let user = null;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === userId) {
                user = users[i];
                break;
            }
        }
        if (!user) return false;
        
        user.password = newPassword;
        localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
        addActivityLog("PASSWORD_RESET", "Password reset for user " + user.username, currentUser.id);
        alert("Password for " + user.username + " has been reset to: " + newPassword);
        return true;
    }

    function deleteUser(userId) {
        if (!isAdmin()) {
            alert("Only admin can delete users!");
            return false;
        }
        
        let user = null;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === userId) {
                user = users[i];
                break;
            }
        }
        if (!user) return false;
        
        if (user.role === "admin") {
            alert("Cannot delete admin users!");
            return false;
        }
        
        user.status = "inactive";
        localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
        addActivityLog("USER_DEACTIVATE", "User " + user.username + " deactivated", currentUser.id);
        alert("User " + user.username + " has been deactivated.");
        return true;
    }

    function reactivateUser(userId) {
        if (!isAdmin()) {
            alert("Only admin can reactivate users!");
            return false;
        }
        
        let user = null;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === userId) {
                user = users[i];
                break;
            }
        }
        if (!user) return false;
        
        user.status = "active";
        localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
        addActivityLog("USER_REACTIVATE", "User " + user.username + " reactivated", currentUser.id);
        alert("User " + user.username + " has been reactivated.");
        return true;
    }

    function changeOwnPassword(oldPassword, newPassword) {
        if (!currentUser) return false;
        
        let user = null;
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === currentUser.id) {
                user = users[i];
                break;
            }
        }
        if (!user || user.password !== oldPassword) {
            alert("Current password is incorrect!");
            return false;
        }
        
        user.password = newPassword;
        localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
        addActivityLog("PASSWORD_CHANGE", "User changed their password", currentUser.id);
        alert("Password changed successfully!");
        return true;
    }

    function generateRandomPassword() {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let password = "";
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    function getActivityLog(limit) {
        limit = limit || 100;
        return activityLog.slice(0, limit);
    }

    function clearActivityLog() {
        if (!isAdmin()) {
            alert("Only admin can clear activity log!");
            return false;
        }
        
        if (confirm("Delete all activity log? This action cannot be undone.")) {
            activityLog = [];
            saveActivityLog();
            addActivityLog("LOG_CLEAR", "Activity log cleared by admin", currentUser.id);
            alert("Activity log cleared successfully!");
            return true;
        }
        return false;
    }

    window.auth = {
        loadUsers: loadUsers,
        loadSession: loadSession,
        login: login,
        logout: logout,
        isAdmin: isAdmin,
        isLoggedIn: isLoggedIn,
        getCurrentUser: getCurrentUser,
        hasPermission: hasPermission,
        getAllUsers: getAllUsers,
        addUser: addUser,
        editUser: editUser,
        resetUserPassword: resetUserPassword,
        deleteUser: deleteUser,
        reactivateUser: reactivateUser,
        changeOwnPassword: changeOwnPassword,
        generateRandomPassword: generateRandomPassword,
        getActivityLog: getActivityLog,
        clearActivityLog: clearActivityLog,
        addActivityLog: addActivityLog
    };
    
    loadUsers();
    loadActivityLog();
    loadSession();
})();