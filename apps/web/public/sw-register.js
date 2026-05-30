// Attendify — Service Worker Registration
// This file is loaded as a <script> in the root layout.
// It registers the service worker for PWA / offline support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(function (registration) {
        if (process.env.NODE_ENV === 'development') {
          console.info('[SW] Registered:', registration.scope);
        }
      })
      .catch(function (error) {
        console.error('[SW] Registration failed:', error);
      });
  });
}
