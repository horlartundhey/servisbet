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

// Robust root element detection for iOS
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found - iOS compatibility issue');
  throw new Error('Root element not found');
}

try {
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error('iOS Render Error:', error);
  // Fallback: Try alternative rendering approach
  setTimeout(() => {
    try {
      createRoot(rootElement).render(<App />);
    } catch (fallbackError) {
      console.error('iOS Fallback Render Error:', fallbackError);
      // Show error message to user
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h2>Loading Issue Detected</h2>
          <p>We're having trouble loading ServisbetA on your device.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #f91942; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      `;
    }
  }, 1000);
}
