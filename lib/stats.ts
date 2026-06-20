import { Trade } from "./types";

export interface TradeStats {
  total: number;
  wins: number;
  losses: number;
  breakEven: number;
  decided: number;        // wins + losses
  winRate: number;        // % over decided trades (0 when none decided)
  netPnl: number;         // sum of profit
  avgTargetRR: number;    // average of the N in "1:N" target ratios (0 when none)
}

/** Parse the right-hand side of a "1:N" ratio string into a number. */
function parseRatio(ratio: string): number | null {
  if (!ratio) return null;
  const parts = ratio.split(":");
  const n = parseFloat(parts[parts.length - 1]);
  return Number.isFinite(n) ? n : null;
}

/** Compute dashboard/summary stats from a list of trades. */
export function computeTradeStats(trades: Trade[]): TradeStats {
  let wins = 0;
  let losses = 0;
  let breakEven = 0;
  let netPnl = 0;
  let rrSum = 0;
  let rrCount = 0;

  for (const t of trades) {
    if (t.outcome === "Win") wins++;
    else if (t.outcome === "Loss") losses++;
    else if (t.outcome === "Break Even") breakEven++;

    const p = parseFloat(t.profit);
    if (Number.isFinite(p)) netPnl += p;

    const rr = parseRatio(t.target_ratio);
    if (rr !== null) {
      rrSum += rr;
      rrCount++;
    }
  }

  const decided = wins + losses;
  return {
    total: trades.length,
    wins,
    losses,
    breakEven,
    decided,
    winRate: decided > 0 ? (wins / decided) * 100 : 0,
    netPnl,
    avgTargetRR: rrCount > 0 ? rrSum / rrCount : 0,
  };
}

/** Parse a numeric-ish string into a number (0 when blank/invalid). */
export function parseNum(s: string | undefined | null): number {
  const n = parseFloat(s || "");
  return Number.isFinite(n) ? n : 0;
}

/** Sum of profit across a set of trades. */
export function sumProfit(trades: Trade[]): number {
  return trades.reduce((acc, t) => acc + parseNum(t.profit), 0);
}

/** Trades belonging to an account. */
export function tradesForAccount(trades: Trade[], accountId: string): Trade[] {
  return trades.filter((t) => (t.account_id || "") === accountId);
}

/** Current balance for an account = initial balance + net profit of its trades. */
export function accountBalance(initialBalance: string, accountTrades: Trade[]): number {
  return parseNum(initialBalance) + sumProfit(accountTrades);
}

/** Local YYYY-MM-DD key from an ISO timestamp. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return (iso || "").slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Map of YYYY-MM-DD -> net P&L for the given trades (by created_at). */
export function pnlByDay(trades: Trade[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of trades) {
    if (!t.created_at) continue;
    const k = dayKey(t.created_at);
    map[k] = (map[k] || 0) + parseNum(t.profit);
  }
  return map;
}

/** Net P&L for trades created within a given month (year, 0-based month). */
export function monthPnl(trades: Trade[], year: number, month: number): number {
  return trades.reduce((acc, t) => {
    if (!t.created_at) return acc;
    const d = new Date(t.created_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      return acc + parseNum(t.profit);
    }
    return acc;
  }, 0);
}
