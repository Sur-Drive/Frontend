import { Component, type ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  stack: string;
}

const RELOAD_FLAG_KEY = "surdrive_error_auto_reload_attempted";

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: "", stack: "" };
  private clearFlagTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    // If we're mounting cleanly (no error), the app is healthy — clear
    // the "already tried an auto-reload" flag after a few seconds so a
    // later, unrelated crash in this same tab session still gets its
    // own one-time auto-recovery instead of always skipping straight
    // to the diagnostics screen.
    this.clearFlagTimer = setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOAD_FLAG_KEY);
      } catch {
        // ignore
      }
    }, 5000);
  }

  componentWillUnmount() {
    if (this.clearFlagTimer) clearTimeout(this.clearFlagTimer);
  }

  static getDerivedStateFromError(err: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: err?.message || String(err),
      stack: err?.stack || "",
    };
  }

  componentDidCatch(err: Error) {
    console.error("[ErrorBoundary] caught:", err);

    // Most crashes we've seen here are a one-off race on first render
    // (e.g. a request firing before location/data is ready) — reload
    // once automatically so the person isn't stuck looking at an error
    // screen for something that fixes itself on a fresh load. Guarded
    // by a flag so a *persistent* crash shows real diagnostics on the
    // second attempt instead of reload-looping forever.
    let alreadyTried = false;
    try {
      alreadyTried = sessionStorage.getItem(RELOAD_FLAG_KEY) === "1";
    } catch {
      // sessionStorage can throw in private-browsing modes — treat as
      // "already tried" so we fail safe into showing diagnostics.
      alreadyTried = true;
    }

    if (!alreadyTried) {
      try {
        sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
      } catch {
        // ignore
      }
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 20,
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 8 }}>Something crashed:</p>
          <p style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}>
            {this.state.message}
          </p>
          {this.state.stack && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 11,
                opacity: 0.7,
                marginBottom: 16,
                maxHeight: 300,
                overflow: "auto",
              }}
            >
              {this.state.stack}
            </pre>
          )}
          <button
            onClick={() => {
              try {
                sessionStorage.removeItem(RELOAD_FLAG_KEY);
              } catch {
                // ignore
              }
              window.location.reload();
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "#4a148c",
              color: "white",
              border: "none",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
