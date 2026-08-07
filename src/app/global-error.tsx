"use client";

/**
 * Last resort: catches failures in the root layout itself, where `error.tsx`
 * cannot help because the layout that would wrap it is the thing that broke.
 * It has to render its own `<html>`/`<body>`, and cannot rely on the providers
 * or the font variables, so the styling here is deliberately self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          background: "#fff",
          color: "#18181b",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            IGI Portal could not start
          </h1>
          <p style={{ fontSize: "0.75rem", color: "#71717a" }}>
            {error.message || "An unexpected error stopped the app loading."}
          </p>
          {error.digest ? (
            <p style={{ fontSize: "0.75rem", color: "#71717a" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 0.75rem",
              fontSize: "0.75rem",
              fontFamily: "inherit",
              color: "#fafafa",
              background: "#18181b",
              border: "1px solid #18181b",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
