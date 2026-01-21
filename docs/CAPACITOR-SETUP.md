# Building Native App with Capacitor

This guide will turn your radio player into a real native iOS app in about 30 minutes.

## What You'll Get

✅ Native iOS app installable via Xcode or App Store
✅ Full CarPlay integration (appears in CarPlay app grid)
✅ Background audio that actually works
✅ Same code as your web app (easy to maintain)
✅ Can also build for Android later

---

## Prerequisites

- Mac computer with macOS
- Xcode installed (free from App Store)
- Node.js installed (check: `node --version`)
- Your existing radio player files

---

## Step 1: Install Capacitor

```bash
# Navigate to your project
cd /Users/hullo/ralph

# Install Capacitor CLI
npm install -g @capacitor/cli

# Initialize Capacitor
npx cap init "Radio Player" "com.yourname.radioplayer" --web-dir .
```

When prompted:
- **App name:** Radio Player
- **App ID:** com.yourname.radioplayer (use your name/company)
- **Web directory:** . (current directory)

---

## Step 2: Add iOS Platform

```bash
# Add iOS platform
npm install @capacitor/ios
npx cap add ios

# This creates an ios/ folder with your Xcode project
```

---

## Step 3: Configure for Audio & CarPlay

Create a file called `capacitor.config.json`:

```json
{
  "appId": "com.yourname.radioplayer",
  "appName": "Radio Player",
  "webDir": ".",
  "bundledWebRuntime": false,
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0
    }
  },
  "ios": {
    "contentInset": "always",
    "backgroundColor": "#2c3e50"
  }
}
```

---

## Step 4: Update Info.plist for CarPlay

```bash
# Open the iOS project
npx cap open ios
```

In Xcode:
1. Click on **App** in the left sidebar
2. Select **App** target
3. Go to **Info** tab
4. Click the **+** button to add:

```xml
Required background modes
  - Audio, AirPlay, and Picture in Picture

Privacy - Microphone Usage Description
  - "Radio Player uses audio for streaming radio stations"

Supported interface orientations
  - Portrait
```

5. For CarPlay, add to Info.plist (right-click > Open As > Source Code):

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

---

## Step 5: Update Your HTML for Capacitor

Edit `radio-player.html` - add this near the top of the `<head>`:

```html
<!-- Capacitor: native bridge -->
<script type="module">
  import { CapacitorUpdater } from '@capacitor/core';
</script>
```

At the end of your JavaScript (before closing `</script>`), add:

```javascript
// Capacitor-specific optimizations
if (window.Capacitor) {
    console.log('Running as native app!');

    // Better audio handling for native
    if (window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
            if (state.isActive && audio && audio.paused) {
                // Optionally resume when app comes to foreground
                console.log('App is active');
            }
        });
    }
}
```

---

## Step 6: Build and Run

```bash
# Copy web files to native project
npx cap copy ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select your iPhone from the device dropdown (or simulator)
2. Click the **Play** button (▶️)
3. Your app will install and launch on your phone!

---

## Step 7: Test CarPlay

### Using CarPlay Simulator:
1. In Xcode, go to **Hardware > External Displays > CarPlay**
2. Start your app
3. Play a station
4. The CarPlay simulator should show your audio controls

### Using Real Car:
1. Connect iPhone to car via USB or Bluetooth
2. Open your Radio Player app
3. Start playing
4. Access from CarPlay screen

---

## Step 8: Prepare for App Store (Optional)

### Add Icons

Create app icons using this tool:
- Go to [appicon.co](https://appicon.co)
- Upload your `icon-512.png`
- Download the iOS icon set
- Drag into Xcode's **Assets.xcassets > AppIcon**

### Update App Details

In Xcode:
1. Select **App** target
2. Go to **General** tab
3. Set:
   - **Display Name:** Radio Player
   - **Bundle Identifier:** com.yourname.radioplayer
   - **Version:** 1.0
   - **Build:** 1

### Add Launch Screen

1. In Xcode, select **LaunchScreen.storyboard**
2. Add your radio player logo or just a solid color

---

## Step 9: Build for Release

In Xcode:
1. Select **Any iOS Device** from device dropdown
2. Go to **Product > Archive**
3. Once complete, click **Distribute App**
4. Choose **App Store Connect**
5. Follow the wizard to upload

Then go to [App Store Connect](https://appstoreconnect.apple.com):
1. Create a new app
2. Fill in app details
3. Add screenshots
4. Submit for review

**Review takes 1-3 days**

---

## Updating Your App

When you change your web code:

```bash
# Copy changes to native app
npx cap copy ios

# Open in Xcode
npx cap open ios

# Build and run
```

---

## Troubleshooting

### App won't build
```bash
# Clean and rebuild
npx cap sync ios
npx cap open ios
# In Xcode: Product > Clean Build Folder
```

### Audio doesn't play in background
- Make sure you added "Audio" to **UIBackgroundModes** in Info.plist
- Check that audio session is configured correctly

### CarPlay doesn't show
- Verify **UIBackgroundModes** includes "audio"
- Make sure audio is actively playing
- Try disconnecting and reconnecting CarPlay

### Changes not appearing
```bash
# Force sync
npx cap sync ios --force
```

---

## File Structure After Setup

```
ralph/
├── radio-player.html          # Your web app
├── manifest.json
├── service-worker.js
├── capacitor.config.json      # NEW: Capacitor config
├── package.json               # NEW: Dependencies
├── node_modules/              # NEW: Installed packages
└── ios/                       # NEW: Native iOS project
    ├── App/
    │   ├── App/
    │   │   └── Info.plist     # iOS configuration
    │   └── public/            # Your web files copied here
    └── App.xcworkspace        # Xcode project
```

---

## Benefits of Native App

✅ **Appears in CarPlay app grid** (not just "Now Playing")
✅ **Better background audio** - iOS won't kill it
✅ **Proper notifications** - can add playback notifications
✅ **Offline caching** - works better than PWA
✅ **App Store distribution** - users can find and install
✅ **Better performance** - native web view

---

## Next Steps

1. **Test thoroughly** on real device
2. **Add app icons** (see Step 8)
3. **Create screenshots** for App Store
4. **Write App Store description**
5. **Submit for review**

---

## Useful Commands

```bash
# Sync web files to native
npx cap sync ios

# Open in Xcode
npx cap open ios

# Update Capacitor
npm install @capacitor/cli@latest
npm install @capacitor/ios@latest
npx cap sync

# Check Capacitor status
npx cap doctor
```

---

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Development](https://developer.apple.com/ios)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [CarPlay Development](https://developer.apple.com/carplay/)

---

**That's it! You now have a native iOS app. 🎉**

The best part? You can keep updating your `radio-player.html` file and just run `npx cap copy ios` to update the native app!
