import { supabase } from "./supabase";
import { Trade, Scenario } from "./types";
import { v4 as uuidv4 } from "uuid";

// ─── Image Upload ─────────────────────────────────────────────────────────
export async function uploadImage(
  file: File,
  bucket: string = "screenshots"
): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const filename = `${Date.now()}_${uuidv4().slice(0, 6)}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { upsert: false });
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
