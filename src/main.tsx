import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { registerSW } from "virtual:pwa-register";

const GOOGLE_CLIENT_ID =
    "772967267581-348l2doisksrjpn9j60lhgtk3lfbrsbc.apps.googleusercontent.com";

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
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
        </GoogleOAuthProvider>
    </StrictMode>,
);
