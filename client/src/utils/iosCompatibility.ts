// iOS Safari Compatibility Utilities
export const initIOSCompatibility = () => {
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  
  if (isIOS) {
    console.log('iOS detected, applying compatibility fixes...');
    
    // Fix viewport height for iOS Safari
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 500); // Delay for iOS orientation change
    });
    
    // Prevent double-tap zoom on iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
    
    // Force reload if app fails to load properly
    setTimeout(() => {
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.children.length === 0) {
        console.log('App failed to load on iOS, attempting reload...');
        window.location.reload();
      }
    }, 3000);
    
    // iOS-specific error handling
    window.addEventListener('error', (event) => {
      console.error('iOS Error:', event.error);
      // Send error to analytics or logging service
    });
    
    // Handle iOS memory warnings
    window.addEventListener('pagehide', () => {
      // Clean up resources
      console.log('iOS page hide - cleaning up resources');
    });
  }
  
  return { isIOS, isSafari };
};

// Polyfill for iOS Safari compatibility
export const addIOSPolyfills = () => {
  // Global polyfill
  if (typeof global === 'undefined') {
    (window as any).global = window;
  }
  
  // Ensure fetch is available
  if (!window.fetch) {
    console.error('Fetch not available - iOS compatibility issue');
  }
  
  // Promise polyfill check
  if (!window.Promise) {
    console.error('Promise not available - iOS compatibility issue');
  }
};