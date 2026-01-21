# 📂 Radio Player - Folder Structure

This document explains the organization of all files in the Radio Player project.

---

## 📁 Complete Structure

```
Radio/
│
├── 📄 README.md                          # Main documentation - START HERE!
├── 📄 FOLDER-STRUCTURE.md               # This file
├── 📄 .gitignore                        # Git ignore rules
│
├── 📂 app/                               # 🎯 Application Files
│   ├── radio-player.html                # Main app - open this in browser
│   ├── manifest.json                    # PWA configuration
│   ├── service-worker.js                # Offline caching & PWA features
│   │
│   └── 📂 assets/
│       ├── create-icons.html            # Tool to generate app icons
│       │
│       └── 📂 icons/                    # App icons (create these!)
│           ├── icon-192.png             # Small app icon (you create this)
│           └── icon-512.png             # Large app icon (you create this)
│
├── 📂 docs/                              # 📚 Documentation
│   ├── INSTALL.md                       # How to install as PWA
│   ├── CARPLAY.md                       # CarPlay integration guide
│   ├── QUICK-START-NATIVE.md            # Quick start for native apps
│   ├── NATIVE-APP-GUIDE.md              # Compare native app options
│   ├── CAPACITOR-SETUP.md               # Build native with Capacitor
│   ├── REACT-NATIVE-SETUP.md            # Build native with React Native
│   └── SWIFT-NATIVE-SETUP.md            # Build native with Swift
│
└── 📂 scripts/                           # 🔧 Utility Scripts
    └── start-server.sh                  # Launch local development server
```

---

## 📋 File Descriptions

### Root Level

| File | Purpose |
|------|---------|
| `README.md` | Main documentation with quick start guide |
| `FOLDER-STRUCTURE.md` | This file - explains organization |
| `.gitignore` | Files to exclude from version control |

### `app/` - Application Files

**Main Files:**
| File | Purpose |
|------|---------|
| `radio-player.html` | The radio player app (HTML/CSS/JavaScript) |
| `manifest.json` | PWA configuration (app name, icons, colors) |
| `service-worker.js` | Enables offline mode and caching |

**Assets:**
| Path | Purpose |
|------|---------|
| `assets/create-icons.html` | Tool to generate app icons |
| `assets/icons/` | Folder for app icon files |
| `assets/icons/icon-192.png` | 192x192 app icon (you create) |
| `assets/icons/icon-512.png` | 512x512 app icon (you create) |

### `docs/` - Documentation

| File | What It Covers |
|------|----------------|
| `INSTALL.md` | How to install as PWA on iPhone |
| `CARPLAY.md` | Complete CarPlay integration guide |
| `QUICK-START-NATIVE.md` | Choose your native app approach |
| `NATIVE-APP-GUIDE.md` | Detailed comparison of 3 native options |
| `CAPACITOR-SETUP.md` | Build native app with Capacitor (easiest) |
| `REACT-NATIVE-SETUP.md` | Build native app with React Native |
| `SWIFT-NATIVE-SETUP.md` | Build native app with Swift/SwiftUI |

### `scripts/` - Utility Scripts

| File | Purpose |
|------|---------|
| `start-server.sh` | Starts local web server for testing |

---

## 🎯 Quick Navigation

### I want to...

**Use it as a web app:**
1. `app/assets/create-icons.html` - Create icons
2. `scripts/start-server.sh` - Start server
3. `docs/INSTALL.md` - Install on iPhone

**Use it in my car:**
1. Install app first (see above)
2. `docs/CARPLAY.md` - CarPlay guide

**Build a native app:**
1. `docs/QUICK-START-NATIVE.md` - Choose approach
2. `docs/CAPACITOR-SETUP.md` - Recommended path

**Customize the app:**
1. `app/radio-player.html` - Edit this file
2. `app/manifest.json` - Change app name/colors

---

## 🔍 File Locations by Task

### Setting Up for First Use

```bash
1. Create icons:
   open app/assets/create-icons.html

2. Save icons to:
   app/assets/icons/icon-192.png
   app/assets/icons/icon-512.png

3. Start server:
   ./scripts/start-server.sh

4. Follow install guide:
   docs/INSTALL.md
```

### Development Workflow

```bash
# Edit the app
vim app/radio-player.html

# Test changes
./scripts/start-server.sh
# Open http://localhost:8000/radio-player.html

# Deploy
# Upload files from app/ folder to hosting
```

### Building Native App

```bash
# Read guides
docs/QUICK-START-NATIVE.md
docs/CAPACITOR-SETUP.md

# Run from app/ directory
cd app
npx cap init
npx cap add ios
```

---

## 📦 What Goes Where

### App Code
**Location:** `app/`
- HTML, CSS, JavaScript
- PWA configuration files
- Assets (icons, etc.)

### Documentation
**Location:** `docs/`
- Installation guides
- CarPlay documentation
- Native app build guides

### Tools & Scripts
**Location:** `scripts/`
- Server launcher
- Build scripts (if you add any)

---

## 🚀 Deployment

### For PWA (Web App)

**Upload these files from `app/`:**
- `radio-player.html`
- `manifest.json`
- `service-worker.js`
- `assets/` (entire folder)

**To:**
- GitHub Pages
- Netlify
- Any web host

### For Native App

**Use all files in:**
- `app/` - Your web code
- Follow guides in `docs/` for build process

---

## 🔄 Version Control (Git)

The `.gitignore` file excludes:
- `node_modules/` (if using Capacitor)
- `ios/` and `android/` (generated native projects)
- Icon files (users create their own)
- Build artifacts

**To version control this project:**
```bash
git init
git add .
git commit -m "Initial commit"
```

Icon files in `app/assets/icons/*.png` are gitignored - users create their own using `create-icons.html`.

---

## 💡 Tips

### Starting Fresh?
1. Read `README.md` first
2. Create icons with `app/assets/create-icons.html`
3. Run `./scripts/start-server.sh`
4. Follow `docs/INSTALL.md`

### Going Native?
1. Start with `docs/QUICK-START-NATIVE.md`
2. Choose your approach
3. Follow the specific setup guide

### Need Help?
- Check `docs/INSTALL.md` for PWA issues
- Check `docs/CARPLAY.md` for CarPlay issues
- Check specific native guide for build issues

---

**Everything is organized to make it easy to find what you need!**
