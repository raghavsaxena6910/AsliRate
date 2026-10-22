"use client";

/** Last-resort error screen when the root layout itself fails. Kept dependency-free. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "64px 16px", color: "#0f1f17", background: "#fff" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>AsliRate didn&rsquo;t load</h1>
          <p style={{ color: "#3f4f47", lineHeight: 1.6 }}>Your data is safe. Please try again in a moment.</p>
          <button
            onClick={reset}
            style={{ marginTop: 16, padding: "10px 18px", borderRadius: 8, border: 0, background: "#0f1f17", color: "#fff", fontSize: 15, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
