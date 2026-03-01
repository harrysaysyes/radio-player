import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.minify.radio',
  appName: 'Minify Radio',
  webDir: '../',
  bundledWebRuntime: false,
  backgroundColor: '#0a0a0a',

  ios: {
    contentInset: 'automatic',
    scheme: 'minifyradio',
    limitsNavigationsToAppBoundDomains: true,
    allowsLinkPreview: false,
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  server: {
    cleartext: false,
    allowNavigation: [
      'media-ice.musicradio.com',
      'reprezent.streammachine.co.uk',
      'radiocult.fm',
      'api.allorigins.win'
    ]
  }
};

export default config;
