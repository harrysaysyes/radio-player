# Building Native App with Swift/SwiftUI

This guide shows how to build a fully native iOS app using Swift and SwiftUI.

## What You'll Get

✅ Best possible performance
✅ Full CarPlay integration (appears in app grid)
✅ Smallest app size (~5 MB)
✅ Most "iOS-like" experience
✅ Complete control over everything

**Time needed:** 4-8 hours (requires learning Swift)

---

## Prerequisites

- Mac with Xcode 14+
- Basic programming knowledge
- Willingness to learn Swift

---

## Step 1: Create Xcode Project

1. Open Xcode
2. File > New > Project
3. Choose **iOS > App**
4. Set:
   - Product Name: **Radio Player**
   - Interface: **SwiftUI**
   - Language: **Swift**
5. Click **Create**

---

## Step 2: Enable Background Audio & CarPlay

1. Click on your project in the navigator
2. Select the **App** target
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **Background Modes**
6. Check **Audio, AirPlay, and Picture in Picture**

---

## Step 3: Create the App

Replace `ContentView.swift`:

```swift
import SwiftUI
import AVFoundation
import MediaPlayer

struct RadioStation: Identifiable {
    let id: String
    let name: String
    let url: URL
    let logo: String
}

class RadioPlayer: ObservableObject {
    @Published var isPlaying = false
    @Published var currentStation: RadioStation?
    @Published var volume: Float = 0.8

    private var player: AVPlayer?

    let stations = [
        RadioStation(
            id: "classicfm",
            name: "Classic FM",
            url: URL(string: "https://media-ice.musicradio.com/ClassicFMMP3")!,
            logo: "music.note"
        ),
        RadioStation(
            id: "reprezent",
            name: "Reprezent 107.3",
            url: URL(string: "https://radio.canstream.co.uk:8022/live.mp3")!,
            logo: "radio"
        )
    ]

    init() {
        setupAudioSession()
        setupRemoteControls()
    }

    func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                mode: .default
            )
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Audio session error: \\(error)")
        }
    }

    func setupRemoteControls() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.addTarget { _ in
            self.play()
            return .success
        }

        commandCenter.pauseCommand.addTarget { _ in
            self.pause()
            return .success
        }

        commandCenter.stopCommand.addTarget { _ in
            self.stop()
            return .success
        }

        commandCenter.nextTrackCommand.addTarget { _ in
            self.nextStation()
            return .success
        }

        commandCenter.previousTrackCommand.addTarget { _ in
            self.previousStation()
            return .success
        }
    }

    func playStation(_ station: RadioStation) {
        currentStation = station

        let playerItem = AVPlayerItem(url: station.url)
        player = AVPlayer(playerItem: playerItem)
        player?.volume = volume
        player?.play()
        isPlaying = true

        updateNowPlaying()
    }

    func play() {
        player?.play()
        isPlaying = true
        updateNowPlaying()
    }

    func pause() {
        player?.pause()
        isPlaying = false
    }

    func stop() {
        player?.pause()
        player = nil
        isPlaying = false
        currentStation = nil
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    func nextStation() {
        guard let current = currentStation,
              let index = stations.firstIndex(where: { $0.id == current.id })
        else { return }

        let nextIndex = (index + 1) % stations.count
        playStation(stations[nextIndex])
    }

    func previousStation() {
        guard let current = currentStation,
              let index = stations.firstIndex(where: { $0.id == current.id })
        else { return }

        let prevIndex = index == 0 ? stations.count - 1 : index - 1
        playStation(stations[prevIndex])
    }

    func setVolume(_ newVolume: Float) {
        volume = newVolume
        player?.volume = newVolume
    }

    func updateNowPlaying() {
        guard let station = currentStation else { return }

        var nowPlayingInfo = [String: Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = "Live Radio"
        nowPlayingInfo[MPMediaItemPropertyArtist] = station.name
        nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = station.name
        nowPlayingInfo[MPNowPlayingInfoPropertyIsLiveStream] = true

        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
}

struct ContentView: View {
    @StateObject private var radioPlayer = RadioPlayer()

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "2c3e50"), Color(hex: "34495e")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 30) {
                // Header
                VStack(spacing: 10) {
                    Text("Radio Player")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)

                    if let station = radioPlayer.currentStation {
                        Text(station.name)
                            .font(.system(size: 16))
                            .foregroundColor(Color(hex: "667eea"))
                    }
                }
                .padding(.top, 40)

                // Now Playing Card
                VStack(spacing: 15) {
                    Text("NOW PLAYING")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.white.opacity(0.8))
                        .tracking(2)

                    Text(radioPlayer.currentStation?.name ?? "Select a station")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.white)

                    Text(radioPlayer.isPlaying ? "Live Radio" : "Press play to start")
                        .font(.system(size: 16))
                        .foregroundColor(.white.opacity(0.9))
                }
                .frame(maxWidth: .infinity)
                .frame(minHeight: 120)
                .padding()
                .background(
                    LinearGradient(
                        colors: [Color(hex: "667eea"), Color(hex: "764ba2")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .cornerRadius(20)
                .padding(.horizontal)

                // Station Buttons
                HStack(spacing: 15) {
                    ForEach(radioPlayer.stations) { station in
                        Button(action: {
                            radioPlayer.playStation(station)
                        }) {
                            VStack(spacing: 10) {
                                Image(systemName: station.logo)
                                    .font(.system(size: 40))
                                    .foregroundColor(
                                        radioPlayer.currentStation?.id == station.id
                                        ? Color(hex: "667eea")
                                        : .primary
                                    )

                                Text(station.name)
                                    .font(.system(size: 13, weight: .semibold))
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 120)
                            .background(.white)
                            .cornerRadius(15)
                            .overlay(
                                RoundedRectangle(cornerRadius: 15)
                                    .stroke(
                                        radioPlayer.currentStation?.id == station.id
                                        ? Color(hex: "667eea") : Color.clear,
                                        lineWidth: 3
                                    )
                            )
                        }
                    }
                }
                .padding(.horizontal)

                // Controls
                HStack(spacing: 15) {
                    Button(action: {
                        if radioPlayer.isPlaying {
                            radioPlayer.pause()
                        } else {
                            radioPlayer.play()
                        }
                    }) {
                        Text(radioPlayer.isPlaying ? "⏸ PAUSE" : "▶ PLAY")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: "667eea"))
                            .cornerRadius(12)
                    }
                    .disabled(radioPlayer.currentStation == nil)

                    Button(action: {
                        radioPlayer.stop()
                    }) {
                        Text("⏹ STOP")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: "2c2c3e"))
                            .cornerRadius(12)
                    }
                    .disabled(radioPlayer.currentStation == nil)
                }
                .padding(.horizontal)

                // Volume Control
                HStack(spacing: 15) {
                    Text("🔊")
                        .font(.system(size: 20))

                    Slider(
                        value: Binding(
                            get: { radioPlayer.volume },
                            set: { radioPlayer.setVolume($0) }
                        ),
                        in: 0...1
                    )
                    .accentColor(Color(hex: "667eea"))

                    Text("\\(Int(radioPlayer.volume * 100))%")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 50)
                }
                .padding()
                .background(.white.opacity(0.1))
                .cornerRadius(12)
                .padding(.horizontal)

                Spacer()
            }
        }
    }
}

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)

        let r = Double((rgb >> 16) & 0xFF) / 255.0
        let g = Double((rgb >> 8) & 0xFF) / 255.0
        let b = Double(rgb & 0xFF) / 255.0

        self.init(red: r, green: g, blue: b)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
```

---

## Step 4: Add CarPlay Scene

Create new file `CarPlaySceneDelegate.swift`:

```swift
import CarPlay
import UIKit

class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
    var interfaceController: CPInterfaceController?

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController

        let stations = [
            ("Classic FM", "music.note"),
            ("Reprezent 107.3", "radio")
        ]

        let items = stations.map { name, icon in
            let item = CPListItem(text: name, detailText: "Live Radio")
            item.handler = { [weak self] item, completion in
                // Play station
                completion()
            }
            return item
        }

        let section = CPListSection(items: items)
        let template = CPListTemplate(title: "Radio Player", sections: [section])

        interfaceController.setRootTemplate(template, animated: true)
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = nil
    }
}
```

---

## Step 5: Configure CarPlay in Info.plist

Add to `Info.plist`:

```xml
<key>UIApplicationSceneManifest</key>
<dict>
    <key>UISceneConfigurations</key>
    <dict>
        <key>CPTemplateApplicationSceneSessionRoleApplication</key>
        <array>
            <dict>
                <key>UISceneClassName</key>
                <string>CPTemplateApplicationScene</string>
                <key>UISceneConfigurationName</key>
                <string>CarPlay</string>
                <key>UISceneDelegateClassName</key>
                <string>$(PRODUCT_MODULE_NAME).CarPlaySceneDelegate</string>
            </dict>
        </array>
    </dict>
</dict>
```

---

## Step 6: Test CarPlay

1. Run app on simulator or device
2. In Xcode: **I/O > External Displays > CarPlay**
3. Select a station in the app
4. CarPlay interface should show controls

---

## Step 7: Add App Icons

1. Prepare 1024x1024 icon
2. In Xcode, go to **Assets.xcassets**
3. Click **AppIcon**
4. Drag your icon into the 1024x1024 slot
5. Xcode generates all sizes automatically

---

## Step 8: Build for Release

1. Select **Any iOS Device** from device menu
2. Product > Archive
3. Click **Distribute App**
4. Choose **App Store Connect**
5. Upload to App Store

---

## Advanced Features

### Add Now Playing Artwork:
```swift
if let image = UIImage(named: "station-logo") {
    let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
    nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
}
```

### Add Metadata Parsing:
```swift
// Parse Icecast metadata
let asset = AVURLAsset(url: stationURL)
asset.loadMetadata(for: .commonIdentifier) { metadata in
    // Extract title/artist
}
```

---

## Pros & Cons

### Pros
✅ Absolute best performance
✅ Full CarPlay app (appears in grid)
✅ Smallest file size
✅ Most native iOS experience
✅ Complete control

### Cons
❌ Must learn Swift
❌ Complete rewrite
❌ iOS only
❌ More code to maintain

---

## Resources

- [Swift Documentation](https://swift.org/documentation/)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [CarPlay Programming Guide](https://developer.apple.com/carplay/documentation/)
- [AVFoundation](https://developer.apple.com/av-foundation/)

---

**This gives you a true native iOS app with maximum performance and control!**
