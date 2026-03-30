// ==================== USER MANAGEMENT MODULE ====================

// Make sure this matches the login page's default users
const USER_MANAGER_DEFAULT_USERS = [
    { id: 1, username: "admin", password: "admin123", fullName: "Administrator", email: "admin@keralartc.com", role: "admin", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null },
    { id: 2, username: "supervisor", password: "super123", fullName: "Supervisor", email: "supervisor@keralartc.com", role: "supervisor", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null },
    { id: 3, username: "operator", password: "oper123", fullName: "Operator", email: "operator@keralartc.com", role: "operator", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null },
    { id: 4, username: "viewer", password: "view123", fullName: "Viewer", email: "viewer@keralartc.com", role: "viewer", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null }
];

let userManagerUserList = [];
let userManagerCurrentPage = 1;
const userManagerRowsPerPage = 10;
let userManagerOriginalList = [];

// Initialize user storage
function userManagerInitializeStorage() {
    let users = localStorage.getItem("rtcFleetUsers");
    
    if (!users) {
        console.log("No users found, creating default users...");
        localStorage.setItem("rtcFleetUsers", JSON.stringify(USER_MANAGER_DEFAULT_USERS));
        return USER_MANAGER_DEFAULT_USERS;
    }
    
    try {
        let parsedUsers = JSON.parse(users);
        if (!Array.isArray(parsedUsers) || parsedUsers.length === 0) {
            console.log("Invalid users array, resetting to defaults...");
            localStorage.setItem("rtcFleetUsers", JSON.stringify(USER_MANAGER_DEFAULT_USERS));
            return USER_MANAGER_DEFAULT_USERS;
        }
        
        // Ensure admin exists and is active
        const adminExists = parsedUsers.some(u => u.username === "admin");
        if (!adminExists) {
            console.log("Admin missing, adding default admin...");
            parsedUsers.unshift(USER_MANAGER_DEFAULT_USERS[0]);
            localStorage.setItem("rtcFleetUsers", JSON.stringify(parsedUsers));
        } else {
            const adminUser = parsedUsers.find(u => u.username === "admin");
            if (adminUser && adminUser.status !== "active") {
                adminUser.status = "active";
                localStorage.setItem("rtcFleetUsers", JSON.stringify(parsedUsers));
            }
        }
        
        console.log("Users loaded successfully. Total:", parsedUsers.length);
        return parsedUsers;
    } catch(e) {
        console.error("Error parsing users:", e);
        localStorage.setItem("rtcFleetUsers", JSON.stringify(USER_MANAGER_DEFAULT_USERS));
        return USER_MANAGER_DEFAULT_USERS;
    }
}

// Load users from localStorage
function userManagerLoadUserList() {
    const stored = localStorage.getItem("rtcFleetUsers");
    if (stored) {
        try {
            userManagerUserList = JSON.parse(stored);
            console.log("Loaded users from storage:", userManagerUserList.length);
            return;
        } catch(e) {
            console.error("Error parsing users:", e);
            userManagerUserList = [];
        }
    }
    
    userManagerUserList = userManagerInitializeStorage();
    console.log("Users initialized:", userManagerUserList.length);
}

// Save users to localStorage
function userManagerSaveUserList() {
    localStorage.setItem("rtcFleetUsers", JSON.stringify(userManagerUserList));
    console.log("Users saved to storage. Total:", userManagerUserList.length);
}

// Initialize user management
function userManagerInit() {
    console.log("Initializing user management...");
    userManagerLoadUserList();
    userManagerRenderTable();
    userManagerAttachEvents();
}

// Get role color
function userManagerGetRoleColor(role) {
    switch(role) {
        case 'admin': return '#dc2626';
        case 'supervisor': return '#e67e22';
        case 'operator': return '#3498db';
        default: return '#6b7280';
    }
}

// Escape HTML
function userManagerEscapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render users table
function userManagerRenderTable() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) {
        console.warn("usersTableBody not found!");
        return;
    }
    
    if (userManagerUserList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No users found. Click "Add New User" to get started.</td></tr>';
        userManagerUpdatePagination();
        return;
    }
    
    const start = (userManagerCurrentPage - 1) * userManagerRowsPerPage;
    const end = Math.min(start + userManagerRowsPerPage, userManagerUserList.length);
    const pageUsers = userManagerUserList.slice(start, end);
    
    tbody.innerHTML = "";
    pageUsers.forEach((user, idx) => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = start + idx + 1;
        row.insertCell(1).innerText = user.username;
        row.insertCell(2).innerText = user.fullName || "-";
        row.insertCell(3).innerHTML = '<span style="background: ' + userManagerGetRoleColor(user.role) + '; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; color: white;">' + userManagerEscapeHtml(user.role) + '</span>';
        row.insertCell(4).innerHTML = '<span style="background: ' + (user.status === 'active' ? '#10b981' : '#9ca3af') + '; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; color: white;">' + (user.status === 'active' ? 'Active' : 'Inactive') + '</span>';
        row.insertCell(5).innerText = user.createdDate || "-";
        row.insertCell(6).innerText = user.lastLogin || "Never";
        row.insertCell(7).innerHTML = `
            <button onclick="window.userManagerEditUser(${user.id})" style="background: none; border: none; color: #3498db; cursor: pointer; margin-right: 8px;" title="Edit User">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="window.userManagerResetPassword(${user.id})" style="background: none; border: none; color: #e67e22; cursor: pointer; margin-right: 8px;" title="Reset Password">
                <i class="fas fa-key"></i>
            </button>
            ${user.username !== 'admin' ? (user.status === 'active' ? 
                '<button onclick="window.userManagerDeactivateUser(' + user.id + ')" style="background: none; border: none; color: #dc2626; cursor: pointer;" title="Deactivate User"><i class="fas fa-user-slash"></i></button>' :
                '<button onclick="window.userManagerActivateUser(' + user.id + ')" style="background: none; border: none; color: #10b981; cursor: pointer;" title="Reactivate User"><i class="fas fa-user-check"></i></button>'
            ) : '<span style="color: #94a3b8;"><i class="fas fa-lock" title="Admin cannot be modified"></i></span>'}
        `;
    });
    
    userManagerUpdatePagination();
}

function userManagerUpdatePagination() {
    const totalPages = Math.ceil(userManagerUserList.length / userManagerRowsPerPage);
    const start = (userManagerCurrentPage - 1) * userManagerRowsPerPage + 1;
    const end = Math.min(userManagerCurrentPage * userManagerRowsPerPage, userManagerUserList.length);
    
    const startSpan = document.getElementById("userPageStart");
    const endSpan = document.getElementById("userPageEnd");
    const totalSpan = document.getElementById("userTotalCount");
    const infoSpan = document.getElementById("userPageInfo");
    const prevBtn = document.getElementById("userPrevPageBtn");
    const nextBtn = document.getElementById("userNextPageBtn");
    
    if (startSpan) startSpan.innerText = userManagerUserList.length > 0 ? start : 0;
    if (endSpan) endSpan.innerText = end;
    if (totalSpan) totalSpan.innerText = userManagerUserList.length;
    if (infoSpan) infoSpan.innerText = "Page " + userManagerCurrentPage + " of " + (totalPages || 1);
    if (prevBtn) prevBtn.disabled = userManagerCurrentPage === 1;
    if (nextBtn) nextBtn.disabled = userManagerCurrentPage >= totalPages;
}

// Search users
function userManagerSearchUsers() {
    const searchInput = document.getElementById("userSearchInput");
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === "") {
        userManagerLoadUserList();
        userManagerOriginalList = [];
        userManagerCurrentPage = 1;
        userManagerRenderTable();
        return;
    }
    
    const filtered = userManagerUserList.filter(function(u) {
        return u.username.toLowerCase().includes(searchTerm) || 
            (u.fullName && u.fullName.toLowerCase().includes(searchTerm)) ||
            u.role.toLowerCase().includes(searchTerm) ||
            (u.email && u.email.toLowerCase().includes(searchTerm));
    });
    
    if (filtered.length > 0) {
        userManagerOriginalList = [...userManagerUserList];
        userManagerUserList = filtered;
    } else {
        userManagerUserList = [];
    }
    userManagerCurrentPage = 1;
    userManagerRenderTable();
}

// Add new user
function userManagerAddNewUser() {
    console.log("addNewUser called");
    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value;
    const fullName = document.getElementById("newFullName").value.trim();
    const email = document.getElementById("newEmail").value.trim();
    const role = document.getElementById("newRole").value;
    
    if (!username) {
        alert("Username is required!");
        return;
    }
    
    if (!password) {
        alert("Password is required!");
        return;
    }
    
    if (password.length < 4) {
        alert("Password must be at least 4 characters!");
        return;
    }
    
    const exists = userManagerUserList.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
        alert("Username already exists! Please choose a different username.");
        return;
    }
    
    const maxId = userManagerUserList.length > 0 ? Math.max(...userManagerUserList.map(u => u.id)) : 0;
    const newId = maxId + 1;
    
    const newUser = {
        id: newId,
        username: username,
        password: password,
        fullName: fullName || "",
        email: email || "",
        role: role,
        status: "active",
        createdDate: new Date().toLocaleString(),
        lastLogin: null
    };
    
    userManagerUserList.push(newUser);
    userManagerSaveUserList();
    
    console.log("New user added:", newUser);
    
    const modal = document.getElementById("addUserModal");
    if (modal) modal.classList.add("hide");
    
    const form = document.getElementById("addUserForm");
    if (form) form.reset();
    
    userManagerOriginalList = [];
    userManagerRenderTable();
    
    alert("User '" + username + "' added successfully!");
}

// Edit user
function userManagerEditUser(userId) {
    const user = userManagerUserList.find(u => u.id === userId);
    if (!user) {
        alert("User not found!");
        return;
    }
    
    document.getElementById("editUserId").value = user.id;
    document.getElementById("editUsername").value = user.username;
    document.getElementById("editFullName").value = user.fullName || "";
    document.getElementById("editEmail").value = user.email || "";
    document.getElementById("editRole").value = user.role;
    document.getElementById("editStatus").value = user.status;
    
    const modal = document.getElementById("editUserModal");
    if (modal) modal.classList.remove("hide");
}

function userManagerSaveUserEdit() {
    const userId = parseInt(document.getElementById("editUserId").value);
    const fullName = document.getElementById("editFullName").value;
    const email = document.getElementById("editEmail").value;
    const role = document.getElementById("editRole").value;
    const status = document.getElementById("editStatus").value;
    
    const userIndex = userManagerUserList.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        alert("User not found!");
        return;
    }
    
    userManagerUserList[userIndex].fullName = fullName;
    userManagerUserList[userIndex].email = email;
    userManagerUserList[userIndex].role = role;
    userManagerUserList[userIndex].status = status;
    
    userManagerSaveUserList();
    
    const modal = document.getElementById("editUserModal");
    if (modal) modal.classList.add("hide");
    
    userManagerRenderTable();
    alert("User updated successfully!");
}

// Reset password
function userManagerResetPassword(userId) {
    const user = userManagerUserList.find(u => u.id === userId);
    if (!user) {
        alert("User not found!");
        return;
    }
    
    document.getElementById("resetUserId").value = userId;
    document.getElementById("resetUsername").value = user.username;
    document.getElementById("manualPassword").value = "";
    
    const autoRadio = document.getElementById("autoPassword");
    const manualRadio = document.getElementById("manualPassword");
    const manualPasswordDiv = document.getElementById("manualPasswordDiv");
    
    if (autoRadio) autoRadio.checked = true;
    if (manualRadio) manualRadio.checked = false;
    if (manualPasswordDiv) manualPasswordDiv.style.display = "none";
    
    const modal = document.getElementById("resetPasswordModal");
    if (modal) modal.classList.remove("hide");
}

function userManagerConfirmResetPassword() {
    const userId = parseInt(document.getElementById("resetUserId").value);
    const passwordType = document.querySelector('input[name="passwordType"]:checked')?.value || "auto";
    let newPassword = "";
    let username = "";
    
    if (passwordType === "manual") {
        newPassword = document.getElementById("manualPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        
        if (!newPassword) {
            alert("Please enter a password!");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        if (newPassword.length < 4) {
            alert("Password must be at least 4 characters!");
            return;
        }
    } else {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (let i = 0; i < 8; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    
    const userIndex = userManagerUserList.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        alert("User not found!");
        return;
    }
    
    username = userManagerUserList[userIndex].username;
    userManagerUserList[userIndex].password = newPassword;
    
    userManagerSaveUserList();
    
    const modal = document.getElementById("resetPasswordModal");
    if (modal) modal.classList.add("hide");
    
    if (passwordType === "auto") {
        alert("Password reset for '" + username + "'\n\nNew password: " + newPassword + "\n\nPlease save this password and share with the user.");
    } else {
        alert("Password reset successfully for '" + username + "'!");
    }
}

function userManagerGenerateRandomPassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById("manualPassword").value = password;
}

// Deactivate/Activate user
function userManagerDeactivateUser(userId) {
    if (confirm("Deactivate this user? They will not be able to login.")) {
        const userIndex = userManagerUserList.findIndex(u => u.id === userId && u.username !== "admin");
        if (userIndex !== -1) {
            userManagerUserList[userIndex].status = "inactive";
            userManagerSaveUserList();
            userManagerRenderTable();
            alert("User deactivated successfully!");
        } else {
            alert("Cannot deactivate admin user or user not found!");
        }
    }
}

function userManagerActivateUser(userId) {
    if (confirm("Activate this user?")) {
        const userIndex = userManagerUserList.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            userManagerUserList[userIndex].status = "active";
            userManagerSaveUserList();
            userManagerRenderTable();
            alert("User activated successfully!");
        } else {
            alert("User not found!");
        }
    }
}

// Change own password
function userManagerChangeOwnPassword() {
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newUserPassword").value;
    const confirmPassword = document.getElementById("confirmUserPassword").value;
    const currentUser = JSON.parse(localStorage.getItem("rtcCurrentUser") || "{}");
    
    if (!oldPassword || !newPassword) {
        alert("Please fill all fields!");
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert("New passwords do not match!");
        return;
    }
    
    if (newPassword.length < 4) {
        alert("Password must be at least 4 characters!");
        return;
    }
    
    const userIndex = userManagerUserList.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) {
        alert("User not found!");
        return;
    }
    
    if (userManagerUserList[userIndex].password === oldPassword) {
        userManagerUserList[userIndex].password = newPassword;
        userManagerSaveUserList();
        
        const modal = document.getElementById("changePasswordModal");
        if (modal) modal.classList.add("hide");
        
        document.getElementById("oldPassword").value = "";
        document.getElementById("newUserPassword").value = "";
        document.getElementById("confirmUserPassword").value = "";
        
        alert("Password changed successfully!");
    } else {
        alert("Current password is incorrect!");
    }
}

// View activity log
function userManagerViewActivityLog() {
    let storedLog = localStorage.getItem("keralaRtcActivityLog");
    let logs = [];
    if (storedLog) {
        try {
            logs = JSON.parse(storedLog);
        } catch(e) {
            console.error("Error parsing logs:", e);
        }
    }
    
    const tbody = document.getElementById("activityLogBody");
    if (!tbody) return;
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No activity records found.</td></tr>';
    } else {
        tbody.innerHTML = "";
        const displayLogs = logs.slice(0, 100);
        for (let i = 0; i < displayLogs.length; i++) {
            const log = displayLogs[i];
            const row = tbody.insertRow();
            row.insertCell(0).innerText = log.timestamp || "-";
            row.insertCell(1).innerText = log.action || "-";
            row.insertCell(2).innerText = log.details || "-";
            row.insertCell(3).innerText = log.user || "System";
        }
    }
    
    const modal = document.getElementById("activityLogModal");
    if (modal) modal.classList.remove("hide");
}

function userManagerClearActivityLog() {
    if (confirm("Delete all activity logs? This cannot be undone.")) {
        localStorage.removeItem("keralaRtcActivityLog");
        const modal = document.getElementById("activityLogModal");
        if (modal) modal.classList.add("hide");
        alert("Activity log cleared!");
    }
}

// Attach all event listeners
function userManagerAttachEvents() {
    console.log("Attaching user management events");
    
    const addUserBtn = document.getElementById("addUserBtn");
    if (addUserBtn) {
        addUserBtn.onclick = function() {
            const modal = document.getElementById("addUserModal");
            if (modal) modal.classList.remove("hide");
        };
    }
    
    const closeAdd = document.getElementById("closeAddUserModal");
    if (closeAdd) closeAdd.onclick = function() { 
        document.getElementById("addUserModal").classList.add("hide");
        document.getElementById("addUserForm")?.reset();
    };
    const closeAddBtn = document.getElementById("closeAddUserModalBtn");
    if (closeAddBtn) closeAddBtn.onclick = function() { 
        document.getElementById("addUserModal").classList.add("hide");
        document.getElementById("addUserForm")?.reset();
    };
    
    const submitAdd = document.getElementById("submitAddUser");
    if (submitAdd) submitAdd.onclick = userManagerAddNewUser;
    
    const closeEdit = document.getElementById("closeEditUserModal");
    if (closeEdit) closeEdit.onclick = function() { 
        document.getElementById("editUserModal").classList.add("hide");
    };
    const closeEditBtn = document.getElementById("closeEditUserModalBtn");
    if (closeEditBtn) closeEditBtn.onclick = function() { 
        document.getElementById("editUserModal").classList.add("hide");
    };
    
    const submitEdit = document.getElementById("submitEditUser");
    if (submitEdit) submitEdit.onclick = userManagerSaveUserEdit;
    
    const closeReset = document.getElementById("closeResetPasswordModal");
    if (closeReset) closeReset.onclick = function() { 
        document.getElementById("resetPasswordModal").classList.add("hide");
    };
    const closeResetBtn = document.getElementById("closeResetPasswordModalBtn");
    if (closeResetBtn) closeResetBtn.onclick = function() { 
        document.getElementById("resetPasswordModal").classList.add("hide");
    };
    
    const submitReset = document.getElementById("submitResetPassword");
    if (submitReset) submitReset.onclick = userManagerConfirmResetPassword;
    
    const genPass = document.getElementById("generatePasswordBtn");
    if (genPass) genPass.onclick = userManagerGenerateRandomPassword;
    
    const manualPasswordDiv = document.getElementById("manualPasswordDiv");
    const autoRadio = document.getElementById("autoPassword");
    const manualRadio = document.getElementById("manualPassword");
    if (autoRadio && manualRadio && manualPasswordDiv) {
        autoRadio.onchange = function() { manualPasswordDiv.style.display = "none"; };
        manualRadio.onchange = function() { manualPasswordDiv.style.display = "block"; };
        if (autoRadio.checked) manualPasswordDiv.style.display = "none";
        if (manualRadio.checked) manualPasswordDiv.style.display = "block";
    }
    
    const changeBtn = document.getElementById("changeOwnPasswordBtn");
    if (changeBtn) changeBtn.onclick = function() { 
        document.getElementById("changePasswordModal").classList.remove("hide");
        document.getElementById("oldPassword").value = "";
        document.getElementById("newUserPassword").value = "";
        document.getElementById("confirmUserPassword").value = "";
    };
    const closeChange = document.getElementById("closeChangePasswordModal");
    if (closeChange) closeChange.onclick = function() { 
        document.getElementById("changePasswordModal").classList.add("hide");
    };
    const closeChangeBtn = document.getElementById("closeChangePasswordModalBtn");
    if (closeChangeBtn) closeChangeBtn.onclick = function() { 
        document.getElementById("changePasswordModal").classList.add("hide");
    };
    const submitChange = document.getElementById("submitChangePassword");
    if (submitChange) submitChange.onclick = userManagerChangeOwnPassword;
    
    const logBtn = document.getElementById("viewActivityLogBtn");
    if (logBtn) logBtn.onclick = userManagerViewActivityLog;
    const closeLog = document.getElementById("closeActivityLogModal");
    if (closeLog) closeLog.onclick = function() { 
        document.getElementById("activityLogModal").classList.add("hide");
    };
    const closeLogBtn = document.getElementById("closeActivityLogModalBtn");
    if (closeLogBtn) closeLogBtn.onclick = function() { 
        document.getElementById("activityLogModal").classList.add("hide");
    };
    const clearLog = document.getElementById("clearActivityLogBtn");
    if (clearLog) clearLog.onclick = userManagerClearActivityLog;
    
    const prevBtn = document.getElementById("userPrevPageBtn");
    if (prevBtn) {
        prevBtn.onclick = function() {
            if (userManagerCurrentPage > 1) {
                userManagerCurrentPage--;
                userManagerRenderTable();
            }
        };
    }
    const nextBtn = document.getElementById("userNextPageBtn");
    if (nextBtn) {
        nextBtn.onclick = function() {
            const totalPages = Math.ceil(userManagerUserList.length / userManagerRowsPerPage);
            if (userManagerCurrentPage < totalPages) {
                userManagerCurrentPage++;
                userManagerRenderTable();
            }
        };
    }
    
    const searchInput = document.getElementById("userSearchInput");
    if (searchInput) searchInput.oninput = userManagerSearchUsers;
}

// Make functions global with unique names
window.userManagerEditUser = userManagerEditUser;
window.userManagerResetPassword = userManagerResetPassword;
window.userManagerDeactivateUser = userManagerDeactivateUser;
window.userManagerActivateUser = userManagerActivateUser;
window.userManagerAddNewUser = userManagerAddNewUser;

// Initialize
window.usermanager = {
    init: function() {
        console.log("usermanager init called");
        setTimeout(function() {
            userManagerInit();
        }, 100);
    },
    refresh: function() {
        userManagerLoadUserList();
        userManagerRenderTable();
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        userManagerInit();
    });
} else {
    userManagerInit();
}