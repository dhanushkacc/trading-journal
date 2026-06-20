"use client";

import { useState } from "react";
import { Trade } from "@/lib/types";
import AllTradesTab from "./AllTradesTab";
import TradeDetailTab from "./TradeDetailTab";
import TradeFormTab from "./TradeFormTab";
import Toast from "@/components/Toast";

type Mode = "list" | "detail" | "form";

interface Props {
  trades: Trade[];
  onRefresh: () => void;
}

/**
 * Combined Trades section — list / detail / form in a single tab,
 * mirroring the Scenarios and Order Flow CRUD pattern.
 */
export default function TradesTab({ trades, onRefresh }: Props) {
  const [mode, setMode] = useState<Mode>("list");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastKey, setToastKey] = useState(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
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

  return (
    <div>
      {mode === "list" && (
        <AllTradesTab
          trades={trades}
          onViewTrade={handleViewTrade}
          onNewTrade={handleNewTrade}
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
          onSaved={handleSaved}
          onCancel={() => setMode("list")}
        />
      )}

      {toastMsg && <Toast key={toastKey} message={toastMsg} />}
    </div>
  );
}
