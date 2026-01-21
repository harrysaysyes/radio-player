#!/bin/bash

# Navigate to the app directory
cd "$(dirname "$0")/../app" || exit

echo "🎵 Radio Player Setup"
echo "===================="
echo ""

# Check if icon files exist
if [ ! -f "assets/icons/icon-192.png" ] || [ ! -f "assets/icons/icon-512.png" ]; then
    echo "⚠️  App icons not found!"
    echo ""
    echo "Please create the icons first:"
    echo "1. Open 'assets/create-icons.html' in your browser"
    echo "2. Download both icon files (192x192 and 512x512)"
    echo "3. Save them in 'assets/icons/' folder"
    echo ""
    read -p "Press Enter once you've created the icons..."
fi

# Get local IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ipconfig getifaddr en0)
    if [ -z "$IP" ]; then
        IP=$(ipconfig getifaddr en1)
    fi
else
    # Linux
    IP=$(hostname -I | awk '{print $1}')
fi

echo ""
echo "✅ Starting local web server from: $(pwd)"
echo ""
echo "📱 On your iPhone:"
echo "   1. Connect to the same WiFi network"
echo "   2. Open Safari (must be Safari)"
echo "   3. Go to: http://$IP:8000/radio-player.html"
echo "   4. Tap Share → Add to Home Screen"
echo ""
echo "💻 Or test in browser:"
echo "   http://localhost:8000/radio-player.html"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""
echo "----------------------------------------"
echo ""

# Start Python server
python3 -m http.server 8000
