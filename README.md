# 📻 Radio Player

**Stream Classic FM and Reprezent Radio on your iPhone, with full CarPlay support.**

A Progressive Web App (PWA) that works like a native iOS app - installable to your home screen, plays in the background, and integrates with CarPlay.

---

## 🚀 Quick Start

### Option 1: Use as Web App (PWA)
1. **Create icons**: Open `app/assets/create-icons.html` in browser
2. **Start server**: `cd Radio && ./scripts/start-server.sh`
3. **Install on iPhone**: See `docs/INSTALL.md`

### Option 2: Build Native iOS App
1. **Choose your path**: See `docs/QUICK-START-NATIVE.md`
2. **Recommended**: Follow `docs/CAPACITOR-SETUP.md` (30 min)

---

## ✨ Features

### 🎵 Radio
- Classic FM streaming
- Reprezent 107.3 FM streaming
- Now playing info (Classic FM)
- Custom stream URL support
- Volume control

### 📱 Mobile
- Works like native app
- Add to home screen
- Fullscreen interface
- Lock screen controls
- Background audio playback
- Prevents phone sleep while playing

### 🚗 CarPlay
- Control from car display
- Station info and artwork
- Play/pause/stop controls
- Switch stations with next/previous
- Works in background with Maps

---

## 📁 Folder Structure

```
Radio/
├── README.md                  # This file
├── app/                       # Application files
│   ├── radio-player.html     # Main app (open this!)
│   ├── manifest.json         # PWA configuration
│   ├── service-worker.js     # Offline support
│   └── assets/
│       ├── create-icons.html # Icon generator tool
│       └── icons/            # App icons (create these first)
├── docs/                      # Documentation
│   ├── INSTALL.md            # PWA installation guide
│   ├── CARPLAY.md            # CarPlay integration guide
│   ├── QUICK-START-NATIVE.md # Native app quick start
│   ├── NATIVE-APP-GUIDE.md   # Compare native app options
│   ├── CAPACITOR-SETUP.md    # Native with Capacitor (easiest)
│   ├── REACT-NATIVE-SETUP.md # Native with React Native
│   └── SWIFT-NATIVE-SETUP.md # Native with Swift
└── scripts/
    └── start-server.sh       # Quick server launcher
```

---

## 📖 Documentation

### Getting Started
- **[Installation Guide](docs/INSTALL.md)** - Install as PWA on iPhone
- **[CarPlay Guide](docs/CARPLAY.md)** - Use with CarPlay in your car

### Going Native
- **[Quick Start: Native App](docs/QUICK-START-NATIVE.md)** - Choose your approach
- **[Native App Overview](docs/NATIVE-APP-GUIDE.md)** - Compare all options
- **[Capacitor Setup](docs/CAPACITOR-SETUP.md)** - ⭐ Recommended (30 min)
- **[React Native Setup](docs/REACT-NATIVE-SETUP.md)** - For JavaScript devs
- **[Swift Native Setup](docs/SWIFT-NATIVE-SETUP.md)** - For iOS developers

---

## 🎯 Usage

### As PWA (Progressive Web App)

**Step 1: Create Icons**
```bash
cd Radio
open app/assets/create-icons.html
# Download both icons and save to app/assets/icons/
```

**Step 2: Start Server**
```bash
./scripts/start-server.sh
```

**Step 3: Install on iPhone**
1. Open Safari on your iPhone
2. Go to the URL shown in terminal
3. Tap Share → Add to Home Screen
4. Name it "Radio" and tap Add

**Done!** The app icon appears on your home screen.

### As Native App

See `docs/QUICK-START-NATIVE.md` to choose:
- **Capacitor** (easiest) - 30 minutes
- **React Native** (better performance) - 2-4 hours
- **Swift** (most powerful) - 4-8 hours

---

## 🚗 CarPlay Support

Your radio player integrates with CarPlay automatically:

1. Install app on iPhone (PWA or native)
2. Connect iPhone to CarPlay
3. Start playing a station
4. Control from car display and steering wheel

See [docs/CARPLAY.md](docs/CARPLAY.md) for full guide.

---

## 🛠️ Development

### File Locations
- **Main app**: `app/radio-player.html`
- **PWA config**: `app/manifest.json`
- **Service worker**: `app/service-worker.js`
- **Icons**: `app/assets/icons/`

### Quick Commands
```bash
# Start dev server
./scripts/start-server.sh

# Create icons
open app/assets/create-icons.html

# Build native (Capacitor)
cd app
npx cap init
npx cap add ios
npx cap open ios
```

---

## 📱 Deployment Options

### 1. Local Testing
```bash
./scripts/start-server.sh
# Access from iPhone on same WiFi
```

### 2. GitHub Pages (Free)
1. Create GitHub repo
2. Upload all files from `app/` folder
3. Enable GitHub Pages
4. Visit: `https://yourusername.github.io/repo-name/radio-player.html`

### 3. Netlify (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Drag & drop `app/` folder
3. Get instant HTTPS URL

### 4. App Store (Native)
- Follow native app guides in `docs/`
- Requires $99/year Apple Developer account

---

## ⚙️ Customization

### Add More Stations
Edit `app/radio-player.html`, find the station buttons section:

```html
<button class="station-btn"
    data-station="mystation"
    data-url="https://stream-url.com/live.mp3"
    data-name="My Station">
```

### Change Theme Colors
Edit the CSS in `app/radio-player.html`:
- Classic FM theme: `body.theme-classicfm`
- Reprezent theme: `body.theme-reprezent`

### Update Metadata Sources
Edit metadata fetching functions:
- `fetchClassicFMNowPlaying()`
- `fetchReprezentNowPlaying()`

---

## 🔧 Troubleshooting

### PWA Issues
**Can't install to home screen?**
- Must use Safari (not Chrome)
- Must be served over HTTPS

**No sound?**
- Check iPhone volume
- Disable Silent mode
- Try stopping and restarting

### CarPlay Issues
**Not showing in CarPlay?**
- Make sure audio is playing
- Try disconnecting and reconnecting
- Check CarPlay settings on iPhone

See [docs/CARPLAY.md](docs/CARPLAY.md) for detailed troubleshooting.

---

## 💰 Cost

### PWA (Current Setup)
- **Development**: FREE
- **Hosting**: FREE (GitHub Pages, Netlify)
- **No App Store needed**

### Native App
- **Development**: FREE
- **App Store**: $99/year (Apple Developer account)
- **Optional**: Can test free without App Store

---

## 📄 License

Free to use and modify for personal use.

---

## 🎉 What's Next?

1. **Test it**: `./scripts/start-server.sh` and open on iPhone
2. **Install it**: Follow `docs/INSTALL.md`
3. **Use in car**: See `docs/CARPLAY.md`
4. **Go native**: Check `docs/QUICK-START-NATIVE.md`

---

**Questions? Check the docs in the `docs/` folder!**

**Enjoy your radio! 🎵🚗📱**
