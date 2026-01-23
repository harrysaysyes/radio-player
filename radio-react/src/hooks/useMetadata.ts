import { useEffect, useRef } from 'react';
import { Station } from '@/config/stations';

/**
 * Hook to fetch and update track metadata from radio station APIs
 * Polls for updates every 15 seconds while playing
 *
 * Based on app.js lines 344-409 (updateTrackInfo function)
 */
interface MetadataCallbacks {
  onTrackUpdate: (trackInfo: string, trackArtist: string) => void;
}

export const useMetadata = (
  station: Station | null,
  isPlaying: boolean,
  callbacks: MetadataCallbacks
) => {
  const intervalRef = useRef<number | null>(null);
  const { onTrackUpdate } = callbacks;

  useEffect(() => {
    if (!station || !isPlaying) {
      // Clear interval if stopped or no station
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const fetchMetadata = async () => {
      try {
        if (station.id === 'classicfm') {
          // Classic FM API
          const response = await fetch(
            'https://planetradio.co.uk/api/v0/stations/classicfm/latest-tracks/?limit=1'
          );
          const data = await response.json();

          if (data && data.length > 0) {
            const track = data[0];
            const title = track.title || 'Classic FM';
            const artist = track.artist || '';
            onTrackUpdate(title, artist);
          }
        } else if (station.id === 'reprezent') {
          // Reprezent API
          const response = await fetch(
            'http://admin.radioking.io/api/tracks/last_tracks/65729'
          );
          const data = await response.json();

          if (data && data.tracks && data.tracks.length > 0) {
            const track = data.tracks[0];
            const title = track.title || 'Reprezent 107.3 FM';
            const artist = track.artist || '';
            onTrackUpdate(title, artist);
          }
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
        // Fallback to station name on error
        onTrackUpdate(station.name, '');
      }
    };

    // Fetch immediately on mount
    fetchMetadata();

    // Then fetch every 15 seconds
    intervalRef.current = window.setInterval(fetchMetadata, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [station, isPlaying, onTrackUpdate]);
};
