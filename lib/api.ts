import { supabase } from "./supabase";
import { Trade, Scenario, OrderFlow, DumbTrade, TradingAccount } from "./types";
import { v4 as uuidv4 } from "uuid";

// ─── Image Compression ────────────────────────────────────────────────────
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;
const QUALITY = 0.75; // WebP quality (0-1)

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than max dimensions
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/webp",
        QUALITY
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ─── Image Upload ─────────────────────────────────────────────────────────
export async function uploadImage(
  file: File,
  bucket: string = "screenshots"
): Promise<string> {
  // Compress before uploading
  const compressed = await compressImage(file);
  const filename = `${Date.now()}_${uuidv4().slice(0, 6)}.webp`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, compressed, {
      upsert: false,
      contentType: "image/webp",
    });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filename);
  return publicUrl;
}

export async function deleteImage(url: string, bucket: string = "screenshots") {
  const parts = url.split(`/storage/v1/object/public/${bucket}/`);
  if (parts.length < 2) return;
  const filename = parts[1];
  await supabase.storage.from(bucket).remove([filename]);
}

// ─── Trade CRUD ───────────────────────────────────────────────────────────
export async function loadTrades(): Promise<Trade[]> {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Trade[];
}

export async function saveTrade(trade: Trade): Promise<void> {
  const { error } = await supabase.from("trades").insert(trade);
  if (error) throw error;
}

export async function updateTrade(trade: Trade): Promise<void> {
  const { error } = await supabase
    .from("trades")
    .update(trade)
    .eq("trade_id", trade.trade_id);
  if (error) throw error;
}

export async function deleteTrade(trade: Trade): Promise<void> {
  // Delete associated images from storage
  if (trade.analysis) {
    for (const tf of Object.values(trade.analysis)) {
      for (const phase of Object.values(tf)) {
        for (const url of phase.images || []) {
          await deleteImage(url);
        }
      }
    }
  }
  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("trade_id", trade.trade_id);
  if (error) throw error;
}

// ─── Trading Account CRUD ─────────────────────────────────────────────────
export async function loadAccounts(): Promise<TradingAccount[]> {
  const { data, error } = await supabase
    .from("trading_accounts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as TradingAccount[];
}

export async function saveAccount(account: TradingAccount): Promise<void> {
  const { error } = await supabase.from("trading_accounts").insert(account);
  if (error) throw error;
}

export async function updateAccount(account: TradingAccount): Promise<void> {
  const { error } = await supabase
    .from("trading_accounts")
    .update(account)
    .eq("account_id", account.account_id);
  if (error) throw error;
}

export async function deleteAccount(account: TradingAccount): Promise<void> {
  // Trades keep their account_id and become unassigned; the account row is removed.
  const { error } = await supabase
    .from("trading_accounts")
    .delete()
    .eq("account_id", account.account_id);
  if (error) throw error;
}

// ─── Scenario CRUD ────────────────────────────────────────────────────────
export async function loadScenarios(): Promise<Scenario[]> {
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Scenario[];
}

export async function saveScenario(scenario: Scenario): Promise<void> {
  const { error } = await supabase.from("scenarios").insert(scenario);
  if (error) throw error;
}

export async function updateScenario(scenario: Scenario): Promise<void> {
  const { error } = await supabase
    .from("scenarios")
    .update(scenario)
    .eq("scenario_id", scenario.scenario_id);
  if (error) throw error;
}

export async function deleteScenario(scenario: Scenario): Promise<void> {
  // Delete images from storage
  for (const url of scenario.images || []) {
    await deleteImage(url);
  }
  const { error } = await supabase
    .from("scenarios")
    .delete()
    .eq("scenario_id", scenario.scenario_id);
  if (error) throw error;
}

// ─── Order Flow CRUD ──────────────────────────────────────────────────────
export async function loadOrderFlows(): Promise<OrderFlow[]> {
  const { data, error } = await supabase
    .from("order_flows")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as OrderFlow[];
}

export async function saveOrderFlow(orderFlow: OrderFlow): Promise<void> {
  const { error } = await supabase.from("order_flows").insert(orderFlow);
  if (error) throw error;
}

export async function updateOrderFlow(orderFlow: OrderFlow): Promise<void> {
  const { error } = await supabase
    .from("order_flows")
    .update(orderFlow)
    .eq("order_flow_id", orderFlow.order_flow_id);
  if (error) throw error;
}

export async function deleteOrderFlow(orderFlow: OrderFlow): Promise<void> {
  // Delete images from storage
  for (const url of orderFlow.images || []) {
    await deleteImage(url);
  }
  const { error } = await supabase
    .from("order_flows")
    .delete()
    .eq("order_flow_id", orderFlow.order_flow_id);
  if (error) throw error;
}

// ─── Dumb Trade CRUD ──────────────────────────────────────────────────────
export async function loadDumbTrades(): Promise<DumbTrade[]> {
  const { data, error } = await supabase
    .from("dumb_trades")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as DumbTrade[];
}

export async function saveDumbTrade(dumbTrade: DumbTrade): Promise<void> {
  const { error } = await supabase.from("dumb_trades").insert(dumbTrade);
  if (error) throw error;
}

export async function updateDumbTrade(dumbTrade: DumbTrade): Promise<void> {
  const { error } = await supabase
    .from("dumb_trades")
    .update(dumbTrade)
    .eq("dumb_trade_id", dumbTrade.dumb_trade_id);
  if (error) throw error;
}

export async function deleteDumbTrade(dumbTrade: DumbTrade): Promise<void> {
  // Delete images from storage
  for (const url of dumbTrade.images || []) {
    await deleteImage(url);
  }
  const { error } = await supabase
    .from("dumb_trades")
    .delete()
    .eq("dumb_trade_id", dumbTrade.dumb_trade_id);
  if (error) throw error;
}
