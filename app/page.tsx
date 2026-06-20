"use client";

import { useState, useEffect, useCallback } from "react";
import {
  List,
  PlusCircle,
  Eye,
  Microscope,
  TrendingUp,
  Activity,
} from "lucide-react";
import Toast from "@/components/Toast";
import AllTradesTab from "./tabs/AllTradesTab";
import TradeDetailTab from "./tabs/TradeDetailTab";
import TradeFormTab from "./tabs/TradeFormTab";
import ScenariosTab from "./tabs/ScenariosTab";
import OrderFlowTab from "./tabs/OrderFlowTab";
import { Trade } from "@/lib/types";
import { loadTrades } from "@/lib/api";
import { computeTradeStats } from "@/lib/stats";

type Tab = "all" | "detail" | "form" | "scenarios" | "orderflow";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const refreshTrades = useCallback(async () => {
    try {
      const data = await loadTrades();
      setTrades(data);
    } catch (err) {
      console.error("Failed to load trades", err);
    }
  }, []);

  useEffect(() => {
    refreshTrades();
  }, [refreshTrades]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  };

  const handleViewTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setActiveTab("detail");
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setActiveTab("form");
  };

  const handleNewTrade = () => {
    setEditingTrade(null);
    setActiveTab("form");
  };

  const handleSaved = () => {
    refreshTrades();
    showToast("✅ Trade saved successfully!");
    setActiveTab("all");
    setEditingTrade(null);
  };

  const handleDeleted = () => {
    refreshTrades();
    showToast("🗑 Trade deleted");
    setActiveTab("all");
    setSelectedTrade(null);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All Trades", icon: <List size={16} /> },
    { id: "detail", label: "Trade Details", icon: <Eye size={16} /> },
    { id: "form", label: "New / Edit Trade", icon: <PlusCircle size={16} /> },
    { id: "scenarios", label: "Scenarios", icon: <Microscope size={16} /> },
    { id: "orderflow", label: "Order Flow", icon: <Activity size={16} /> },
  ];

  const stats = computeTradeStats(trades);
  const pnlColor =
    stats.netPnl > 0
      ? "var(--accent-green)"
      : stats.netPnl < 0
      ? "var(--accent-red)"
      : "var(--text-primary)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ─── Header ─────────────────────────────────── */}
      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Trading Journal</h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Track · Analyze · Improve
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="summary-pill">
            <span className="sp-label">Trades</span>
            <span className="sp-value">{stats.total}</span>
          </div>
          <div className="summary-pill">
            <span className="sp-label">Win Rate</span>
            <span className="sp-value" style={{ color: "var(--accent-blue)" }}>
              {stats.winRate.toFixed(0)}%
            </span>
          </div>
          <div className="summary-pill">
            <span className="sp-label">Net P&amp;L</span>
            <span className="sp-value" style={{ color: pnlColor }}>
              {stats.netPnl >= 0 ? "+" : "-"}${Math.abs(stats.netPnl).toLocaleString()}
            </span>
          </div>
          <button className="btn btn-success" onClick={handleNewTrade}>
            <PlusCircle size={16} /> New Trade
          </button>
        </div>
      </header>

      {/* ─── Tab Bar ────────────────────────────────── */}
      <div style={{ padding: "16px 28px 0" }}>
        <div className="tab-bar" style={{ display: "inline-flex" }}>
          {tabs.map((t) => (
            <div
              key={t.id}
              className={`tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {t.icon} {t.label}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Content ────────────────────────────────── */}
      <main style={{ flex: 1, padding: "20px 28px 28px", overflow: "auto" }}>
        {activeTab === "all" && (
          <AllTradesTab
            trades={trades}
            onViewTrade={handleViewTrade}
            onRefresh={refreshTrades}
          />
        )}
        {activeTab === "detail" && (
          <TradeDetailTab
            trade={selectedTrade}
            onEdit={handleEditTrade}
            onDelete={handleDeleted}
          />
        )}
        {activeTab === "form" && (
          <TradeFormTab
            editingTrade={editingTrade}
            onSaved={handleSaved}
            onCancel={() => setActiveTab("all")}
          />
        )}
        {activeTab === "scenarios" && <ScenariosTab />}
        {activeTab === "orderflow" && <OrderFlowTab />}
      </main>

      {toastMsg && <Toast key={toastKey} message={toastMsg} />}
    </div>
  );
}
