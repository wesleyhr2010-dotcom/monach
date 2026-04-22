"use client";

import { useState } from "react";

interface ConferirComprovanteProps {
  url: string | null | undefined;
}

export function ConferirComprovante({ url }: ConferirComprovanteProps) {
  const [showFull, setShowFull] = useState(false);

  return (
    <div
      style={{
        backgroundColor: "#171717",
        border: "1px solid #222222",
        borderRadius: 12,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          color: "#444444",
          fontFamily: '"RalewayRoman-Bold","Raleway",system-ui,sans-serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Comprovante de Devolução
      </div>

      {/* Photo area */}
      {url ? (
        <>
          <div
            style={{
              position: "relative",
              borderRadius: 10,
              border: "1px solid #2A2A2A",
              overflow: "hidden",
              height: 160,
              cursor: "pointer",
            }}
            onClick={() => setShowFull(!showFull)}
          >
            <img
              src={url}
              alt="Comprovante de devolução"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Fullscreen toggle */}
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(0,0,0,0.5)",
                borderRadius: 6,
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#999999" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 4V1h3M7 1h3v3M1 7v3h3M7 10h3V7" />
              </svg>
            </div>
          </div>

          {showFull && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setShowFull(false)}
            >
              <img
                src={url}
                alt="Comprovante em tela cheia"
                style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
      ) : (
        /* No photo placeholder */
        <div
          style={{
            position: "relative",
            borderRadius: 10,
            border: "1px solid #2A2A2A",
            overflow: "hidden",
            height: 160,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "linear-gradient(135deg, #1A2A1A 0%, #131A13 100%)",
          }}
        >
          {/* Expand icon */}
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(0,0,0,0.5)",
              borderRadius: 6,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#999999" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 4V1h3M7 1h3v3M1 7v3h3M7 10h3V7" />
            </svg>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 10,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="18" height="14" rx="2" />
              <circle cx="10" cy="11" r="3" />
              <path d="M7 4l1.5-2h3L13 4" />
            </svg>
          </div>
          <div
            style={{
              color: "#4ADE80",
              fontFamily: '"RalewayRoman-SemiBold","Raleway",system-ui,sans-serif',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Ver foto do comprovante
          </div>

        </div>
      )}

      <div
        style={{
          color: "#444444",
          fontSize: 11,
          fontFamily: "Raleway,system-ui,sans-serif",
          textAlign: "center",
        }}
      >
        Clique para abrir em tela cheia
      </div>
    </div>
  );
}
