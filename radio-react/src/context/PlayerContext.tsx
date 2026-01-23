import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import { Station, STATIONS } from '@/config/stations';
import { useMetadata } from '@/hooks/useMetadata';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useWakeLock } from '@/hooks/useWakeLock';

interface PlayerState {
  // Audio
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  volume: number;
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;

  // Station
  currentStation: Station | null;
  currentTheme: 'default' | 'classicfm' | 'reprezent';

  // Metadata
  trackInfo: string;
  trackArtist: string;

  // UI
  statusText: string;
  isCustomStreamVisible: boolean;
}

interface PlayerActions {
  playStation: (station: Station) => void;
  stopStream: () => void;
  setVolume: (volume: number) => void;
  playCustomStream: (url: string) => void;
  toggleCustomStream: () => void;
  setTrackInfo: (info: string) => void;
  setTrackArtist: (artist: string) => void;
  setStatusText: (text: string) => void;
}

type PlayerContextType = PlayerState & PlayerActions;

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'default' | 'classicfm' | 'reprezent'>('default');
  const [trackInfo, setTrackInfo] = useState('Select a station to begin');
  const [trackArtist, setTrackArtist] = useState('');
  const [statusText, setStatusText] = useState('Ready');
  const [isCustomStreamVisible, setIsCustomStreamVisible] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Metadata fetching callback
  const handleTrackUpdate = useCallback((info: string, artist: string) => {
    setTrackInfo(info);
    setTrackArtist(artist);
  }, []);

  // Auto-fetch metadata when playing
  useMetadata(currentStation, isPlaying, {
    onTrackUpdate: handleTrackUpdate
  });

  // Media Session callbacks for lock screen/CarPlay
  const handleMediaPlay = useCallback(() => {
    if (audio && !isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  }, [audio, isPlaying]);

  const handleMediaPause = useCallback(() => {
    if (audio && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    }
  }, [audio, isPlaying]);

  // Store playStation reference for media session callbacks
  const playStationRef = useRef<((station: Station) => void) | null>(null);

  const handlePreviousTrack = useCallback(() => {
    if (!currentStation || !playStationRef.current) return;
    const currentIndex = STATIONS.findIndex(s => s.id === currentStation.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : STATIONS.length - 1;
    playStationRef.current(STATIONS[prevIndex]);
  }, [currentStation]);

  const handleNextTrack = useCallback(() => {
    if (!currentStation || !playStationRef.current) return;
    const currentIndex = STATIONS.findIndex(s => s.id === currentStation.id);
    const nextIndex = currentIndex < STATIONS.length - 1 ? currentIndex + 1 : 0;
    playStationRef.current(STATIONS[nextIndex]);
  }, [currentStation]);

  // Setup Media Session for lock screen/CarPlay
  useMediaSession(currentStation, isPlaying, trackInfo, trackArtist, {
    onPlay: handleMediaPlay,
    onPause: handleMediaPause,
    onPreviousTrack: handlePreviousTrack,
    onNextTrack: handleNextTrack
  });

  // Keep screen awake while playing
  useWakeLock(isPlaying);

  const playStation = (station: Station) => {
    playStationRef.current = playStation;  // Store reference for media session

    // Stop current playback
    if (audio) {
      audio.pause();
      setAudio(null);
    }

    // Create new audio element
    const newAudio = new Audio(station.url);
    newAudio.crossOrigin = "anonymous";
    newAudio.volume = volume / 100;

    // Setup Web Audio API (once)
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }

    // Connect audio to analyser
    const source = audioContextRef.current.createMediaElementSource(newAudio);
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    // Event listeners
    newAudio.addEventListener('playing', () => {
      setIsPlaying(true);
      setStatusText('Streaming');
    });

    newAudio.addEventListener('waiting', () => {
      setStatusText('Buffering...');
    });

    newAudio.addEventListener('error', () => {
      if (station.urlAlt) {
        newAudio.src = station.urlAlt;
        newAudio.play();
      } else {
        setStatusText('Connection failed');
        setIsPlaying(false);
      }
    });

    setAudio(newAudio);
    setCurrentStation(station);
    setCurrentTheme(station.theme);
    setStatusText('Connecting...');
    newAudio.play();
  };

  const stopStream = () => {
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    setIsPlaying(false);
    setCurrentStation(null);
    setCurrentTheme('default');
    setTrackInfo('Select a station to begin');
    setTrackArtist('');
    setStatusText('Ready');
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audio) {
      audio.volume = newVolume / 100;
    }
  };

  const playCustomStream = (url: string) => {
    const customStation: Station = {
      id: 'classicfm', // Default theme for custom
      name: 'Custom Stream',
      frequency: '',
      url: url,
      tagline: 'Custom Stream',
      logo: '',
      theme: 'classicfm'
    };
    playStation(customStation);
    setIsCustomStreamVisible(false);
  };

  const toggleCustomStream = () => {
    setIsCustomStreamVisible(!isCustomStreamVisible);
  };

  const value: PlayerContextType = {
    // State
    audio,
    isPlaying,
    volume,
    audioContext: audioContextRef.current,
    analyserNode: analyserRef.current,
    currentStation,
    currentTheme,
    trackInfo,
    trackArtist,
    statusText,
    isCustomStreamVisible,

    // Actions
    playStation,
    stopStream,
    setVolume,
    playCustomStream,
    toggleCustomStream,
    setTrackInfo,
    setTrackArtist,
    setStatusText,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
