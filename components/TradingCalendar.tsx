"use client";

import { useState, useMemo } from "react";
import { Trade } from "@/lib/types";
import { pnlByDay, monthPnl } from "@/lib/stats";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface Props {
  trades: Trade[]; // already filtered to the relevant account
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtMoney(n: number) {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function TradingCalendar({ trades }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const dayMap = useMemo(() => pnlByDay(trades), [trades]);
  const monthTotal = useMemo(() => monthPnl(trades, year, month), [trades, year, month]);

  const tradeCountByDay = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of trades) {
      if (!t.created_at) continue;
      const k = t.created_at.slice(0, 10);
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }, [trades]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthColor =
    monthTotal > 0 ? "var(--accent-green)" : monthTotal < 0 ? "var(--accent-red)" : "var(--text-secondary)";

  return (
    <div className="card">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h3 className="section-heading" style={{ marginBottom: 0 }}>
          <CalendarDays size={16} /> {MONTHS[month]} {year}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: monthColor,
              padding: "4px 12px",
              borderRadius: 10,
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
            }}
          >
            Month P&amp;L: {fmtMoney(monthTotal)}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>
            Today
          </button>
          <button className="icon-btn" onClick={prevMonth} title="Previous month">
            <ChevronLeft size={18} />
          </button>
          <button className="icon-btn" onClick={nextMonth} title="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="cal-grid" style={{ marginBottom: 6 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} className="cal-cell cal-empty" />;
          const key = `${year}-${pad(month + 1)}-${pad(d)}`;
          const pnl = dayMap[key];
          const count = tradeCountByDay[key];
          const has = pnl !== undefined;
          const positive = (pnl || 0) > 0;
          const negative = (pnl || 0) < 0;
          return (
            <div
              key={key}
              className={`cal-cell ${has ? (positive ? "cal-win" : negative ? "cal-loss" : "cal-flat") : ""} ${
                key === todayKey ? "cal-today" : ""
              }`}
            >
              <span className="cal-daynum">{d}</span>
              {has && (
                <>
                  <span className="cal-pnl">{fmtMoney(pnl)}</span>
                  {count > 0 && <span className="cal-count">{count} trade{count > 1 ? "s" : ""}</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
