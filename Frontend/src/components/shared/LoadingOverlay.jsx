// src/components/shared/LoadingOverlay.jsx
import { useLoading } from '../../contexts/LoadingContext';

/**
 * Global full-screen loading overlay.
 * Shown whenever any API call is in-flight via the LoadingContext counter.
 *
 * Design: Glassmorphism card with an animated dotted-ring loader.
 * The backdrop is semi-transparent so the user can see content is behind it
 * without feeling completely blocked.
 */
export default function LoadingOverlay() {
  const { isLoading } = useLoading();

  return (
    <div
      aria-live="assertive"
      aria-label="Loading"
      className={`loading-overlay ${isLoading ? 'loading-overlay--visible' : ''}`}
    >
      <div className="loading-overlay__card">
        {/* Dotted Circle Spinner */}
        <div className="dot-ring" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="dot-ring__dot"
              style={{
                '--dot-index': i,
                transform: `rotate(${i * 30}deg) translate(0, -22px)`,
              }}
            />
          ))}
        </div>
        <p className="loading-overlay__text">Loading…</p>
      </div>

      <style>{`
        .loading-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 25, 55, 0.35);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s ease;
        }

        .loading-overlay--visible {
          opacity: 1;
          pointer-events: all;
        }

        .loading-overlay__card {
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.6);
          border-radius: 20px;
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-shadow: 0 20px 60px rgba(15,25,55,0.18), 0 0 0 1px rgba(255,255,255,0.5) inset;
          transform: scale(${0.95});
          transition: transform 0.18s ease;
        }

        .loading-overlay--visible .loading-overlay__card {
          transform: scale(1);
        }

        /* Dotted ring */
        .dot-ring {
          position: relative;
          width: 48px;
          height: 48px;
          animation: dot-ring-spin 1.2s linear infinite;
        }

        @keyframes dot-ring-spin {
          to { transform: rotate(360deg); }
        }

        .dot-ring__dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin: -3px 0 0 -3px;
          background: #1B2D5B;
          opacity: calc(0.2 + (var(--dot-index) / 12) * 0.8);
          transform-origin: 3px 3px;
        }

        .loading-overlay__text {
          font-family: 'Sora', 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #1B2D5B;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
