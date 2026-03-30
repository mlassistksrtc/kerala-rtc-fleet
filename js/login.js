// ==================== LOGIN MODULE ====================

// Configuration
const CONFIG = {
    DEFAULT_USERS: [
        { id: 1, username: "admin", password: "admin123", fullName: "Administrator", email: "admin@keralartc.com", role: "admin", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null },
        { id: 2, username: "supervisor", password: "super123", fullName: "Supervisor", email: "supervisor@keralartc.com", role: "supervisor", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null },
        { id: 3, username: "operator", password: "oper123", fullName: "Operator", email: "operator@keralartc.com", role: "operator", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null },
        { id: 4, username: "viewer", password: "view123", fullName: "Viewer", email: "viewer@keralartc.com", role: "viewer", status: "active", createdDate: new Date().toLocaleString(), lastLogin: null }
    ]
};

// Load saved username from localStorage
window.onload = function() {
    // Clear any existing session to force fresh login
    localStorage.removeItem("rtcCurrentUser");
    
    // Load saved username if exists
    const savedUser = localStorage.getItem("ksrtc_remembered_user");
    if (savedUser) {
        document.getElementById("username").value = savedUser;
        document.getElementById("remember").checked = true;
    }
    
    // Focus on username field
    setTimeout(() => {
        document.getElementById("username").focus();
    }, 100);
    
    // Ensure default users exist with active status
    ensureDefaultUsersExist();
    
    // Setup credential buttons
    setupCredentialButtons();
    
    // Check if there are any users in localStorage
    validateUserStorage();
};

// Validate and fix user storage
function validateUserStorage() {
    try {
        let users = localStorage.getItem("rtcFleetUsers");
        if (!users) {
            console.log("No users found, creating default users...");
            localStorage.setItem("rtcFleetUsers", JSON.stringify(CONFIG.DEFAULT_USERS));
            return;
        }
        
        let parsedUsers = JSON.parse(users);
        if (!Array.isArray(parsedUsers) || parsedUsers.length === 0) {
            console.log("Invalid users array, resetting to defaults...");
            localStorage.setItem("rtcFleetUsers", JSON.stringify(CONFIG.DEFAULT_USERS));
            return;
        }
        
        // Ensure admin user exists and is active
        const adminExists = parsedUsers.some(u => u.username === "admin");
        if (!adminExists) {
            console.log("Admin user missing, adding default users...");
            const mergedUsers = [...CONFIG.DEFAULT_USERS, ...parsedUsers];
            const uniqueUsers = [];
            const usernames = new Set();
            
            for (const user of mergedUsers) {
                if (!usernames.has(user.username)) {
                    usernames.add(user.username);
                    uniqueUsers.push(user);
                }
            }
            localStorage.setItem("rtcFleetUsers", JSON.stringify(uniqueUsers));
        }
        
        console.log("User storage validated. Total users:", parsedUsers.length);
    } catch(e) {
        console.error("Error validating user storage:", e);
        localStorage.setItem("rtcFleetUsers", JSON.stringify(CONFIG.DEFAULT_USERS));
    }
}

// Ensure default users exist with active status
function ensureDefaultUsersExist() {
    let users = [];
    const storedUsers = localStorage.getItem("rtcFleetUsers");
    
    if (storedUsers) {
        try {
            users = JSON.parse(storedUsers);
            console.log("Existing users found:", users.length);
            
            // Check if admin exists and has active status
            const adminUser = users.find(u => u.username === "admin");
            if (!adminUser) {
                console.log("Admin user missing, merging defaults");
                // Merge default users with existing users
                const mergedUsers = [...CONFIG.DEFAULT_USERS];
                for (const existingUser of users) {
                    if (!mergedUsers.some(u => u.username === existingUser.username)) {
                        mergedUsers.push(existingUser);
                    }
                }
                users = mergedUsers;
                localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
                console.log("Users merged, total:", users.length);
            } else {
                // Ensure admin is active
                if (adminUser.status !== "active") {
                    adminUser.status = "active";
                    localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
                    console.log("Fixed admin status to active");
                }
                
                // Ensure all users have required fields
                let needsUpdate = false;
                for (const user of users) {
                    if (!user.createdDate) {
                        user.createdDate = new Date().toLocaleString();
                        needsUpdate = true;
                    }
                    if (!user.email) {
                        user.email = `${user.username}@keralartc.com`;
                        needsUpdate = true;
                    }
                    if (!user.fullName) {
                        user.fullName = user.username.charAt(0).toUpperCase() + user.username.slice(1);
                        needsUpdate = true;
                    }
                }
                if (needsUpdate) {
                    localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
                    console.log("Updated user records with missing fields");
                }
            }
        } catch(e) {
            console.error("Error parsing users:", e);
            users = CONFIG.DEFAULT_USERS;
            localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
        }
    } else {
        console.log("No users found, creating default users");
        users = CONFIG.DEFAULT_USERS;
        localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
    }
    
    // Verify storage was successful
    const verifyStorage = localStorage.getItem("rtcFleetUsers");
    if (!verifyStorage) {
        console.error("Failed to save users to localStorage!");
        localStorage.setItem("rtcFleetUsers", JSON.stringify(CONFIG.DEFAULT_USERS));
    }
}

// Setup credential selector buttons
function setupCredentialButtons() {
    const credButtons = document.querySelectorAll('.cred-btn');
    
    if (credButtons.length === 0) {
        console.log("No credential buttons found");
        return;
    }
    
    credButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const username = this.getAttribute('data-username');
            const password = this.getAttribute('data-password');
            
            if (username && password) {
                document.getElementById("username").value = username;
                document.getElementById("password").value = password;
                
                // Visual feedback
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
                
                // Highlight fields
                const usernameField = document.getElementById("username");
                const passwordField = document.getElementById("password");
                usernameField.style.borderColor = '#e67e22';
                passwordField.style.borderColor = '#e67e22';
                setTimeout(() => {
                    usernameField.style.borderColor = '';
                    passwordField.style.borderColor = '';
                }, 500);
            }
        });
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");
    
    if (!errorDiv || !errorText) {
        console.error("Error elements not found");
        alert(message);
        return;
    }
    
    errorText.textContent = message;
    errorDiv.classList.remove("hide");
    
    setTimeout(() => {
        errorDiv.classList.add("hide");
    }, 3000);
}

// Hide error message
function hideError() {
    const errorDiv = document.getElementById("errorMessage");
    if (errorDiv) {
        errorDiv.classList.add("hide");
    }
}

// Add activity log entry
function addActivityLog(userId, username, action, details) {
    try {
        let activityLog = [];
        const storedLog = localStorage.getItem("keralaRtcActivityLog");
        if (storedLog) {
            try {
                activityLog = JSON.parse(storedLog);
                if (!Array.isArray(activityLog)) activityLog = [];
            } catch(e) {
                activityLog = [];
            }
        }
        
        activityLog.unshift({
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            action: action,
            details: details,
            user: username,
            userId: userId
        });
        
        // Keep only last 1000 entries
        if (activityLog.length > 1000) {
            activityLog = activityLog.slice(0, 1000);
        }
        
        localStorage.setItem("keralaRtcActivityLog", JSON.stringify(activityLog));
    } catch(e) {
        console.error("Error adding activity log:", e);
    }
}

// Handle login
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    hideError();
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember").checked;
    const loginBtn = document.getElementById("loginBtn");
    
    if (!username || !password) {
        showError("Please enter both username and password");
        return;
    }
    
    // Show loading state
    loginBtn.classList.add("loading");
    const originalBtnHTML = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>LOGGING IN...</span>';
    loginBtn.disabled = true;
    
    // Small delay for better UX
    setTimeout(() => {
        try {
            // Get users from localStorage
            let users = [];
            const storedUsers = localStorage.getItem("rtcFleetUsers");
            
            if (storedUsers) {
                try {
                    users = JSON.parse(storedUsers);
                    if (!Array.isArray(users)) {
                        console.error("Users is not an array, resetting");
                        users = [];
                    }
                } catch(e) {
                    console.error("Error parsing users:", e);
                    users = [];
                }
            }
            
            // If no users found, create from defaults
            if (users.length === 0) {
                console.log("No users found, creating default users");
                users = JSON.parse(JSON.stringify(CONFIG.DEFAULT_USERS));
                localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
            }
            
            // Find user (case insensitive username)
            const foundUser = users.find(u => 
                u && u.username && u.password && 
                u.username.toLowerCase() === username.toLowerCase() && 
                u.password === password
            );
            
            if (foundUser) {
                // Check if account is active
                if (foundUser.status !== "active") {
                    showError("Your account is inactive. Please contact administrator.");
                    resetLoginButton(loginBtn, originalBtnHTML);
                    document.getElementById("password").value = "";
                    return;
                }
                
                // Update last login
                foundUser.lastLogin = new Date().toLocaleString();
                localStorage.setItem("rtcFleetUsers", JSON.stringify(users));
                
                // Save session
                const sessionUser = {
                    id: foundUser.id,
                    username: foundUser.username,
                    role: foundUser.role,
                    fullName: foundUser.fullName || foundUser.username,
                    email: foundUser.email || ""
                };
                localStorage.setItem("rtcCurrentUser", JSON.stringify(sessionUser));
                
                // Save remember me
                if (remember) {
                    localStorage.setItem("ksrtc_remembered_user", username);
                } else {
                    localStorage.removeItem("ksrtc_remembered_user");
                }
                
                // Add activity log
                addActivityLog(
                    foundUser.id, 
                    foundUser.username, 
                    "LOGIN", 
                    `User ${foundUser.username} (${foundUser.role}) logged in successfully`
                );
                
                console.log("Login successful, redirecting to dashboard...");
                
                // Redirect to dashboard
                window.location.href = "index.html";
            } else {
                // Check if username exists but password wrong
                const userExists = users.some(u => u && u.username && u.username.toLowerCase() === username.toLowerCase());
                if (userExists) {
                    showError("Invalid password. Please try again.");
                } else {
                    showError("Invalid username. Please check your credentials.");
                }
                
                resetLoginButton(loginBtn, originalBtnHTML);
                document.getElementById("password").value = "";
                document.getElementById("password").focus();
                
                // Add failed login attempt to log
                addActivityLog(0, username, "LOGIN_FAILED", `Failed login attempt for username: ${username}`);
            }
        } catch(error) {
            console.error("Login error:", error);
            showError("An error occurred during login. Please try again.");
            resetLoginButton(loginBtn, originalBtnHTML);
        }
    }, 500);
});

// Reset login button state
function resetLoginButton(button, originalHTML) {
    button.classList.remove("loading");
    button.innerHTML = originalHTML;
    button.disabled = false;
}

// Forgot password handler
const forgotPasswordLink = document.getElementById("forgotPassword");
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function(e) {
        e.preventDefault();
        
        // Show modal or alert with contact info
        const modalHtml = `
            <div id="forgotPasswordModal" class="forgot-modal">
                <div class="modal-card">
                    <div class="modal-header" style="background: linear-gradient(135deg, #e67e22, #f39c12);">
                        <h3><i class="fas fa-key"></i> Reset Password</h3>
                        <button class="modal-close" onclick="closeForgotModal()">&times;</button>
                    </div>
                    <div class="modal-content">
                        <p><i class="fas fa-info-circle"></i> Please contact the system administrator to reset your password.</p>
                        <p><i class="fas fa-envelope"></i> <strong>Email:</strong> mlassistksrtc@gmail.com</p>
                        <p><i class="fas fa-phone"></i> <strong>Phone:</strong> +91 9446220755</p>
                        <hr style="margin: 15px 0;">
                        <p style="font-size: 0.8rem; color: #6b7280;">
                            <i class="fas fa-lock"></i> <strong>Default Login Credentials:</strong><br>
                            • Admin: admin / admin123<br>
                            • Supervisor: supervisor / super123<br>
                            • Operator: operator / oper123<br>
                            • Viewer: viewer / view123
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="closeForgotModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Check if modal already exists
        let existingModal = document.getElementById("forgotPasswordModal");
        if (existingModal) {
            existingModal.classList.remove("hide");
        } else {
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        // Add styles if not present
        if (!document.getElementById("forgotModalStyles")) {
            const styles = document.createElement('style');
            styles.id = "forgotModalStyles";
            styles.textContent = `
                .forgot-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .forgot-modal .modal-card {
                    background: white;
                    max-width: 450px;
                    width: 90%;
                    border-radius: 24px;
                    overflow: hidden;
                    animation: slideIn 0.3s ease;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                }
                .forgot-modal .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                }
                .forgot-modal .modal-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .forgot-modal .modal-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .forgot-modal .modal-content {
                    padding: 20px;
                }
                .forgot-modal .modal-content p {
                    margin-bottom: 12px;
                    color: #374151;
                    line-height: 1.5;
                }
                .forgot-modal .modal-content i {
                    color: #e67e22;
                    width: 24px;
                    margin-right: 8px;
                }
                .forgot-modal .modal-footer {
                    padding: 16px 20px;
                    background: #f8fafc;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    border-top: 1px solid #e2e8f0;
                }
                .btn-primary {
                    background: #e67e22;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .btn-primary:hover {
                    background: #d35400;
                }
                @keyframes slideIn {
                    from { transform: translateY(-30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
    });
}

// Close forgot password modal
window.closeForgotModal = function() {
    const modal = document.getElementById("forgotPasswordModal");
    if (modal) {
        modal.remove();
    }
};

// Clear error when typing
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

if (usernameInput) {
    usernameInput.addEventListener("input", hideError);
}
if (passwordInput) {
    passwordInput.addEventListener("input", hideError);
}

// Add enter key support
if (passwordInput) {
    passwordInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            document.getElementById("loginForm").dispatchEvent(new Event("submit"));
        }
    });
}

// Export for debugging
window.loginModule = {
    validateUserStorage,
    ensureDefaultUsersExist,
    addActivityLog,
    CONFIG
};

console.log("Login module loaded successfully");