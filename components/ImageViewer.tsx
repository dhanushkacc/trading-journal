"use client";

import { useState, useCallback } from "react";
import { X } from "lucide-react";

interface ImageViewerProps {
  src: string;
  onClose: () => void;
}

export default function ImageViewer({ src, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.max(0.2, Math.min(8, s + (e.deltaY > 0 ? -0.15 : 0.15))));
  }, []);

  return (
    <div className="image-overlay" onClick={onClose} onWheel={handleWheel}>
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10001,
          background: "rgba(255,255,255,0.1)",
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
      <p
        style={{
          position: "absolute",
          bottom: 18,
          color: "#666",
          fontSize: 13,
        }}
      >
        🔍 Scroll to zoom &nbsp;·&nbsp; Click backdrop to close
      </p>
      <img
        src={src}
        alt="Full view"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `scale(${scale})`, transition: "transform 0.15s" }}
      />
    </div>
  );
}
