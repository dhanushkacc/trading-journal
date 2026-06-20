export interface TimeframeAnalysis {
  trend?: string;
  mid_level?: string;
  confirmations?: string[];          // direction-supporting confirmations
  against_confirmations?: string[];  // against-direction confirmations
  images?: string[];  // URLs from supabase storage
}

export interface TradingAccount {
  id?: string;
  account_id: string;
  name: string;
  type: string;            // e.g. Binance, Bybit, MT5, OKX, Other
  initial_balance: string; // stored as string, matching other numeric fields
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id?: string;
  trade_id: string;
  account_id: string;      // owning trading account (empty for legacy trades)
  pair: string;
  direction: string;
  trade_type: string;
  target_ratio: string;
  closed_ratio: string;
  risk_amount: string;
  outcome: string;
  profit: string;
  notes: string;
  analysis: Record<string, Record<string, TimeframeAnalysis>>;
  created_at: string;
  updated_at?: string;
}

export interface Scenario {
  id?: string;
  scenario_id: string;
  title: string;
  tags: string[];
  notes: string[];
  images: string[];  // URLs from supabase storage
  created_at: string;
  updated_at: string;
}

export interface OrderFlow {
  id?: string;
  order_flow_id: string;
  title: string;
  tags: string[];
  notes: string[];   // each item is rich-text HTML for one bullet point
  images: string[];  // URLs from supabase storage
  created_at: string;
  updated_at: string;
}

export interface DumbTrade {
  id?: string;
  dumb_trade_id: string;
  title: string;
  tags: string[];
  notes: string[];   // each item is rich-text HTML for one bullet point
  images: string[];  // URLs from supabase storage
  created_at: string;
  updated_at: string;
}

// Config types
export interface Confirmation {
  id: string;
  label: string;
}

export interface TimeframeParameter {
  label: string;
  options: string[];
}

export interface AppConfig {
  timeframes: string[];
  phases: string[];
  trade_types: string[];
  directions: string[];
  outcomes: string[];
  pairs: string[];
  account_types: string[];
  target_ratios: string[];
  buy_confirmations: Confirmation[];
  sell_confirmations: Confirmation[];
  common_confirmations: Confirmation[];
  timeframe_parameters: Record<string, TimeframeParameter>;
}
