import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.antwnakys.dash',
  appName: 'dash',
  webDir: 'dist',
  backgroundColor: '#0b0d12',
  ios: {
    contentInset: 'never',
    backgroundColor: '#0b0d12',
    scrollEnabled: true,
  },
  plugins: {
    // The web intro animation takes over straight from the native splash.
    SplashScreen: { launchShowDuration: 300, launchAutoHide: true, backgroundColor: '#0b0d12', showSpinner: false },
    StatusBar: { style: 'DARK', overlaysWebView: true },
  },
}

export default config
