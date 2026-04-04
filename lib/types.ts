export interface TimeframeAnalysis {
  trend?: string;
  mid_level?: string;
  confirmations?: string[];
  images?: string[];  // URLs from supabase storage
}

export interface Trade {
  id?: string;
  trade_id: string;
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
  notes: string[];
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
  target_ratios: string[];
  buy_confirmations: Confirmation[];
  sell_confirmations: Confirmation[];
  common_confirmations: Confirmation[];
  timeframe_parameters: Record<string, TimeframeParameter>;
}
