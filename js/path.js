// ==================== PATH HANDLER FOR GITHUB PAGES ====================
(function() {
    // Get the base path dynamically for GitHub Pages
    function getBasePath() {
        const path = window.location.pathname;
        
        // If we're in a subdirectory (like /kerala-rtc-fleet/), use that as base
        if (path.includes('/kerala-rtc-fleet/')) {
            return '/kerala-rtc-fleet/';
        }
        
        // If we're at root
        if (path === '/' || path === '/index.html') {
            return '/';
        }
        
        // If we're in a subdirectory, extract it
        const lastSlash = path.lastIndexOf('/');
        if (lastSlash > 0) {
            const base = path.substring(0, lastSlash + 1);
            return base;
        }
        
        return '/';
    }

    window.basePath = getBasePath();
    console.log("Base path set to:", window.basePath);
    
    // Helper function for navigation
    window.navigateTo = function(page) {
        const target = window.basePath + page;
        console.log("Navigating to:", target);
        window.location.href = target;
    };
    
    // Helper function for asset paths
    window.getAssetPath = function(asset) {
        return window.basePath + asset;
    };
})();