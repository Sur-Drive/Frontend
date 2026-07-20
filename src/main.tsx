import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,

  onRegisteredSW(swUrl, registration) {
    console.log("Registered:", swUrl, registration);
  },

  onRegisterError(error) {
    console.error("SW registration failed:", error);
  },
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)