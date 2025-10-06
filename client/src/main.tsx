import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

console.log('ServisbetA: Initializing app...');

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Root element not found');
  throw new Error('Root element not found');
}

try {
  console.log('Creating React root...');
  createRoot(rootElement).render(<App />);
  console.log('App rendered successfully!');
} catch (error) {
  console.error('Render error:', error);
  
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h2 style="color: #f91942;">Loading Error</h2>
      <p>Unable to load the app. Please refresh the page.</p>
      <button onclick="window.location.reload()" 
              style="padding: 12px 24px; background: #f91942; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-top: 20px;">
        Refresh Page
      </button>
    </div>
  `;
}
