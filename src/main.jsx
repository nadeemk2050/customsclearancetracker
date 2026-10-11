import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tailwind.css'
import './index.css'
import App from './App.jsx'

// Global suppression of harmless browser extension noise & media play/pause interruptions
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event?.reason?.message || event?.reason || '');
    const name = String(event?.reason?.name || '');
    if (
      name === 'AbortError' ||
      msg.includes('play()') ||
      msg.includes('interrupted by a call to pause()') ||
      msg.includes('message channel closed') ||
      msg.includes('Receiving end does not exist') ||
      msg.includes('Could not establish connection')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

