"use client";

import { useState, useEffect, useCallback } from "react";
import { OrderFlow } from "@/lib/types";
import {
  loadOrderFlows,
  saveOrderFlow,
  updateOrderFlow,
  deleteOrderFlow,
  uploadImage,
} from "@/lib/api";
import ImageGallery from "@/components/ImageGallery";
import ImageViewer from "@/components/ImageViewer";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  Activity,
  StickyNote,
  Camera,
  ArrowLeft,
  Tag,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type Mode = "list" | "form" | "detail";

function makeOrderFlowId() {
  const d = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `oflow_${d}_${uuidv4().slice(0, 4)}`;
}

/** Strip HTML tags for plain-text previews. */
function stripHtml(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, " ");
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

export default function OrderFlowTab() {
  const [flows, setFlows] = useState<OrderFlow[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<OrderFlow | null>(null);
  const [viewing, setViewing] = useState<OrderFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastKey, setToastKey] = useState(0);
  const [viewImg, setViewImg] = useState<string | null>(null);

  // Tag filter state
  const [filterTag, setFilterTag] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<OrderFlow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fNotes, setFNotes] = useState<string[]>([""]);
  const [fImages, setFImages] = useState<string[]>([]);
  const [fPendingFiles, setFPendingFiles] = useState<File[]>([]);
  const [fTags, setFTags] = useState<string[]>([]);
  const [fTagInput, setFTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadOrderFlows();
      setFlows(data);
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
    setFTags([]);
    setFTagInput("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setMode("form");
  };

  const openEdit = (o: OrderFlow) => {
    setEditing(o);
    setFTitle(o.title);
    setFNotes(o.notes.length ? [...o.notes] : [""]);
    setFImages([...o.images]);
    setFTags(o.tags?.length ? [...o.tags] : []);
    setFTagInput("");
    setFPendingFiles([]);
    setMode("form");
  };

  const openView = (o: OrderFlow) => {
    setViewing(o);
    setMode("detail");
  };

  const handleAddImages = (files: File[]) => {
    setFPendingFiles((prev) => [...prev, ...files]);
    setFImages((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const handleRemoveImage = (idx: number) => {
    setFImages((prev) => prev.filter((_, i) => i !== idx));
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

  const handleAddTag = () => {
    if (!fTagInput.trim()) return;
    const t = fTagInput.trim();
    if (!fTags.includes(t)) setFTags((prev) => [...prev, t]);
    setFTagInput("");
  };

  const handleRemoveTag = (t: string) => {
    setFTags((prev) => prev.filter((x) => x !== t));
  };

  const handleSave = async () => {
    if (!fTitle.trim()) {
      alert("Please enter an order flow title.");
      return;
    }
    setSaving(true);
    try {
      // Keep existing remote URLs, upload new pending files
      const uploadedUrls: string[] = [];
      for (const url of fImages) {
        if (!url.startsWith("blob:")) uploadedUrls.push(url);
      }
      for (const file of fPendingFiles) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }

      // Drop points with no visible text
      const notes = fNotes.filter((n) => stripHtml(n).length > 0);
      const now = new Date().toISOString();

      if (editing) {
        const updated: OrderFlow = {
          ...editing,
          title: fTitle.trim(),
          tags: fTags,
          notes,
          images: uploadedUrls,
          updated_at: now,
        };
        await updateOrderFlow(updated);
        showToast("✅ Order flow updated!");
      } else {
        const newFlow: OrderFlow = {
          order_flow_id: makeOrderFlowId(),
          title: fTitle.trim(),
          tags: fTags,
          notes,
          images: uploadedUrls,
          created_at: now,
          updated_at: now,
        };
        await saveOrderFlow(newFlow);
        showToast("✅ Order flow saved!");
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
      await deleteOrderFlow(deleteTarget);
      showToast("🗑 Order flow deleted");
      if (viewing?.order_flow_id === deleteTarget.order_flow_id) setMode("list");
      fetchAll();
    } catch (e) {
      console.error(e);
      alert("Failed to delete. Check console.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Derived ──
  const allTags = Array.from(new Set(flows.flatMap((o) => o.tags || []))).sort();
  const displayFlows = filterTag
    ? flows.filter((o) => (o.tags || []).includes(filterTag))
    : flows;

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
          <Activity size={22} color="var(--accent-blue)" />
          Order Flow Journal
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          {allTags.length > 0 && (
            <select
              className="input"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              style={{ width: 160, padding: "8px 12px" }}
            >
              <option value="">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          <button className="btn btn-success" onClick={openCreate}>
            <Plus size={16} /> New Order Flow
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      )}

      {!loading && flows.length === 0 && (
        <div className="empty-state">
          <div className="es-icon">
            <Activity size={34} />
          </div>
          <p style={{ fontSize: 15, marginBottom: 8 }}>No order flows yet.</p>
          <p style={{ fontSize: 13 }}>
            Click <b>&quot;+ New Order Flow&quot;</b> to journal your first order-flow read.
          </p>
        </div>
      )}

      <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {displayFlows.map((o) => (
          <div
            key={o.order_flow_id}
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
              {o.images.slice(0, 3).map((url, i) => (
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
              {o.images.length === 0 && (
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
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{o.title}</h3>
              {(o.tags || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {o.tags!.map((t) => (
                    <span key={t} className="tag-chip">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                🗓 {o.updated_at?.replace("T", "  ").slice(0, 18)} &nbsp;·&nbsp;
                {o.images.length} image(s) &nbsp;·&nbsp; {o.notes.length} note(s)
              </p>
              {o.notes.slice(0, 2).map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: "4px 12px",
                    marginBottom: 4,
                    borderRadius: 6,
                    background: "var(--surface-1)",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  • {stripHtml(n)}
                </div>
              ))}
              {o.notes.length > 2 && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    marginTop: 2,
                  }}
                >
                  +{o.notes.length - 2} more note(s)...
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "row", gap: 6, justifyContent: "flex-end" }}>
              <button className="icon-btn" title="View Order Flow" onClick={() => openView(o)}>
                <Eye size={18} />
              </button>
              <button className="icon-btn" title="Edit Order Flow" onClick={() => openEdit(o)}>
                <Pencil size={18} />
              </button>
              <button className="icon-btn danger" title="Delete Order Flow" onClick={() => setDeleteTarget(o)}>
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
      <div className="animate-in" style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMode("list")}
              style={{ marginBottom: 10 }}
            >
              <ArrowLeft size={14} /> Back to List
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>
              {viewing.title}
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Updated: {viewing.updated_at?.replace("T", "  ").slice(0, 19)} &nbsp;·&nbsp;{" "}
              {viewing.images.length} image(s) &nbsp;·&nbsp; {viewing.notes.length} note(s)
            </p>
            {(viewing.tags || []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {viewing.tags!.map((t) => (
                  <span key={t} className="tag-chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="icon-btn" title="Edit Order Flow" onClick={() => openEdit(viewing)}>
              <Pencil size={18} />
            </button>
            <button className="icon-btn danger" title="Delete Order Flow" onClick={() => setDeleteTarget(viewing)}>
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
            <StickyNote size={16} /> Order Flow Notes
          </h3>
          {viewing.notes.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>
              No notes added.
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {viewing.notes.map((note, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-1)",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "var(--grad-primary)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </span>
                <div
                  className="rich-content"
                  style={{ flex: 1, paddingTop: 2 }}
                  dangerouslySetInnerHTML={{ __html: note }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <div className="animate-in" style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>
          {editing ? "Edit Order Flow" : "New Order Flow"}
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
          Order Flow Title *
        </label>
        <input
          className="input"
          placeholder="e.g. Absorption at session high → reversal"
          value={fTitle}
          onChange={(e) => setFTitle(e.target.value)}
          style={{ marginTop: 6 }}
        />
      </div>

      {/* Tags */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="section-heading" style={{ marginBottom: 12 }}>
          <Tag size={16} /> Order Flow Tags
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {fTags.map((t) => (
            <div key={t} className="tag-chip">
              {t}
              <button
                onClick={() => handleRemoveTag(t)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  padding: 0,
                  opacity: 0.7,
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        {(() => {
          const available = allTags.filter((t) => !fTags.includes(t));
          if (available.length > 0) {
            return (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                  Click to add existing tags:
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {available.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFTags((prev) => [...prev, t])}
                      style={{
                        background: "var(--surface-1)",
                        border: "1px dashed var(--border)",
                        color: "var(--text-secondary)",
                        padding: "4px 10px",
                        borderRadius: 16,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--accent-blue)";
                        e.currentTarget.style.borderColor = "var(--accent-blue)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}
        <div style={{ display: "flex", gap: 8, maxWidth: 320 }}>
          <input
            className="input"
            placeholder="Type new or custom tag..."
            value={fTagInput}
            onChange={(e) => setFTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <button className="btn btn-secondary" onClick={handleAddTag} type="button">
            Add
          </button>
        </div>
      </div>

      {/* Screenshots */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="section-heading">
          <Camera size={16} /> Screenshots
        </h3>
        <ImageGallery images={fImages} onAdd={handleAddImages} onRemove={handleRemoveImage} />
      </div>

      {/* Notes — rich points */}
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
            <StickyNote size={16} /> Order Flow Notes
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={addNoteRow}>
            <Plus size={14} /> Add Point
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fNotes.map((note, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 8,
                  width: 22,
                  color: "var(--accent-blue)",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <RichTextEditor value={note} onChange={(html) => updateNote(i, html)} />
              </div>
              <button
                title="Remove point"
                style={{
                  marginTop: 6,
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
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-success"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "14px 40px", fontSize: 16, opacity: saving ? 0.6 : 1 }}
        >
          <Save size={18} /> {saving ? "Saving..." : "Save Order Flow"}
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
        title="Delete Order Flow"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All associated images and notes will be removed.`}
        confirmText="Delete Order Flow"
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
