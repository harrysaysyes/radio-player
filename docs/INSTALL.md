# Install Radio Player on Your iPhone

Follow these steps to install the Radio Player as an app on your iPhone:

## Step 1: Create the App Icons

1. Open `create-icons.html` in your browser
2. Click "Download" under each icon (192x192 and 512x512)
3. Save them as `icon-192.png` and `icon-512.png` in the same folder as `radio-player.html`

## Step 2: Host the Files

You need to serve these files over HTTPS. Choose one option:

### Option A: Using Python (Quick & Easy)
1. Open Terminal
2. Navigate to this folder: `cd /Users/hullo/ralph`
3. Run: `python3 -m http.server 8000`
4. Find your Mac's local IP address (System Settings > Network)
5. On your iPhone, open Safari and go to: `http://YOUR_MAC_IP:8000/radio-player.html`

**Note:** This only works on the same WiFi network and won't persist after restarting.

### Option B: Using GitHub Pages (Recommended)
1. Create a new GitHub repository
2. Upload all files to the repository:
   - `radio-player.html`
   - `manifest.json`
   - `service-worker.js`
   - `icon-192.png`
   - `icon-512.png`
3. Enable GitHub Pages in repository Settings
4. Visit your site at: `https://YOUR_USERNAME.github.io/REPO_NAME/radio-player.html`

### Option C: Using Netlify (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Sign up for free
3. Drag and drop all these files into Netlify
4. Get instant HTTPS URL

## Step 3: Install on iPhone

1. Open the URL in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "Radio" (or whatever you like)
5. Tap **Add**

## Step 4: Use the App

1. Find the "Radio" app icon on your home screen
2. Tap to open - it will launch fullscreen like a native app!
3. Enjoy your radio stations

## Features

✅ Works offline (once installed)
✅ Fullscreen app experience
✅ Lock screen controls (play/pause shows on lock screen)
✅ Background audio (keeps playing when you switch apps)
✅ **CarPlay support** (control from your car's display)
✅ No App Store needed
✅ Updates automatically when you reload

## Using with CarPlay

Once installed on your iPhone:
1. Connect your iPhone to your car's CarPlay system
2. Open the Radio Player app on your phone
3. Select a station and press play
4. Control playback from your car's display or steering wheel controls
5. See station info and album art on your car screen
6. Use Next/Previous to switch between stations

The app integrates with CarPlay's "Now Playing" interface automatically!

## Troubleshooting

**Can't add to home screen?**
- Make sure you're using Safari (not Chrome or Firefox)
- The site must be served over HTTPS (localhost won't work)

**No sound?**
- Check your iPhone's volume
- Make sure Silent mode is off
- Try stopping and restarting the stream

**Not updating?**
- Delete the app from home screen
- Clear Safari cache
- Re-add to home screen

## Files You Need

```
radio-player.html      (Main app file)
manifest.json         (PWA configuration)
service-worker.js     (Offline support)
icon-192.png         (App icon - small)
icon-512.png         (App icon - large)
```
