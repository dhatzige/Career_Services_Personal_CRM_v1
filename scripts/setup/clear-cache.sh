#!/bin/bash

echo "Clearing all caches..."

# Clear Vite cache
rm -rf node_modules/.vite

# Clear parcel cache if exists
rm -rf .parcel-cache

# Clear any React refresh cache
rm -rf node_modules/.cache

# Kill any running dev servers
pkill -f "vite" || true
pkill -f "node" || true

# Clear browser storage (create HTML file to do this)
cat > clear-browser-cache.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Clear Cache</title>
</head>
<body>
    <h1>Clearing browser cache...</h1>
    <script>
        // Clear all browser storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear service workers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                }
            });
        }
        
        // Clear IndexedDB
        if (window.indexedDB) {
            indexedDB.databases().then(databases => {
                databases.forEach(db => {
                    indexedDB.deleteDatabase(db.name);
                });
            });
        }
        
        // Clear caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        
        document.body.innerHTML = '<h1>Cache cleared! You can close this window.</h1>';
    </script>
</body>
</html>
EOF

echo "Cache clearing complete!"
echo "Please open clear-browser-cache.html in your browser to clear browser cache"