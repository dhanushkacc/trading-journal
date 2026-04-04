"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ImageViewerProps {
  src: string;
  onClose: () => void;
}

export default function ImageViewer({ src, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Ensure portal only renders client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.2, Math.min(8, s + (e.deltaY > 0 ? -0.15 : 0.15))));
  }, []);

  if (!mounted) return null;

  const overlay = (
    <div
      onClick={onClose}
      onWheel={handleWheel}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.92)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.25s ease",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 100000,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 10,
          padding: "8px 18px",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          fontWeight: 600,
          backdropFilter: "blur(8px)",
        }}
      >
        <X size={16} /> Close (Esc)
      </button>

      {/* Zoom hint */}
      <p
        style={{
          position: "fixed",
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          color: "#666",
          fontSize: 13,
          pointerEvents: "none",
        }}
      >
        🔍 Scroll to zoom &nbsp;·&nbsp; Click backdrop to close
      </p>

      {/* Image */}
      <img
        src={src}
        alt="Full view"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: 8,
          boxShadow: "0 0 60px rgba(0, 0, 0, 0.5)",
          transform: `scale(${scale})`,
          transition: "transform 0.15s",
        }}
      />
    </div>
  );

  // Render via portal to document.body — guarantees centering
  return createPortal(overlay, document.body);
}
