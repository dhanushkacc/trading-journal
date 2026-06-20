"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Microscope,
  TrendingUp,
  Activity,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import TradesTab from "./tabs/TradesTab";
import AccountsTab from "./tabs/AccountsTab";
import ScenariosTab from "./tabs/ScenariosTab";
import OrderFlowTab from "./tabs/OrderFlowTab";
import DumbTradesTab from "./tabs/DumbTradesTab";
import { Trade, TradingAccount } from "@/lib/types";
import { loadTrades, loadAccounts } from "@/lib/api";
import { computeTradeStats } from "@/lib/stats";

type Tab = "trades" | "accounts" | "scenarios" | "orderflow" | "dumbtrades";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("trades");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);

  const refreshTrades = useCallback(async () => {
    try {
      const data = await loadTrades();
      setTrades(data);
    } catch (err) {
      console.error("Failed to load trades", err);
    }
  }, []);

  const refreshAccounts = useCallback(async () => {
    try {
      const data = await loadAccounts();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts", err);
    }
  }, []);

  useEffect(() => {
    refreshTrades();
    refreshAccounts();
  }, [refreshTrades, refreshAccounts]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "trades", label: "Trades", icon: <BarChart3 size={16} /> },
    { id: "accounts", label: "Accounts", icon: <Wallet size={16} /> },
    { id: "scenarios", label: "Scenarios", icon: <Microscope size={16} /> },
    { id: "orderflow", label: "Order Flow", icon: <Activity size={16} /> },
    { id: "dumbtrades", label: "Dumb Trades", icon: <AlertTriangle size={16} /> },
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
        {activeTab === "trades" && (
          <TradesTab trades={trades} accounts={accounts} onRefresh={refreshTrades} />
        )}
        {activeTab === "accounts" && (
          <AccountsTab accounts={accounts} trades={trades} onRefresh={refreshAccounts} />
        )}
        {activeTab === "scenarios" && <ScenariosTab />}
        {activeTab === "orderflow" && <OrderFlowTab />}
        {activeTab === "dumbtrades" && <DumbTradesTab />}
      </main>
    </div>
  );
}
