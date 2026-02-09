"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  screenName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.screenName}] Error:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          padding: "2rem",
          textAlign: "center",
          color: "#1A1816",
          fontFamily: "Outfit, sans-serif",
        }}>
          <h2 style={{ fontFamily: "Fraunces, serif", marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6B6560", marginBottom: "1rem" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "0.5rem 1rem",
              background: "#2D6A5D",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
