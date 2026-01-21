# Building Native App with React Native

This guide shows how to rebuild your radio player using React Native.

## What You'll Get

✅ Native iOS app (and Android if you want)
✅ Better performance than web wrapper
✅ Full CarPlay integration
✅ Native UI components
✅ Access to all native features

**Time needed:** 2-4 hours (requires rewriting the app)

---

## Prerequisites

- Mac computer with macOS
- Xcode installed
- Node.js installed
- Basic JavaScript/React knowledge

---

## Step 1: Install React Native CLI

```bash
# Install React Native CLI
npm install -g react-native-cli

# Create new project
npx react-native init RadioPlayer
cd RadioPlayer
```

---

## Step 2: Install Required Packages

```bash
# Audio player
npm install react-native-track-player

# For icons and UI
npm install react-native-vector-icons
npm install @react-native-community/slider

# CarPlay support (iOS only)
npm install react-native-carplay

# Install iOS dependencies
cd ios && pod install && cd ..
```

---

## Step 3: Configure iOS for Audio & CarPlay

Edit `ios/RadioPlayer/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>

<key>NSMicrophoneUsageDescription</key>
<string>Radio Player streams audio</string>
```

---

## Step 4: Create the App

Replace `App.js` with:

```javascript
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import TrackPlayer, {
  Capability,
  State,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';
import Slider from '@react-native-community/slider';

const STATIONS = [
  {
    id: 'classicfm',
    title: 'Classic FM',
    url: 'https://media-ice.musicradio.com/ClassicFMMP3',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/f/f8/Classic_FM_%28UK%29_logo.svg',
  },
  {
    id: 'reprezent',
    title: 'Reprezent 107.3',
    url: 'https://radio.canstream.co.uk:8022/live.mp3',
    artwork: 'https://www.reprezent.org.uk/_next/image?url=%2Flogo.png&w=256&q=75',
  },
];

// Setup the player
const setupPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
      ],
    });
  } catch (e) {
    console.log('Error setting up player:', e);
  }
};

function App() {
  const [currentStation, setCurrentStation] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const playbackState = usePlaybackState();

  useEffect(() => {
    setupPlayer();
  }, []);

  useEffect(() => {
    TrackPlayer.setVolume(volume);
  }, [volume]);

  const playStation = async (station) => {
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: station.id,
      url: station.url,
      title: station.title,
      artist: 'Live Radio',
      artwork: station.artwork,
    });
    await TrackPlayer.play();
    setCurrentStation(station);
  };

  const togglePlayback = async () => {
    const state = await TrackPlayer.getState();
    if (state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const stopPlayback = async () => {
    await TrackPlayer.stop();
    setCurrentStation(null);
  };

  const isPlaying = playbackState === State.Playing;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Radio Player</Text>
        {currentStation && (
          <Text style={styles.subtitle}>{currentStation.title}</Text>
        )}
      </View>

      <View style={styles.nowPlaying}>
        <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
        <Text style={styles.nowPlayingTitle}>
          {currentStation ? currentStation.title : 'Select a station'}
        </Text>
        <Text style={styles.nowPlayingArtist}>
          {currentStation ? 'Live Radio' : 'Choose station below'}
        </Text>
      </View>

      <View style={styles.stations}>
        {STATIONS.map((station) => (
          <TouchableOpacity
            key={station.id}
            style={[
              styles.stationButton,
              currentStation?.id === station.id && styles.stationButtonActive,
            ]}
            onPress={() => playStation(station)}
          >
            <Text style={styles.stationTitle}>{station.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={togglePlayback}
          disabled={!currentStation}
        >
          <Text style={styles.controlButtonText}>
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={stopPlayback}
          disabled={!currentStation}
        >
          <Text style={styles.controlButtonText}>⏹ STOP</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.volumeContainer}>
        <Text style={styles.volumeLabel}>🔊</Text>
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={setVolume}
          minimumTrackTintColor="#667eea"
          maximumTrackTintColor="#e2e8f0"
        />
        <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    marginTop: 5,
  },
  nowPlaying: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    minHeight: 120,
    justifyContent: 'center',
  },
  nowPlayingLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
    marginBottom: 10,
  },
  nowPlayingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  nowPlayingArtist: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  stations: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  stationButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  stationButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#764ba2',
    borderWidth: 3,
  },
  stationTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#2c2c3e',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
  },
  volumeLabel: {
    fontSize: 20,
    marginRight: 10,
  },
  volumeSlider: {
    flex: 1,
  },
  volumeValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    minWidth: 45,
    textAlign: 'right',
  },
});

export default App;
```

---

## Step 5: Setup Background Audio

Create `index.js` service:

```javascript
import TrackPlayer from 'react-native-track-player';

module.exports = async function() {
  TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play());
  TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause());
  TrackPlayer.addEventListener('remote-stop', () => TrackPlayer.destroy());
  TrackPlayer.addEventListener('remote-next', async () => {
    // Switch stations
    const currentTrack = await TrackPlayer.getCurrentTrack();
    // Logic to switch to next station
  });
  TrackPlayer.addEventListener('remote-previous', async () => {
    // Switch stations
    const currentTrack = await TrackPlayer.getCurrentTrack();
    // Logic to switch to previous station
  });
};
```

Register in `index.js`:

```javascript
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import TrackPlayer from 'react-native-track-player';

AppRegistry.registerComponent(appName, () => App);
TrackPlayer.registerPlaybackService(() => require('./service'));
```

---

## Step 6: Add CarPlay Support

```bash
npm install react-native-carplay
cd ios && pod install && cd ..
```

Create CarPlay template in `App.js`:

```javascript
import { CarPlay } from 'react-native-carplay';

// In your useEffect
useEffect(() => {
  CarPlay.connect();

  const template = {
    leadingNavigationBarButtons: [],
    trailingNavigationBarButtons: [],
    sections: [
      {
        items: STATIONS.map(station => ({
          text: station.title,
          detailText: 'Live Radio',
          onPress: () => playStation(station),
        })),
      },
    ],
  };

  CarPlay.setRootTemplate(template, false);

  return () => {
    CarPlay.disconnect();
  };
}, []);
```

---

## Step 7: Run the App

```bash
# Run on iOS
npx react-native run-ios

# Run on Android (if configured)
npx react-native run-android
```

---

## Step 8: Build for Release

### iOS:
1. Open `ios/RadioPlayer.xcworkspace` in Xcode
2. Select your team in Signing & Capabilities
3. Product > Archive
4. Distribute to App Store

### Android:
```bash
cd android
./gradlew assembleRelease
```

---

## Pros & Cons

### Pros
✅ True native performance
✅ Works on both iOS and Android
✅ Large community
✅ Many pre-built components
✅ Hot reloading for faster development

### Cons
❌ Need to rewrite entire app
❌ More complex than Capacitor
❌ Steeper learning curve
❌ Need to maintain more code

---

## Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Track Player](https://react-native-track-player.js.org/)
- [CarPlay Integration](https://github.com/birkir/react-native-carplay)

---

**This gives you a fully native app with great performance!**
