"use client";

import React from "react";
import dynamic from "next/dynamic";
import "@/styles/offline.css";

const DinoGame = dynamic(() => import("./DinoGame"), { ssr: false });

/**
 * WiFi icon with exclamation mark — matches the reference image.
 * Purple arcs with a vertical exclamation line through center.
 */
function WifiIcon() {
  return (
    <svg
      className="wifi-icon"
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="140"
      height="140"
    >
      {/* Outer arc */}
      <path
        d="M20 72C32 42 56 24 70 24C84 24 108 42 120 72"
        stroke="#3b2d8f"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Middle arc */}
      <path
        d="M34 82C42 60 56 46 70 46C84 46 98 60 106 82"
        stroke="#4c3cae"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner arc */}
      <path
        d="M48 92C52 78 60 68 70 68C80 68 88 78 92 92"
        stroke="#6D5AE6"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Center dot */}
      <circle cx="70" cy="108" r="6" fill="#6D5AE6" />
      {/* Exclamation line */}
      <rect x="66" y="10" width="8" height="54" rx="4" fill="#6D5AE6" />
      {/* Exclamation dot (top, for second dot effect) */}
      <circle cx="70" cy="74" r="5" fill="#6D5AE6" />
    </svg>
  );
}

/**
 * Reload icon (circular arrow).
 */
function ReloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

export default function OfflinePage() {
  return (
    <div className="offline-page">
      {/* WiFi icon */}
      <div className="wifi-icon-container">
        <WifiIcon />
      </div>

      {/* Message */}
      <p className="offline-message">It looks like you have network issues</p>

      {/* Reload button */}
      <button
        className="reload-btn"
        onClick={() => window.location.reload()}
        type="button"
      >
        <ReloadIcon />
        Reload page
      </button>

      {/* Dino game */}
      <div className="game-container">
        <DinoGame />
      </div>
    </div>
  );
}
