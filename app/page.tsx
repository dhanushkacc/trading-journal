"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  List,
  PlusCircle,
  Eye,
  Microscope,
  TrendingUp,
} from "lucide-react";
import Toast from "@/components/Toast";
import AllTradesTab from "./tabs/AllTradesTab";
import TradeDetailTab from "./tabs/TradeDetailTab";
import TradeFormTab from "./tabs/TradeFormTab";
import ScenariosTab from "./tabs/ScenariosTab";
import { Trade } from "@/lib/types";
import { loadTrades } from "@/lib/api";

type Tab = "all" | "detail" | "form" | "scenarios";

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
  ];

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

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-success" onClick={handleNewTrade}>
            <PlusCircle size={16} /> New Trade
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 16px",
              background: "var(--bg-card)",
              borderRadius: 10,
              border: "1px solid var(--border)",
            }}
          >
            <BarChart3 size={16} color="var(--accent-green)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {trades.length} Trades
            </span>
          </div>
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
      </main>

      {toastMsg && <Toast key={toastKey} message={toastMsg} />}
    </div>
  );
}
