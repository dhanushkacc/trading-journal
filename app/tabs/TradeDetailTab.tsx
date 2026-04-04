"use client";

import { useState } from "react";
import { Trade } from "@/lib/types";
import { deleteTrade } from "@/lib/api";
import config from "@/lib/config";
import ImageGallery from "@/components/ImageGallery";
import ConfirmModal from "@/components/ConfirmModal";
import {
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2,
  FileText,
  Camera,
  CheckCircle2,
} from "lucide-react";

interface Props {
  trade: Trade | null;
  onEdit: (trade: Trade) => void;
  onDelete: () => void;
}

export default function TradeDetailTab({ trade, onEdit, onDelete }: Props) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!trade) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          color: "var(--text-muted)",
          fontSize: 15,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FileText size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p>Select a trade from the list to view its details.</p>
        </div>
      </div>
    );
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteTrade(trade);
      setShowDeleteModal(false);
      onDelete();
    } catch (err) {
      console.error("Delete failed", err);
      // fallback if needed
    } finally {
      setIsDeleting(false);
    }
  };

  const dirColor =
    trade.direction === "Buy" ? "var(--accent-green)" : "var(--accent-red)";
  const outColor =
    trade.outcome === "Win"
      ? "var(--accent-green)"
      : trade.outcome === "Loss"
      ? "var(--accent-red)"
      : "var(--text-secondary)";

  // Helper — collect all images across all TF/phases
  const allTimeframes = config.timeframes;
  const phases = config.phases;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Trade: {trade.trade_id}
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Created: {(trade.created_at || "").replace("T", "  ").slice(0, 19)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            title="Edit Trade"
            onClick={() => onEdit(trade)}
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
            title="Delete Trade"
            onClick={() => setShowDeleteModal(true)}
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

      {/* Stats grid */}
      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div className="stat-box">
          <span className="stat-label">Pair</span>
          <span className="stat-value">{trade.pair}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Direction</span>
          <span
            className="stat-value"
            style={{ color: dirColor, display: "flex", alignItems: "center", gap: 4 }}
          >
            {trade.direction === "Buy" ? (
              <ArrowUpRight size={18} />
            ) : (
              <ArrowDownRight size={18} />
            )}
            {trade.direction}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Type</span>
          <span className="stat-value">{trade.trade_type || "—"}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Outcome / Profit</span>
          <span className="stat-value" style={{ color: outColor }}>
            {trade.outcome || "—"} {trade.profit ? `($${trade.profit})` : ""}
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-label">Risk Amount</span>
          <span className="stat-value">
            {trade.risk_amount ? `$${trade.risk_amount}` : "—"}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Target Ratio</span>
          <span className="stat-value">{trade.target_ratio || "—"}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Closed Ratio</span>
          <span className="stat-value">{trade.closed_ratio || "—"}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-heading">
          <FileText size={16} /> Notes
        </h3>
        <p
          style={{
            fontSize: 14,
            color: trade.notes ? "var(--text-primary)" : "var(--text-muted)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
          }}
        >
          {trade.notes || "No notes recorded."}
        </p>
      </div>

      {/* Confirmations */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-heading">
          <CheckCircle2 size={16} /> Confirmations
        </h3>
        {allTimeframes.map((tf) => {
          const tfAnalysis = trade.analysis?.[tf];
          if (!tfAnalysis) return null;

          const dirConfs = new Set<string>();
          const againstConfs = new Set<string>();
          Object.values(tfAnalysis).forEach((phase) => {
            (phase.confirmations || []).forEach((c: string) => dirConfs.add(c));
            (phase.against_confirmations || []).forEach((c: string) => againstConfs.add(c));
          });

          if (dirConfs.size === 0 && againstConfs.size === 0) return null;

          const dirColor = trade.direction === "Buy" ? "var(--accent-green)" : "var(--accent-red)";
          const againstColor = trade.direction === "Buy" ? "var(--accent-red)" : "var(--accent-green)";
          const dirBadge = trade.direction === "Buy" ? "badge-green" : "badge-red";
          const againstBadge = trade.direction === "Buy" ? "badge-red" : "badge-green";

          return (
            <div key={tf} style={{ marginBottom: 16 }}>
              <span className="badge badge-blue" style={{ marginBottom: 8, display: "inline-flex" }}>
                {tf.toUpperCase()}
              </span>

              {dirConfs.size > 0 && (
                <div style={{
                  padding: "10px 14px", marginTop: 6, marginBottom: 8, borderRadius: 8,
                  border: `1px solid ${trade.direction === "Buy" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                  background: trade.direction === "Buy" ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dirColor, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                    {trade.direction === "Buy" ? "📈" : "📉"} Direction ({trade.direction})
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[...dirConfs].map((c) => (
                      <span key={c} className={`badge ${dirBadge}`}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {againstConfs.size > 0 && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8,
                  border: `1px solid ${trade.direction === "Buy" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
                  background: trade.direction === "Buy" ? "rgba(239,68,68,0.04)" : "rgba(16,185,129,0.04)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: againstColor, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                    {trade.direction === "Buy" ? "📉" : "📈"} Against Direction ({trade.direction === "Buy" ? "Sell" : "Buy"})
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[...againstConfs].map((c) => (
                      <span key={c} className={`badge ${againstBadge}`}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Screenshots by timeframe */}
      {allTimeframes.map((tf) => {
        const tfAnalysis = trade.analysis?.[tf];
        if (!tfAnalysis) return null;

        return phases.map((phase) => {
          const imgs = tfAnalysis[phase]?.images || [];
          if (imgs.length === 0) return null;
          return (
            <div className="card" style={{ marginBottom: 16 }} key={`${tf}-${phase}`}>
              <h3 className="section-heading">
                <Camera size={16} /> {tf.toUpperCase()} – {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
              </h3>
              <ImageGallery images={imgs} readOnly />
            </div>
          );
        });
      })}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Trade"
        message="Are you sure you want to permanently delete this trade? All associated data and images will be removed."
        confirmText="Delete Trade"
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
