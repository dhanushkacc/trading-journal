"use client";

import { useState, useEffect } from "react";
import { Trade, TimeframeAnalysis } from "@/lib/types";
import config from "@/lib/config";
import { saveTrade, updateTrade, uploadImage } from "@/lib/api";
import ImageGallery from "@/components/ImageGallery";
import { Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface Props {
  editingTrade: Trade | null;
  onSaved: () => void;
  onCancel: () => void;
}

function makeTradeId(pair: string) {
  const now = new Date();
  const d = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const clean = pair.replace("/", "");
  return `${d}_${clean}_${uuidv4().slice(0, 4)}`;
}

export default function TradeFormTab({ editingTrade, onSaved, onCancel }: Props) {
  const [pair, setPair] = useState("BTC/USD");
  const [direction, setDirection] = useState("Buy");
  const [tradeType, setTradeType] = useState("Counter Trend");
  const [targetRatio, setTargetRatio] = useState("1:1");
  const [closedRatio, setClosedRatio] = useState("");
  const [riskAmount, setRiskAmount] = useState("");
  const [outcome, setOutcome] = useState("Win");
  const [profit, setProfit] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Per-timeframe data: images (urls), confirmations, params
  const [tfData, setTfData] = useState<
    Record<string, Record<string, { images: string[]; pendingFiles: File[] }>>
  >({});
  const [confirmations, setConfirmations] = useState<Record<string, string[]>>({});
  const [againstConfirmations, setAgainstConfirmations] = useState<Record<string, string[]>>({});
  const [tfParams, setTfParams] = useState<Record<string, Record<string, string>>>({});

  // Accordion state for timeframes
  const [openTf, setOpenTf] = useState<string>(config.timeframes[0]);

  // Init data structure
  useEffect(() => {
    const initTf: typeof tfData = {};
    const initConf: typeof confirmations = {};
    const initAgainst: typeof againstConfirmations = {};
    const initParams: typeof tfParams = {};
    config.timeframes.forEach((tf) => {
      initTf[tf] = {};
      config.phases.forEach((p) => {
        initTf[tf][p] = { images: [], pendingFiles: [] };
      });
      initConf[tf] = [];
      initAgainst[tf] = [];
      initParams[tf] = {};
    });
    setTfData(initTf);
    setConfirmations(initConf);
    setAgainstConfirmations(initAgainst);
    setTfParams(initParams);
  }, []);

  // Populate when editing
  useEffect(() => {
    if (!editingTrade) return;
    setPair(editingTrade.pair);
    setDirection(editingTrade.direction);
    setTradeType(editingTrade.trade_type);
    setTargetRatio(editingTrade.target_ratio);
    setClosedRatio(editingTrade.closed_ratio);
    setRiskAmount(editingTrade.risk_amount);
    setOutcome(editingTrade.outcome);
    setProfit(editingTrade.profit);
    setNotes(editingTrade.notes);

    const newTf: typeof tfData = {};
    const newConf: typeof confirmations = {};
    const newAgainst: typeof againstConfirmations = {};
    const newParams: typeof tfParams = {};
    config.timeframes.forEach((tf) => {
      newTf[tf] = {};
      config.phases.forEach((p) => {
        const phaseData = editingTrade.analysis?.[tf]?.[p];
        newTf[tf][p] = {
          images: phaseData?.images || [],
          pendingFiles: [],
        };
      });
      const anyPhase = editingTrade.analysis?.[tf]?.before || editingTrade.analysis?.[tf]?.after;
      newConf[tf] = anyPhase?.confirmations || [];
      newAgainst[tf] = anyPhase?.against_confirmations || [];
      newParams[tf] = {};
      if (anyPhase?.trend) newParams[tf]["trend"] = anyPhase.trend;
      if (anyPhase?.mid_level) newParams[tf]["mid_level"] = anyPhase.mid_level;
    });
    setTfData(newTf);
    setConfirmations(newConf);
    setAgainstConfirmations(newAgainst);
    setTfParams(newParams);
  }, [editingTrade]);

  const addImages = (tf: string, phase: string, files: File[]) => {
    setTfData((prev) => {
      const copy = { ...prev };
      copy[tf] = { ...copy[tf] };
      copy[tf][phase] = {
        ...copy[tf][phase],
        pendingFiles: [...copy[tf][phase].pendingFiles, ...files],
        images: [
          ...copy[tf][phase].images,
          ...files.map((f) => URL.createObjectURL(f)),
        ],
      };
      return copy;
    });
  };

  const removeImage = (tf: string, phase: string, index: number) => {
    setTfData((prev) => {
      const copy = { ...prev };
      copy[tf] = { ...copy[tf] };
      const imgs = [...copy[tf][phase].images];
      const pending = [...copy[tf][phase].pendingFiles];
      imgs.splice(index, 1);
      if (index < pending.length) pending.splice(index, 1);
      copy[tf][phase] = { images: imgs, pendingFiles: pending };
      return copy;
    });
  };

  const toggleConfirmation = (tf: string, confId: string) => {
    setConfirmations((prev) => {
      const arr = prev[tf] || [];
      return {
        ...prev,
        [tf]: arr.includes(confId) ? arr.filter((c) => c !== confId) : [...arr, confId],
      };
    });
  };

  const toggleAgainstConfirmation = (tf: string, confId: string) => {
    setAgainstConfirmations((prev) => {
      const arr = prev[tf] || [];
      return {
        ...prev,
        [tf]: arr.includes(confId) ? arr.filter((c) => c !== confId) : [...arr, confId],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload pending images
      const analysis: Record<string, Record<string, TimeframeAnalysis>> = {};
      for (const tf of config.timeframes) {
        analysis[tf] = {};
        for (const phase of config.phases) {
          const data = tfData[tf]?.[phase];
          const uploadedUrls: string[] = [];

          if (data) {
            // Keep existing remote URLs (non-blob)
            for (const url of data.images) {
              if (!url.startsWith("blob:")) {
                uploadedUrls.push(url);
              }
            }
            // Upload new files
            for (const file of data.pendingFiles) {
              const url = await uploadImage(file);
              uploadedUrls.push(url);
            }
          }

          analysis[tf][phase] = {
            images: uploadedUrls,
            confirmations: confirmations[tf] || [],
            against_confirmations: againstConfirmations[tf] || [],
            trend: tfParams[tf]?.trend,
            mid_level: tfParams[tf]?.mid_level,
          };
        }
      }

      const trade: Trade = {
        trade_id: editingTrade ? editingTrade.trade_id : makeTradeId(pair),
        pair,
        direction,
        trade_type: tradeType,
        target_ratio: targetRatio,
        closed_ratio: closedRatio,
        risk_amount: riskAmount,
        outcome,
        profit,
        notes,
        analysis,
        created_at: editingTrade?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (editingTrade) {
        await updateTrade(trade);
      } else {
        await saveTrade(trade);
      }
      onSaved();
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save trade. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const allConfs = [
    ...config.common_confirmations,
    ...(direction === "Buy" ? config.buy_confirmations : config.sell_confirmations),
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>
          {editingTrade ? "Edit Trade" : "New Trade"}
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          <X size={14} /> Cancel
        </button>
      </div>

      {/* Main fields */}
      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
            Pair
          </label>
          <select className="input" value={pair} onChange={(e) => setPair(e.target.value)}>
            {config.pairs.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
            Direction
          </label>
          <select
            className="input"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            {config.directions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
            Type
          </label>
          <select
            className="input"
            value={tradeType}
            onChange={(e) => setTradeType(e.target.value)}
          >
            {config.trade_types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
            Outcome
          </label>
          <select
            className="input"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          >
            {config.outcomes.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
            Target Ratio
          </label>
          <select
            className="input"
            value={targetRatio}
            onChange={(e) => setTargetRatio(e.target.value)}
          >
            {config.target_ratios.map((r) => (
              <option key={r}>{r}</option>
            ))}
            <option value="custom">Custom...</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
            Closed Ratio
          </label>
          <input
            className="input"
            placeholder="e.g. 1:2.5"
            value={closedRatio}
            onChange={(e) => setClosedRatio(e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
            Risk Amount ($)
          </label>
          <input
            className="input"
            type="number"
            placeholder="100"
            value={riskAmount}
            onChange={(e) => setRiskAmount(e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
            Profit ($)
          </label>
          <input
            className="input"
            type="number"
            placeholder="250"
            value={profit}
            onChange={(e) => setProfit(e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
          Notes
        </label>
        <textarea
          className="input"
          rows={3}
          placeholder="Trade notes, observations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ marginTop: 6 }}
        />
      </div>

      {/* Timeframe analysis accordion */}
      <h3
        className="section-heading"
        style={{ marginTop: 24, marginBottom: 16 }}
      >
        📊 Timeframe Analysis
      </h3>

      {config.timeframes.map((tf) => (
        <div
          key={tf}
          className="card"
          style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              cursor: "pointer",
              borderBottom:
                openTf === tf ? "1px solid var(--border)" : "none",
            }}
            onClick={() => setOpenTf(openTf === tf ? "" : tf)}
          >
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              <span className="badge badge-blue" style={{ marginRight: 8 }}>
                {tf.toUpperCase()}
              </span>
              Timeframe
            </span>
            {openTf === tf ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </div>

          {openTf === tf && (
            <div style={{ padding: 20 }}>
              {/* Timeframe parameters */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                {Object.entries(config.timeframe_parameters).map(
                  ([key, param]) => (
                    <div key={key}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--text-muted)",
                        }}
                      >
                        {param.label}
                      </label>
                      <select
                        className="input"
                        style={{ width: 140 }}
                        value={tfParams[tf]?.[key] || ""}
                        onChange={(e) =>
                          setTfParams((prev) => ({
                            ...prev,
                            [tf]: { ...prev[tf], [key]: e.target.value },
                          }))
                        }
                      >
                        <option value="">—</option>
                        {param.options.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  )
                )}
              </div>

              {/* ═══ DIRECTION CONFIRMATIONS ═══ */}
              <div style={{
                padding: 16, marginBottom: 14, borderRadius: 10,
                border: `1px solid ${direction === "Buy" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                background: direction === "Buy" ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)",
              }}>
                <p style={{
                  fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10,
                  color: direction === "Buy" ? "var(--accent-green)" : "var(--accent-red)",
                }}>
                  {direction === "Buy" ? "📈" : "📉"} Direction Confirmations ({direction})
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                  Common
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {config.common_confirmations.map((c) => {
                    const active = (confirmations[tf] || []).includes(c.id);
                    const accentColor = direction === "Buy" ? "var(--accent-green)" : "var(--accent-red)";
                    const accentBg = direction === "Buy" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)";
                    return (
                      <button key={c.id} type="button" onClick={() => toggleConfirmation(tf, c.id)}
                        style={{ padding: "6px 14px", borderRadius: 8,
                          border: `1px solid ${active ? accentColor : "var(--border)"}`,
                          background: active ? accentBg : "var(--bg-secondary)",
                          color: active ? accentColor : "var(--text-secondary)",
                          cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                        }}>
                        {active ? "✓ " : ""}{c.label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                  {direction} Specific
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(direction === "Buy" ? config.buy_confirmations : config.sell_confirmations).map((c) => {
                    const active = (confirmations[tf] || []).includes(c.id);
                    const accentColor = direction === "Buy" ? "var(--accent-green)" : "var(--accent-red)";
                    const accentBg = direction === "Buy" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)";
                    return (
                      <button key={c.id} type="button" onClick={() => toggleConfirmation(tf, c.id)}
                        style={{ padding: "6px 14px", borderRadius: 8,
                          border: `1px solid ${active ? accentColor : "var(--border)"}`,
                          background: active ? accentBg : "var(--bg-secondary)",
                          color: active ? accentColor : "var(--text-secondary)",
                          cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                        }}>
                        {active ? "✓ " : ""}{c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ AGAINST DIRECTION CONFIRMATIONS ═══ */}
              <div style={{
                padding: 16, marginBottom: 18, borderRadius: 10,
                border: `1px solid ${direction === "Buy" ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                background: direction === "Buy" ? "rgba(239,68,68,0.04)" : "rgba(16,185,129,0.04)",
              }}>
                <p style={{
                  fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10,
                  color: direction === "Buy" ? "var(--accent-red)" : "var(--accent-green)",
                }}>
                  {direction === "Buy" ? "📉" : "📈"} Against Direction ({direction === "Buy" ? "Sell" : "Buy"})
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                  Common
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {config.common_confirmations.map((c) => {
                    const active = (againstConfirmations[tf] || []).includes(c.id);
                    const accentColor = direction === "Buy" ? "var(--accent-red)" : "var(--accent-green)";
                    const accentBg = direction === "Buy" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)";
                    return (
                      <button key={`ag-${c.id}`} type="button" onClick={() => toggleAgainstConfirmation(tf, c.id)}
                        style={{ padding: "6px 14px", borderRadius: 8,
                          border: `1px solid ${active ? accentColor : "var(--border)"}`,
                          background: active ? accentBg : "var(--bg-secondary)",
                          color: active ? accentColor : "var(--text-secondary)",
                          cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                        }}>
                        {active ? "✓ " : ""}{c.label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                  {direction === "Buy" ? "Sell" : "Buy"} Specific
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(direction === "Buy" ? config.sell_confirmations : config.buy_confirmations).map((c) => {
                    const active = (againstConfirmations[tf] || []).includes(c.id);
                    const accentColor = direction === "Buy" ? "var(--accent-red)" : "var(--accent-green)";
                    const accentBg = direction === "Buy" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)";
                    return (
                      <button key={`ag-${c.id}`} type="button" onClick={() => toggleAgainstConfirmation(tf, c.id)}
                        style={{ padding: "6px 14px", borderRadius: 8,
                          border: `1px solid ${active ? accentColor : "var(--border)"}`,
                          background: active ? accentBg : "var(--bg-secondary)",
                          color: active ? accentColor : "var(--text-secondary)",
                          cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                        }}>
                        {active ? "✓ " : ""}{c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phase images */}
              {config.phases.map((phase) => (
                <div key={phase} style={{ marginBottom: 16 }}>
                  <p className="section-heading" style={{ fontSize: 13 }}>
                    📸 {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
                    Screenshots
                  </p>
                  <ImageGallery
                    images={tfData[tf]?.[phase]?.images || []}
                    onAdd={(files) => addImages(tf, phase, files)}
                    onRemove={(idx) => removeImage(tf, phase, idx)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Save button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
        <button
          className="btn btn-success"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "14px 40px",
            fontSize: 16,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Save size={18} /> {saving ? "Saving..." : "Save Trade"}
        </button>
      </div>
    </div>
  );
}
