"use client";

import { useState, useMemo } from "react";
import { Trade } from "@/lib/types";
import config from "@/lib/config";
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  XCircle,
  Minus,
  Eye,
  Filter,
  RotateCcw,
} from "lucide-react";

interface Props {
  trades: Trade[];
  onViewTrade: (trade: Trade) => void;
  onRefresh: () => void;
}

export default function AllTradesTab({ trades, onViewTrade }: Props) {
  const [fPair, setFPair] = useState("All");
  const [fDir, setFDir] = useState("All");
  const [fType, setFType] = useState("All");
  const [fOut, setFOut] = useState("All");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (fPair !== "All" && t.pair !== fPair) return false;
      if (fDir !== "All" && t.direction !== fDir) return false;
      if (fType !== "All" && t.trade_type !== fType) return false;
      if (fOut !== "All" && t.outcome !== fOut) return false;
      const tDate = (t.created_at || "").split("T")[0];
      if (fFrom && tDate < fFrom) return false;
      if (fTo && tDate > fTo) return false;
      return true;
    });
  }, [trades, fPair, fDir, fType, fOut, fFrom, fTo]);

  const resetFilters = () => {
    setFPair("All");
    setFDir("All");
    setFType("All");
    setFOut("All");
    setFFrom("");
    setFTo("");
  };

  const directionIcon = (d: string) =>
    d === "Buy" ? (
      <ArrowUpRight size={14} color="#10b981" />
    ) : (
      <ArrowDownRight size={14} color="#ef4444" />
    );

  const outcomeIcon = (o: string) => {
    if (o === "Win") return <Trophy size={14} color="#10b981" />;
    if (o === "Loss") return <XCircle size={14} color="#ef4444" />;
    return <Minus size={14} color="#8c95ad" />;
  };

  const outcomeBadge = (o: string) => {
    if (o === "Win") return "badge-green";
    if (o === "Loss") return "badge-red";
    return "badge-gray";
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="filter-bar">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginRight: 8,
          }}
        >
          <Filter size={16} color="var(--accent-blue)" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Filters</span>
        </div>

        <div className="filter-group">
          <label>Pair</label>
          <select
            className="input"
            value={fPair}
            onChange={(e) => setFPair(e.target.value)}
          >
            <option>All</option>
            {config.pairs.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Direction</label>
          <select
            className="input"
            value={fDir}
            onChange={(e) => setFDir(e.target.value)}
          >
            <option>All</option>
            {config.directions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <select
            className="input"
            value={fType}
            onChange={(e) => setFType(e.target.value)}
          >
            <option>All</option>
            {config.trade_types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Outcome</label>
          <select
            className="input"
            value={fOut}
            onChange={(e) => setFOut(e.target.value)}
          >
            <option>All</option>
            {config.outcomes.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            className="input"
            value={fFrom}
            onChange={(e) => setFFrom(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            className="input"
            value={fTo}
            onChange={(e) => setFTo(e.target.value)}
          />
        </div>

        <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Results count */}
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginBottom: 14,
        }}
      >
        Showing {filtered.length} of {trades.length} trades
      </p>

      {/* Trade cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((trade) => (
          <div key={trade.trade_id} className="card" style={{ padding: 0 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
                alignItems: "center",
                gap: 8,
                padding: "18px 24px",
              }}
            >
              {/* Pair & Direction */}
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {trade.pair}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      trade.direction === "Buy"
                        ? "var(--accent-green)"
                        : "var(--accent-red)",
                  }}
                >
                  {directionIcon(trade.direction)} {trade.direction.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  {(trade.created_at || "").replace("T", "  ").slice(0, 18)}
                </div>
              </div>

              {/* Type */}
              <div className="stat-box">
                <span className="stat-label">Type</span>
                <span className="stat-value" style={{ fontSize: 14 }}>
                  {trade.trade_type || "—"}
                </span>
              </div>

              {/* R:R / Risk */}
              <div className="stat-box">
                <span className="stat-label">Target R:R / Risk</span>
                <span className="stat-value" style={{ fontSize: 14 }}>
                  {trade.target_ratio || "—"}&nbsp;&nbsp;/&nbsp;&nbsp;$
                  {trade.risk_amount || "0"}
                </span>
              </div>

              {/* Outcome */}
              <div className="stat-box">
                <span className="stat-label">Outcome / P&L</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 2,
                  }}
                >
                  <span className={`badge ${outcomeBadge(trade.outcome)}`}>
                    {outcomeIcon(trade.outcome)} {trade.outcome || "—"}
                  </span>
                  {trade.profit && (
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color:
                          parseFloat(trade.profit) >= 0
                            ? "var(--accent-green)"
                            : "var(--accent-red)",
                      }}
                    >
                      ${trade.profit}
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              <button
                title="View Trade"
                onClick={() => onViewTrade(trade)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: 8,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--accent-blue)";
                  e.currentTarget.style.background = "rgba(59,130,246,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Eye size={18} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--text-muted)",
            }}
          >
            <Search size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 15 }}>No trades match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
