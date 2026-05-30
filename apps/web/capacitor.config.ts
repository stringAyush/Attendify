// Capacitor Configuration for Attendify
//
// Production APK:
//   - webDir points to Next.js static export output
//   - NO server.url — assets are bundled inside the APK (file:// protocol)
//   - API calls go to NEXT_PUBLIC_API_URL baked in during `npm run cap:build`
//
// Dev Live Reload (optional — uncomment server block):
//   - Allows instant refresh on device during development
//   - Replace <your-machine-ip> with your actual LAN IP
//   - Run `npm run dev` for the Next.js server while testing

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = {
  appId: 'app.attendify',
  appName: 'Attendify',
  webDir: 'out', // Next.js static export output directory

  // ─── Android specific config ──────────────────────────────
  android: {
    // allowMixedContent: ONLY needed for development HTTP endpoints.
    // Production API is HTTPS — so this can be false in release builds.
    allowMixedContent: false,
    backgroundColor: '#FFFFFF',
    buildOptions: {
      keystorePath: undefined,        // Set in CI/CD or Android Studio
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
  },

  // ─── Plugin config ────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#6366f1',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    Browser: {
      presentationStyle: 'popover',
    },
  },

  // ─── Dev Live Reload (uncomment to use) ──────────────────
  // server: {
  //   url: 'http://<your-machine-ip>:3000',
  //   cleartext: true,
  // },
};

export default config;
