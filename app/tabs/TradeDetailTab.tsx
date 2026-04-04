"use client";

import { Trade } from "@/lib/types";
import { deleteTrade } from "@/lib/api";
import config from "@/lib/config";
import ImageGallery from "@/components/ImageGallery";
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

  const handleDelete = async () => {
    if (!confirm("Permanently delete this trade and all its images?")) return;
    try {
      await deleteTrade(trade);
      onDelete();
    } catch (err) {
      console.error("Delete failed", err);
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
    <div style={{ maxWidth: 1000 }}>
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
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => onEdit(trade)}>
            <Pencil size={14} /> Edit Trade
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
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

          // Collect confirmations from all phases (they're stored differently)
          const confirmations = new Set<string>();
          Object.values(tfAnalysis).forEach((phase) => {
            (phase.confirmations || []).forEach((c: string) => confirmations.add(c));
          });

          if (confirmations.size === 0) return null;

          return (
            <div key={tf} style={{ marginBottom: 10 }}>
              <span
                className="badge badge-blue"
                style={{ marginBottom: 6, display: "inline-flex" }}
              >
                {tf.toUpperCase()}
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {[...confirmations].map((c) => (
                  <span key={c} className="badge badge-amber">
                    {c}
                  </span>
                ))}
              </div>
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
    </div>
  );
}
