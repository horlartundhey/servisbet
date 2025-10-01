// iOS Safari Compatibility Utilities
export const initIOSCompatibility = () => {
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  
  if (isIOS) {
    console.log('iOS detected, applying compatibility fixes...');
    
    // iOS Safari Cache Busting for Assets
    const bustCache = () => {
      // Clear iOS Safari cache programmatically
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Force reload critical resources
      const criticalAssets = document.querySelectorAll('link[rel="stylesheet"], script[src]');
      criticalAssets.forEach((asset: any) => {
        if (asset.href || asset.src) {
          const url = asset.href || asset.src;
          const separator = url.includes('?') ? '&' : '?';
          const bustParam = `_cb=${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          if (asset.tagName === 'LINK') {
            asset.href = `${url}${separator}${bustParam}`;
          } else if (asset.tagName === 'SCRIPT') {
            asset.src = `${url}${separator}${bustParam}`;
          }
        }
      });
    };
    
    // Apply cache busting immediately
    bustCache();
    
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
    
    // Enhanced asset loading recovery for iOS
    const checkAssetLoading = () => {
      const scripts = document.querySelectorAll('script[src*="assets"]');
      const styles = document.querySelectorAll('link[rel="stylesheet"][href*="assets"]');
      
      let assetsLoaded = 0;
      const totalAssets = scripts.length + styles.length;
      
      const assetLoadHandler = () => {
        assetsLoaded++;
        if (assetsLoaded === totalAssets) {
          console.log('All iOS assets loaded successfully');
        }
      };
      
      // Monitor script loading
      scripts.forEach((script: any) => {
        script.addEventListener('load', assetLoadHandler);
        script.addEventListener('error', (e: any) => {
          console.error('iOS Script failed to load:', script.src);
          // Retry loading with cache bust
          const newScript = document.createElement('script');
          newScript.src = `${script.src}?retry=${Date.now()}`;
          script.parentNode?.replaceChild(newScript, script);
        });
      });
      
      // Monitor stylesheet loading
      styles.forEach((style: any) => {
        style.addEventListener('load', assetLoadHandler);
        style.addEventListener('error', (e: any) => {
          console.error('iOS Stylesheet failed to load:', style.href);
          // Retry loading with cache bust
          const newStyle = document.createElement('link');
          newStyle.rel = 'stylesheet';
          newStyle.href = `${style.href}?retry=${Date.now()}`;
          style.parentNode?.replaceChild(newStyle, style);
        });
      });
    };
    
    // Check asset loading after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAssetLoading);
    } else {
      checkAssetLoading();
    }
    
    // Force reload if app fails to load properly (increased timeout)
    setTimeout(() => {
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.children.length === 0) {
        console.log('App failed to load on iOS, attempting cache clear and reload...');
        // Clear localStorage and sessionStorage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.log('Storage clear failed:', e);
        }
        // Force reload with cache bust
        window.location.href = `${window.location.origin}${window.location.pathname}?_reload=${Date.now()}`;
      }
    }, 5000);
    
    // iOS-specific error handling
    window.addEventListener('error', (event) => {
      console.error('iOS Error:', event.error);
      console.error('iOS Error Source:', event.filename, 'Line:', event.lineno);
    });
    
    // Handle iOS memory warnings
    window.addEventListener('pagehide', () => {
      console.log('iOS page hide - cleaning up resources');
    });
    
    // Handle iOS page show (coming back from cache)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('iOS page restored from cache - forcing refresh');
        window.location.reload();
      }
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