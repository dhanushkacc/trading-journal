"use client";

import { useState } from "react";
import { TradingAccount, Trade } from "@/lib/types";
import config from "@/lib/config";
import { saveAccount, updateAccount, deleteAccount } from "@/lib/api";
import {
  accountBalance,
  sumProfit,
  tradesForAccount,
  monthPnl,
  parseNum,
} from "@/lib/stats";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import TradingCalendar from "@/components/TradingCalendar";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  Wallet,
  ArrowLeft,
  Landmark,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type Mode = "list" | "form" | "detail";

interface Props {
  accounts: TradingAccount[];
  trades: Trade[];
  onRefresh: () => void;
}

function makeAccountId() {
  const d = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `acc_${d}_${uuidv4().slice(0, 4)}`;
}

function fmtMoney(n: number) {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function AccountsTab({ accounts, trades, onRefresh }: Props) {
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<TradingAccount | null>(null);
  const [viewing, setViewing] = useState<TradingAccount | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<TradingAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState(config.account_types[0]);
  const [fCustomType, setFCustomType] = useState("");
  const [fInitial, setFInitial] = useState("");
  const [saving, setSaving] = useState(false);

  const now = new Date();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  };

  const resetForm = () => {
    setFName("");
    setFType(config.account_types[0]);
    setFCustomType("");
    setFInitial("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setMode("form");
  };

  const openEdit = (a: TradingAccount) => {
    setEditing(a);
    setFName(a.name);
    if (config.account_types.includes(a.type)) {
      setFType(a.type);
      setFCustomType("");
    } else {
      setFType("Other");
      setFCustomType(a.type);
    }
    setFInitial(a.initial_balance);
    setMode("form");
  };

  const openView = (a: TradingAccount) => {
    setViewing(a);
    setMode("detail");
  };

  const handleSave = async () => {
    if (!fName.trim()) {
      alert("Please enter an account name.");
      return;
    }
    const resolvedType = fType === "Other" && fCustomType.trim() ? fCustomType.trim() : fType;
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      if (editing) {
        const updated: TradingAccount = {
          ...editing,
          name: fName.trim(),
          type: resolvedType,
          initial_balance: fInitial.trim() || "0",
          updated_at: nowIso,
        };
        await updateAccount(updated);
        showToast("✅ Account updated!");
      } else {
        const created: TradingAccount = {
          account_id: makeAccountId(),
          name: fName.trim(),
          type: resolvedType,
          initial_balance: fInitial.trim() || "0",
          created_at: nowIso,
          updated_at: nowIso,
        };
        await saveAccount(created);
        showToast("✅ Account created!");
      }
      resetForm();
      setMode("list");
      onRefresh();
    } catch (e) {
      console.error(e);
      alert("Failed to save account. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAccount(deleteTarget);
      showToast("🗑 Account deleted");
      if (viewing?.account_id === deleteTarget.account_id) setMode("list");
      onRefresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete account. Check console.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── List ──
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
          <Wallet size={22} color="var(--accent-green)" />
          Trading Accounts
        </h2>
        <button className="btn btn-success" onClick={openCreate}>
          <Plus size={16} /> New Account
        </button>
      </div>

      {accounts.length === 0 && (
        <div className="empty-state">
          <div className="es-icon">
            <Wallet size={34} />
          </div>
          <p style={{ fontSize: 15, marginBottom: 8 }}>No trading accounts yet.</p>
          <p style={{ fontSize: 13 }}>
            Click <b>&quot;+ New Account&quot;</b> to add your first account (e.g. Binance, MT5).
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
            <div key={a.account_id} className={`stat-card ${net < 0 ? "accent-red" : "accent-green"}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="sc-label">{a.name}</div>
                  <span className="badge badge-blue" style={{ marginTop: 6 }}>
                    {a.type || "—"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  <button className="icon-btn" title="View" onClick={() => openView(a)}>
                    <Eye size={16} />
                  </button>
                  <button className="icon-btn" title="Edit" onClick={() => openEdit(a)}>
                    <Pencil size={16} />
                  </button>
                  <button className="icon-btn danger" title="Delete" onClick={() => setDeleteTarget(a)}>
                    <Trash2 size={16} />
                  </button>
                </div>
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

  // ── Detail ──
  const renderDetail = () => {
    if (!viewing) return null;
    const accTrades = tradesForAccount(trades, viewing.account_id);
    const initial = parseNum(viewing.initial_balance);
    const net = sumProfit(accTrades);
    const balance = initial + net;
    const thisMonth = monthPnl(accTrades, now.getFullYear(), now.getMonth());
    const netColor =
      net > 0 ? "var(--accent-green)" : net < 0 ? "var(--accent-red)" : "var(--text-secondary)";
    const monthColor =
      thisMonth > 0 ? "var(--accent-green)" : thisMonth < 0 ? "var(--accent-red)" : "var(--text-secondary)";

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
            <button className="btn btn-ghost btn-sm" onClick={() => setMode("list")} style={{ marginBottom: 10 }}>
              <ArrowLeft size={14} /> Back to Accounts
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>{viewing.name}</h2>
            <span className="badge badge-blue" style={{ marginTop: 8 }}>
              {viewing.type || "—"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="icon-btn" title="Edit" onClick={() => openEdit(viewing)}>
              <Pencil size={18} />
            </button>
            <button className="icon-btn danger" title="Delete" onClick={() => setDeleteTarget(viewing)}>
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <Landmark size={20} className="sc-icon" color="var(--accent-blue)" />
            <div className="sc-label">Initial Balance</div>
            <div className="sc-value">${initial.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <div className={`stat-card ${net < 0 ? "accent-red" : "accent-green"}`}>
            {net < 0 ? (
              <TrendingDown size={20} className="sc-icon" color="var(--accent-red)" />
            ) : (
              <TrendingUp size={20} className="sc-icon" color="var(--accent-green)" />
            )}
            <div className="sc-label">Net P&amp;L</div>
            <div className="sc-value" style={{ color: netColor }}>{fmtMoney(net)}</div>
            <div className="sc-sub">{accTrades.length} trade(s)</div>
          </div>
          <div className="stat-card">
            <Wallet size={20} className="sc-icon" color="var(--accent-green)" />
            <div className="sc-label">Current Balance</div>
            <div className="sc-value">${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <div className={`stat-card ${thisMonth < 0 ? "accent-red" : "accent-green"}`}>
            <TrendingUp size={20} className="sc-icon" color={monthColor} />
            <div className="sc-label">This Month</div>
            <div className="sc-value" style={{ color: monthColor }}>{fmtMoney(thisMonth)}</div>
          </div>
        </div>

        {/* Calendar */}
        <TradingCalendar trades={accTrades} />
      </div>
    );
  };

  // ── Form ──
  const renderForm = () => (
    <div className="animate-in" style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>
          {editing ? "Edit Account" : "New Account"}
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

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
            Account Name *
          </label>
          <input
            className="input"
            placeholder="e.g. Binance Main, MT5 Prop #1"
            value={fName}
            onChange={(e) => setFName(e.target.value)}
            style={{ marginTop: 6 }}
          />
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
              Type
            </label>
            <select
              className="input"
              value={fType}
              onChange={(e) => setFType(e.target.value)}
              style={{ marginTop: 6 }}
            >
              {config.account_types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
              Initial Balance ($)
            </label>
            <input
              className="input"
              type="number"
              placeholder="1000"
              value={fInitial}
              onChange={(e) => setFInitial(e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>
        </div>

        {fType === "Other" && (
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>
              Custom Type
            </label>
            <input
              className="input"
              placeholder="e.g. cTrader, NinjaTrader..."
              value={fCustomType}
              onChange={(e) => setFCustomType(e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-success"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "14px 40px", fontSize: 16, opacity: saving ? 0.6 : 1 }}
        >
          <Save size={18} /> {saving ? "Saving..." : "Save Account"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {mode === "list" && renderList()}
      {mode === "detail" && renderDetail()}
      {mode === "form" && renderForm()}

      {toastMsg && <Toast key={toastKey} message={toastMsg} />}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Account"
        message={`Delete "${deleteTarget?.name}"? Its trades will remain but become unassigned. This cannot be undone.`}
        confirmText="Delete Account"
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
