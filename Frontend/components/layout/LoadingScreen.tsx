"use client";

import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--surface, #f2f2f7)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      {/* Spinning ring + logo */}
      <div
        style={{
          position: "relative",
          width: 100,
          height: 100,
          marginBottom: 28,
        }}
      >
        {/* Outer ring */}
        <div className="loading-ring-outer" />
        {/* Inner ring */}
        <div className="loading-ring-inner" />
        {/* Logo center */}
        <div
          className="loading-logo-pulse"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src="/tiulogo.png"
            alt="TIU"
            width={60}
            height={60}
            style={{
              borderRadius: "50%",
              filter: "drop-shadow(0 0 10px rgba(200,16,46,0.4))",
              width: "auto",
              height: "auto",
            }}
            priority
          />
        </div>
      </div>

      {/* Brand */}
      <div
        style={{
          fontWeight: 800,
          fontSize: 19,
          color: "var(--heading, #1d1d1f)",
          letterSpacing: 0.3,
          fontFamily: "var(--font-playfair), Georgia, serif",
        }}
      >
        Techno India University
      </div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#C8102E",
          marginTop: 4,
          marginBottom: 28,
          fontWeight: 600,
        }}
      >
        Library Management System
      </div>

      {/* Bouncing dots */}
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 150, 300].map((delay, i) => (
          <div
            key={i}
            className="loading-dot-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
