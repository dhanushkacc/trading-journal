"use client";

import { useRef, useState } from "react";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import ImageViewer from "./ImageViewer";

interface ImageGalleryProps {
  images: string[];                              // URLs
  onAdd?: (files: File[]) => void;
  onRemove?: (index: number) => void;
  readOnly?: boolean;
}

export default function ImageGallery({
  images,
  onAdd,
  onRemove,
  readOnly = false,
}: ImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewSrc, setViewSrc] = useState<string | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length && onAdd) onAdd(files);
    e.target.value = "";
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      const files: File[] = [];
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            files.push(new File([blob], `paste_${Date.now()}.png`, { type }));
          }
        }
      }
      if (files.length && onAdd) onAdd(files);
    } catch {
      // fallback: open file dialog
      inputRef.current?.click();
    }
  };

  return (
    <>
      <div className="gallery-grid">
        {images.map((url, i) => (
          <div key={i} style={{ position: "relative" }}>
            <img
              src={url}
              alt={`Screenshot ${i + 1}`}
              className="gallery-thumb"
              onClick={() => setViewSrc(url)}
            />
            {!readOnly && onRemove && (
              <button
                onClick={() => onRemove(i)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {!readOnly && (
          <>
            <div
              className="upload-zone"
              onClick={() => inputRef.current?.click()}
              title="Upload images"
            >
              <Plus size={24} />
            </div>
            <div
              className="upload-zone"
              onClick={handlePaste}
              title="Paste from clipboard"
              style={{ fontSize: 16, flexDirection: "column", gap: 2 }}
            >
              <ImageIcon size={20} />
              <span style={{ fontSize: 10 }}>Paste</span>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFiles}
            />
          </>
        )}

        {images.length === 0 && readOnly && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>
            No screenshots attached.
          </p>
        )}
      </div>

      {viewSrc && <ImageViewer src={viewSrc} onClose={() => setViewSrc(null)} />}
    </>
  );
}
