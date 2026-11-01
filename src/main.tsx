import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts ship with the app so the first screen never waits on the network.
import '@fontsource-variable/instrument-sans/wght.css'
import '@fontsource/instrument-serif/400.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
