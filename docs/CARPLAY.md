# 🚗 CarPlay Guide for Radio Player

Your Radio Player app works seamlessly with Apple CarPlay! Here's everything you need to know.

## How It Works

The Radio Player integrates with CarPlay's **"Now Playing"** interface. This means:
- ✅ Full playback control from your car's display
- ✅ Station logos appear on your car screen
- ✅ Track information shows in real-time
- ✅ Steering wheel controls work (play/pause/next/previous)
- ✅ Works with both wired and wireless CarPlay

**Important:** The app won't appear as a standalone CarPlay app (like Spotify or Apple Music) - that would require native iOS development. Instead, it uses CarPlay's audio integration, which gives you full control once playback starts.

## Setup Instructions

### First Time Setup
1. **Install the app on your iPhone**
   - Follow the installation steps in `INSTALL.md`
   - Add the app to your home screen

2. **Connect to CarPlay**
   - Connect your iPhone to your car (wired USB or wireless)
   - Your car's CarPlay interface should appear

3. **Start playback**
   - On your **iPhone**, open the Radio Player app
   - Select Classic FM or Reprezent Radio
   - The station will start playing through your car speakers

4. **Access controls in your car**
   - Look for "Now Playing" on your CarPlay display
   - Or use your car's physical media controls

## Using CarPlay Controls

### From Your Car's Touchscreen
- **Play/Pause**: Tap the play/pause button
- **Stop**: Long press the pause button or use the stop control
- **Next Station**: Tap the "Next Track" button to switch from Classic FM → Reprezent
- **Previous Station**: Tap "Previous Track" to switch from Reprezent → Classic FM
- **Now Playing Info**: View current track and station info

### From Steering Wheel Controls
- **Play/Pause**: Press the play/pause button
- **Next/Previous**: Use skip buttons to change stations
- **Volume**: Use volume controls (adjusts car speakers)

### From Your iPhone
While connected to CarPlay, you can still:
- Use the app on your phone to change stations
- Adjust the in-app volume slider
- Stop playback
- Access the custom stream feature

## What Shows in CarPlay

### Now Playing Display
Your car's screen will show:
- **Station Logo**: Classic FM or Reprezent Radio logo
- **Track Title**: Current song/show name (when available)
- **Artist/Composer**: Artist name or "Live on [Station]"
- **Album**: Station name

### Example Display
```
┌─────────────────────────────┐
│   [Classic FM Logo]         │
│                             │
│   Piano Concerto No. 21     │
│   Mozart                    │
│   Classic FM                │
│                             │
│   ⏮  ⏯  ⏭  ⏹             │
└─────────────────────────────┘
```

## Tips for Best Experience

### Before Driving
✅ **Start playback before you drive**
- Open the app on your phone
- Select your station
- Start playing
- Then begin driving

This ensures CarPlay recognizes the audio stream immediately.

### While Driving
✅ **Use voice commands** (if your car supports it)
- "Hey Siri, pause"
- "Hey Siri, play"
- "Hey Siri, next track" (switches to other station)

✅ **Keep app in background**
- Switch to Maps or other CarPlay apps
- Audio continues playing
- Controls remain accessible in "Now Playing"

✅ **Station switching**
- Use Next/Previous buttons to toggle between stations
- Or tap your phone screen to select a specific station

### Managing Volume
You have multiple volume controls:
1. **Car volume** (physical knob/buttons) - adjusts speaker output
2. **In-app slider** (on your phone) - adjusts stream volume
3. **iPhone volume buttons** - adjusts stream volume

For best results, set the in-app slider to 80-100% and control volume from your car.

## Troubleshooting

### "Now Playing" doesn't show in CarPlay
**Solution:**
- Make sure audio is actively playing (not paused)
- Try disconnecting and reconnecting to CarPlay
- Restart playback from your phone

### No sound through car speakers
**Solution:**
- Check your car's audio source is set to CarPlay/Bluetooth
- Check iPhone is not on silent mode
- Verify volume is up on both phone and car
- Try stopping and restarting the stream

### Controls don't work
**Solution:**
- Ensure playback is active (not stopped)
- Try pausing and playing again
- Some cars take a few seconds to recognize controls

### Station logos don't appear
**Solution:**
- This is normal on first load - logos load from the internet
- Once cached, they'll appear immediately
- If persistent, check your iPhone's internet connection

### Switching stations doesn't work
**Solution:**
- The Next/Previous buttons cycle between your 2 stations
- If using custom stream, these buttons may not work
- Use your phone to select a specific station

## Differences from Native Apps

**Progressive Web App (what this is):**
- ✅ No App Store needed
- ✅ Works with CarPlay "Now Playing"
- ✅ Full playback controls
- ✅ Free and open-source
- ❌ Doesn't appear in CarPlay's app grid
- ❌ Must start playback from phone

**Native CarPlay App (like Spotify):**
- ✅ Appears in CarPlay app grid
- ✅ Can start playback from car
- ❌ Requires App Store approval
- ❌ Requires paid developer account
- ❌ Much more complex to build

For a simple radio player, the PWA approach gives you 95% of the functionality with 5% of the complexity!

## Advanced: Adding More Stations

When you add more radio stations to the app, the Next/Previous controls will cycle through them in order.

Edit `radio-player.html` to add stations:
```html
<button class="station-btn" data-station="newsradio"
    data-url="https://stream.url/live.mp3"
    data-name="News Radio">
```

Then Next/Previous will cycle:
Classic FM → Reprezent → News Radio → Classic FM → ...

## Questions?

**Can I use this while navigating?**
Yes! Keep the Radio Player in the background and use Apple Maps or Google Maps. Audio continues playing.

**Does it work with wireless CarPlay?**
Yes! Works exactly the same as wired CarPlay.

**Can I use other apps while playing?**
Yes! Switch to any app on your phone or CarPlay. Audio continues in the background.

**What if I get a phone call?**
The radio automatically pauses. After the call, press play to resume.

**Can I use this with Android Auto?**
The Media Session API is supported on Android, so it should work similarly with Android Auto, though iOS is the primary target.

---

**Enjoy your radio in the car! 🚗📻**
