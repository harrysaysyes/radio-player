import { useEffect, useRef } from 'react';

/**
 * Hook to prevent screen from sleeping while audio is playing
 * Uses the Screen Wake Lock API to keep the screen active
 *
 * Based on app.js lines 529-544 (Wake Lock API integration)
 */
export const useWakeLock = (isPlaying: boolean) => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is available
    if (!('wakeLock' in navigator)) {
      console.log('Wake Lock API not supported');
      return;
    }

    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock active');

        // Listen for wake lock release
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake Lock released');
        });
      } catch (error) {
        console.error('Wake Lock request failed:', error);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (error) {
          console.error('Wake Lock release failed:', error);
        }
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-request wake lock when page becomes visible (handles tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && !wakeLockRef.current) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);
};
