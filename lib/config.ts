import { AppConfig } from "./types";

const config: AppConfig = {
  timeframes: ["1m", "3m", "15m", "1h"],
  phases: ["before", "after"],
  trade_types: ["Counter Trend", "Trend Follow"],
  directions: ["Buy", "Sell"],
  outcomes: ["Win", "Loss", "Break Even"],
  pairs: ["BTC/USD", "XAU/USD"],
  target_ratios: ["1:1", "1:2", "1:3", "1:5", "1:10"],
  buy_confirmations: [
    { id: "s", label: "S Candle" },
    { id: "B", label: "B Signal" },
    { id: "long", label: "Long Signal" },
  ],
  sell_confirmations: [
    { id: "r", label: "Resistance" },
    { id: "S", label: "Bearish Signal" },
    { id: "short", label: "Short Setup" },
  ],
  common_confirmations: [
    { id: "rsi_div", label: "RSI Divergence" },
    { id: "delta_div", label: "Delta Divergence" },
    { id: "abs", label: "Absorption" },
    { id: "exs", label: "Exhaustion" },
    { id: "h_vol", label: "High Volume" },
    { id: "l_vol", label: "Low Volume" },
  ],
  timeframe_parameters: {
    trend: { label: "Trend", options: ["Bull", "Bear"] },
    mid_level: { label: "Mid Level", options: ["Up", "Down"] },
  },
};

export default config;
