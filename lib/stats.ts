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
