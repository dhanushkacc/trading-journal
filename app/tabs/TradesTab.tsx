"use client";

import { useState } from "react";
import { Trade, TradingAccount } from "@/lib/types";
import AllTradesTab from "./AllTradesTab";
import TradeDetailTab from "./TradeDetailTab";
import TradeFormTab from "./TradeFormTab";
import Toast from "@/components/Toast";
import {
  accountBalance,
  sumProfit,
  tradesForAccount,
  monthPnl,
} from "@/lib/stats";
import { Wallet, ChevronRight } from "lucide-react";

type Mode = "list" | "detail" | "form";

interface Props {
  trades: Trade[];
  accounts: TradingAccount[];
  onRefresh: () => void;
}

function fmtMoney(n: number) {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/**
 * Trades section — account-first. Pick a trading account, then journal /
 * view its trades (list → detail → form), mirroring the Scenarios pattern.
 */
export default function TradesTab({ trades, accounts, onRefresh }: Props) {
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [mode, setMode] = useState<Mode>("list");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const now = new Date();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  };

  const enterAccount = (a: TradingAccount) => {
    setSelectedAccount(a);
    setMode("list");
    setSelectedTrade(null);
    setEditingTrade(null);
  };

  const backToAccounts = () => {
    setSelectedAccount(null);
    setMode("list");
  };

  const handleViewTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setMode("detail");
  };
  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setMode("form");
  };
  const handleNewTrade = () => {
    setEditingTrade(null);
    setMode("form");
  };
  const handleSaved = () => {
    onRefresh();
    showToast("✅ Trade saved successfully!");
    setEditingTrade(null);
    setMode("list");
  };
  const handleDeleted = () => {
    onRefresh();
    showToast("🗑 Trade deleted");
    setSelectedTrade(null);
    setMode("list");
  };

  // ── Account picker (landing) ──
  if (!selectedAccount) {
    return (
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
            <Wallet size={22} color="var(--accent-green)" />
            Select an Account
          </h2>
        </div>

        {accounts.length === 0 && (
          <div className="empty-state">
            <div className="es-icon">
              <Wallet size={34} />
            </div>
            <p style={{ fontSize: 15, marginBottom: 8 }}>No trading accounts yet.</p>
            <p style={{ fontSize: 13 }}>
              Add one in the <b>Accounts</b> tab first, then journal trades under it.
            </p>
          </div>
        )}

        <div className="stat-grid stagger" style={{ marginBottom: 0 }}>
          {accounts.map((a) => {
            const accTrades = tradesForAccount(trades, a.account_id);
            const balance = accountBalance(a.initial_balance, accTrades);
            const net = sumProfit(accTrades);
            const thisMonth = monthPnl(accTrades, now.getFullYear(), now.getMonth());
            const netColor =
              net > 0 ? "var(--accent-green)" : net < 0 ? "var(--accent-red)" : "var(--text-secondary)";
            return (
              <div
                key={a.account_id}
                className={`stat-card ${net < 0 ? "accent-red" : "accent-green"}`}
                style={{ cursor: "pointer" }}
                onClick={() => enterAccount(a)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="sc-label">{a.name}</div>
                    <span className="badge badge-blue" style={{ marginTop: 6 }}>
                      {a.type || "—"}
                    </span>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
                <div className="sc-value" style={{ fontSize: 24, marginTop: 14 }}>
                  ${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="sc-sub" style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <span style={{ color: netColor, fontWeight: 600 }}>Net {fmtMoney(net)}</span>
                  <span>This month {fmtMoney(thisMonth)}</span>
                  <span>{accTrades.length} trade(s)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Inside an account ──
  const accountTrades = tradesForAccount(trades, selectedAccount.account_id);

  return (
    <div>
      {mode === "list" && (
        <AllTradesTab
          trades={accountTrades}
          accountName={selectedAccount.name}
          accountType={selectedAccount.type}
          onViewTrade={handleViewTrade}
          onNewTrade={handleNewTrade}
          onBack={backToAccounts}
          onRefresh={onRefresh}
        />
      )}
      {mode === "detail" && (
        <TradeDetailTab
          trade={selectedTrade}
          onEdit={handleEditTrade}
          onDelete={handleDeleted}
          onBack={() => setMode("list")}
        />
      )}
      {mode === "form" && (
        <TradeFormTab
          editingTrade={editingTrade}
          accounts={accounts}
          defaultAccountId={selectedAccount.account_id}
          onSaved={handleSaved}
          onCancel={() => setMode("list")}
        />
      )}

      {toastMsg && <Toast key={toastKey} message={toastMsg} />}
    </div>
  );
}
