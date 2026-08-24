import { Component, type ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): ErrorBoundaryState {
    return { hasError: true, message: err?.message || String(err) };
  }

  componentDidCatch(err: Error) {
    // Surfaces in real-device debugging even without a cable attached —
    // check phone Settings/browser logs, or just read it off the screen.
    console.error("[ErrorBoundary] caught:", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 20,
            fontFamily: "monospace",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 8 }}>Something crashed:</p>
          <p style={{ whiteSpace: "pre-wrap", marginBottom: 16 }}>
            {this.state.message}
          </p>
          <button
            onClick={() => window.location.reload()}
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
