import { useEffect } from 'react';
import { Station } from '@/config/stations';

/**
 * Hook to integrate with Media Session API for lock screen and CarPlay controls
 * Displays track info and provides play/pause/skip controls on iOS lock screen and CarPlay
 *
 * Based on app.js lines 415-480 (updateMediaSession function)
 */
interface MediaSessionCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
}

export const useMediaSession = (
  station: Station | null,
  isPlaying: boolean,
  trackInfo: string,
  trackArtist: string,
  callbacks: MediaSessionCallbacks
) => {
  useEffect(() => {
    // Check if Media Session API is available
    if (!('mediaSession' in navigator)) {
      console.log('Media Session API not supported');
      return;
    }

    if (!station || !isPlaying) {
      // Clear media session when not playing
      navigator.mediaSession.metadata = null;
      return;
    }

    // Set media metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackInfo || station.name,
      artist: trackArtist || station.tagline,
      album: station.name,
      artwork: [
        {
          src: station.logo || '/assets/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: station.logo || '/assets/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    });

    // Set playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Set action handlers
    if (callbacks.onPlay) {
      navigator.mediaSession.setActionHandler('play', callbacks.onPlay);
    }

    if (callbacks.onPause) {
      navigator.mediaSession.setActionHandler('pause', callbacks.onPause);
    }

    if (callbacks.onPreviousTrack) {
      navigator.mediaSession.setActionHandler('previoustrack', callbacks.onPreviousTrack);
    }

    if (callbacks.onNextTrack) {
      navigator.mediaSession.setActionHandler('nexttrack', callbacks.onNextTrack);
    }

    // Cleanup on unmount
    return () => {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [station, isPlaying, trackInfo, trackArtist, callbacks]);
};
