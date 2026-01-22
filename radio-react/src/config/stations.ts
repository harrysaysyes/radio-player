export interface Station {
  id: 'classicfm' | 'reprezent';
  name: string;
  frequency: string;
  url: string;
  urlAlt?: string;
  tagline: string;
  logo: string;
  theme: 'classicfm' | 'reprezent';
}

export const STATIONS: Station[] = [
  {
    id: 'classicfm',
    name: 'Classic FM',
    frequency: '107.0 FM',
    url: 'https://media-ice.musicradio.com/ClassicFMMP3',
    tagline: "The World's Greatest Music",
    logo: '/assets/logos/classicfm.svg',
    theme: 'classicfm'
  },
  {
    id: 'reprezent',
    name: 'Reprezent 107.3 FM',
    frequency: '107.3 FM',
    url: 'https://radio.canstream.co.uk:8022/live.mp3',
    urlAlt: 'http://radio.canstream.co.uk:8022/live.mp3',
    tagline: 'Voice of Young London',
    logo: '/assets/logos/reprezent.jpg',
    theme: 'reprezent'
  }
];
