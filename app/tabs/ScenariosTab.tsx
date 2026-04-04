"use client";

import { useState, useEffect, useCallback } from "react";
import { Scenario } from "@/lib/types";
import {
  loadScenarios,
  saveScenario,
  updateScenario,
  deleteScenario,
  uploadImage,
} from "@/lib/api";
import ImageGallery from "@/components/ImageGallery";
import ImageViewer from "@/components/ImageViewer";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  Microscope,
  StickyNote,
  Camera,
  ArrowLeft,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type Mode = "list" | "form" | "detail";

function makeScenarioId() {
  const d = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `scenario_${d}_${uuidv4().slice(0, 4)}`;
}

export default function ScenariosTab() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<Scenario | null>(null);
  const [viewing, setViewing] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const [viewImg, setViewImg] = useState<string | null>(null);
  
  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Scenario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fNotes, setFNotes] = useState<string[]>([""]);
  const [fImages, setFImages] = useState<string[]>([]);
  const [fPendingFiles, setFPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadScenarios();
      setScenarios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  };

  // ── form helpers ──
  const resetForm = () => {
    setFTitle("");
    setFNotes([""]);
    setFImages([]);
    setFPendingFiles([]);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setMode("form");
  };

  const openEdit = (s: Scenario) => {
    setEditing(s);
    setFTitle(s.title);
    setFNotes(s.notes.length ? [...s.notes] : [""]);
    setFImages([...s.images]);
    setFPendingFiles([]);
    setMode("form");
  };

  const openView = (s: Scenario) => {
    setViewing(s);
    setMode("detail");
  };

  const handleAddImages = (files: File[]) => {
    setFPendingFiles((prev) => [...prev, ...files]);
    setFImages((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const handleRemoveImage = (idx: number) => {
    setFImages((prev) => prev.filter((_, i) => i !== idx));
    // if it's a pending file, remove from pending too
    const remoteCount = fImages.filter((u) => !u.startsWith("blob:")).length;
    if (idx >= remoteCount) {
      const pendingIdx = idx - remoteCount;
      setFPendingFiles((prev) => prev.filter((_, i) => i !== pendingIdx));
    }
  };

  const addNoteRow = () => setFNotes((prev) => [...prev, ""]);
  const updateNote = (i: number, val: string) =>
    setFNotes((prev) => prev.map((n, idx) => (idx === i ? val : n)));
  const removeNote = (i: number) =>
    setFNotes((prev) => (prev.length <= 1 ? [""] : prev.filter((_, idx) => idx !== i)));

  const handleSaveScenario = async () => {
    if (!fTitle.trim()) {
      alert("Please enter a scenario title.");
      return;
    }
    setSaving(true);
    try {
      // Upload new files
      const uploadedUrls: string[] = [];
      for (const url of fImages) {
        if (!url.startsWith("blob:")) {
          uploadedUrls.push(url);
        }
      }
      for (const file of fPendingFiles) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }

      const notes = fNotes.filter((n) => n.trim());
      const now = new Date().toISOString();

      if (editing) {
        const updated: Scenario = {
          ...editing,
          title: fTitle.trim(),
          notes,
          images: uploadedUrls,
          updated_at: now,
        };
        await updateScenario(updated);
        showToast("✅ Scenario updated!");
      } else {
        const newScenario: Scenario = {
          scenario_id: makeScenarioId(),
          title: fTitle.trim(),
          notes,
          images: uploadedUrls,
          created_at: now,
          updated_at: now,
        };
        await saveScenario(newScenario);
        showToast("✅ Scenario saved!");
      }

      resetForm();
      setMode("list");
      fetchAll();
    } catch (e) {
      console.error(e);
      alert("Failed to save. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteScenario(deleteTarget);
      showToast("🗑 Scenario deleted");
      if (viewing?.scenario_id === deleteTarget.scenario_id) setMode("list");
      fetchAll();
    } catch (e) {
      console.error(e);
      alert("Failed to delete. Check console.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Renders ──

  const renderList = () => (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
          <Microscope size={22} color="var(--accent-purple)" />
          Inspection Scenarios
        </h2>
        <button className="btn btn-success" onClick={openCreate}>
          <Plus size={16} /> New Scenario
        </button>
      </div>

      {loading && (
        <p style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>
          Loading...
        </p>
      )}

      {!loading && scenarios.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 0",
            color: "var(--text-muted)",
          }}
        >
          <Microscope size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p style={{ fontSize: 15, marginBottom: 8 }}>
            No scenarios yet.
          </p>
          <p style={{ fontSize: 13 }}>
            Click <b>&quot;+ New Scenario&quot;</b> to create your first inspection scenario.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {scenarios.map((s) => (
          <div
            key={s.scenario_id}
            className="card"
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 20,
              alignItems: "start",
            }}
          >
            {/* Thumbnails */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", width: 200 }}>
              {s.images.slice(0, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  style={{
                    width: 90,
                    height: 65,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                  onClick={() => setViewImg(url)}
                />
              ))}
              {s.images.length === 0 && (
                <div
                  style={{
                    width: 90,
                    height: 65,
                    borderRadius: 8,
                    border: "1px dashed var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: 11,
                  }}
                >
                  No images
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                🗓 {s.updated_at?.replace("T", "  ").slice(0, 18)} &nbsp;·&nbsp;
                {s.images.length} image(s) &nbsp;·&nbsp; {s.notes.length} note(s)
              </p>
              {s.notes.slice(0, 2).map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: "4px 12px",
                    marginBottom: 4,
                    borderRadius: 6,
                    background: "var(--bg-secondary)",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  • {n}
                </div>
              ))}
              {s.notes.length > 2 && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    marginTop: 2,
                  }}
                >
                  +{s.notes.length - 2} more note(s)...
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "row", gap: 6, justifyContent: "flex-end" }}>
              <button
                title="View Scenario"
                onClick={() => openView(s)}
                style={{
                  background: "transparent", border: "none", color: "var(--text-secondary)",
                  cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-blue)"; e.currentTarget.style.background = "rgba(59,130,246,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
              >
                <Eye size={18} />
              </button>
              <button
                title="Edit Scenario"
                onClick={() => openEdit(s)}
                style={{
                  background: "transparent", border: "none", color: "var(--text-secondary)",
                  cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-blue)"; e.currentTarget.style.background = "rgba(59,130,246,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
              >
                <Pencil size={18} />
              </button>
              <button
                title="Delete Scenario"
                onClick={() => setDeleteTarget(s)}
                style={{
                  background: "transparent", border: "none", color: "var(--text-secondary)",
                  cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!viewing) return null;
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMode("list")}
              style={{ marginBottom: 8 }}
            >
              <ArrowLeft size={14} /> Back to List
            </button>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>{viewing.title}</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Updated: {viewing.updated_at?.replace("T", "  ").slice(0, 19)}{" "}
              &nbsp;·&nbsp; {viewing.images.length} image(s) &nbsp;·&nbsp;{" "}
              {viewing.notes.length} note(s)
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              title="Edit Scenario"
              onClick={() => openEdit(viewing)}
              style={{
                background: "transparent", border: "none", color: "var(--text-secondary)",
                cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-blue)"; e.currentTarget.style.background = "rgba(59,130,246,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
            >
              <Pencil size={18} />
            </button>
            <button
              title="Delete Scenario"
              onClick={() => setDeleteTarget(viewing)}
              style={{
                background: "transparent", border: "none", color: "var(--text-secondary)",
                cursor: "pointer", padding: 8, borderRadius: 8, display: "flex", alignItems: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="section-heading">
            <Camera size={16} /> Screenshots
          </h3>
          <ImageGallery images={viewing.images} readOnly />
        </div>

        <div className="card">
          <h3 className="section-heading">
            <StickyNote size={16} /> Inspection Notes
          </h3>
          {viewing.notes.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>
              No notes added.
            </p>
          )}
          {viewing.notes.map((note, i) => (
            <div
              key={i}
              style={{
                padding: "10px 16px",
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                fontSize: 14,
              }}
            >
              <span style={{ color: "var(--accent-blue)", fontWeight: 600, marginRight: 8 }}>
                {i + 1}.
              </span>
              {note}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>
          {editing ? "Edit Scenario" : "New Scenario"}
        </h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            resetForm();
            setMode("list");
          }}
        >
          <X size={14} /> Cancel
        </button>
      </div>

      {/* Title */}
      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
          Scenario Title *
        </label>
        <input
          className="input"
          placeholder="e.g. Bullish Engulfing at Support"
          value={fTitle}
          onChange={(e) => setFTitle(e.target.value)}
          style={{ marginTop: 6 }}
        />
      </div>

      {/* Screenshots */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="section-heading">
          <Camera size={16} /> Screenshots
        </h3>
        <ImageGallery
          images={fImages}
          onAdd={handleAddImages}
          onRemove={handleRemoveImage}
        />
      </div>

      {/* Notes */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 className="section-heading" style={{ marginBottom: 0 }}>
            <StickyNote size={16} /> Inspection Notes
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={addNoteRow}>
            <Plus size={14} /> Add Point
          </button>
        </div>

        {fNotes.map((note, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--accent-blue)", fontWeight: 600, width: 20 }}>
              •
            </span>
            <input
              className="input"
              placeholder="Add an inspection point..."
              value={note}
              onChange={(e) => updateNote(i, e.target.value)}
            />
            <button
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              onClick={() => removeNote(i)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-success"
          onClick={handleSaveScenario}
          disabled={saving}
          style={{
            padding: "14px 40px",
            fontSize: 16,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Save size={18} /> {saving ? "Saving..." : "Save Scenario"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {mode === "list" && renderList()}
      {mode === "detail" && renderDetail()}
      {mode === "form" && renderForm()}

      {viewImg && <ImageViewer src={viewImg} onClose={() => setViewImg(null)} />}
      {toastMsg && <Toast key={toastKey} message={toastMsg} />}
      
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Scenario"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All associated images and notes will be removed.`}
        confirmText="Delete Scenario"
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
