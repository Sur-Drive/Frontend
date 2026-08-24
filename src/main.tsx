import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { registerSW } from "virtual:pwa-register";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

const GOOGLE_CLIENT_ID =
  "772967267581-348l2doisksrjpn9j60lhgtk3lfbrsbc.apps.googleusercontent.com";

// A stale/failed dynamically-imported chunk (e.g. the lazy-loaded map)
// throws this event instead of a normal error — reload to pick up the
// current build rather than leaving the tab stuck.
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

registerSW({
  immediate: true,

  onRegisteredSW(swUrl, registration) {
    console.log("Registered:", swUrl, registration);
  },

  onRegisterError(error) {
    console.error("SW registration failed:", error);
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
