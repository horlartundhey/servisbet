import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initIOSCompatibility, addIOSPolyfills } from './utils/iosCompatibility'

// Initialize iOS compatibility fixes immediately
addIOSPolyfills();
const { isIOS } = initIOSCompatibility();

// Add iOS-specific logging
if (isIOS) {
  console.log('ServisbetA: iOS Safari compatibility mode enabled');
}

// Enhanced iOS Safari loading with multiple fallback strategies
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found - iOS compatibility issue');
  throw new Error('Root element not found');
}

// iOS Safari specific loading strategy
const renderApp = () => {
  try {
    console.log('Attempting React app render...');
    createRoot(rootElement).render(<App />);
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('iOS Initial Render Error:', error);
    
    // Strategy 1: Wait for assets to load
    if (isIOS) {
      console.log('iOS detected - trying asset load strategy');
      const waitForAssets = () => {
        const scripts = document.querySelectorAll('script[src*="assets"]');
        const styles = document.querySelectorAll('link[rel="stylesheet"][href*="assets"]');
        
        if (scripts.length === 0 && styles.length === 0) {
          console.log('No asset files detected yet, retrying...');
          setTimeout(waitForAssets, 500);
          return;
        }
        
        try {
          createRoot(rootElement).render(<App />);
          console.log('iOS Asset load strategy successful');
        } catch (assetError) {
          console.error('iOS Asset load strategy failed:', assetError);
          
          // Strategy 2: Force page reload with cache bust
          setTimeout(() => {
            console.log('Initiating iOS cache bust reload...');
            const cacheBustUrl = `${window.location.origin}${window.location.pathname}?_ios_reload=${Date.now()}&_random=${Math.random()}`;
            window.location.replace(cacheBustUrl);
          }, 2000);
        }
      };
      
      setTimeout(waitForAssets, 1000);
    } else {
      // Non-iOS fallback
      setTimeout(() => {
        try {
          createRoot(rootElement).render(<App />);
        } catch (fallbackError) {
          console.error('Fallback Render Error:', fallbackError);
          showErrorMessage();
        }
      }, 1000);
    }
  }
};

// Show user-friendly error message
const showErrorMessage = () => {
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #f91942; margin-bottom: 20px;">🔄 Loading ServisbetA</h2>
      <p style="margin-bottom: 20px;">We're optimizing the experience for your device...</p>
      <div style="margin: 20px 0;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #f91942; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <button onclick="window.location.href = window.location.origin + '?_force_reload=' + Date.now()" 
              style="padding: 12px 24px; background: #f91942; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 10px;">
        Refresh Page
      </button>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
};

// Start the render process
renderApp();
