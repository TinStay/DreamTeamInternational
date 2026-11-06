import { createClient } from "@supabase/supabase-js";
import type { PortfolioItem } from "@/lib/portfolio-grid";
import { itemFromRow, seedItems } from "@/lib/portfolio-videos";
import { supabaseConfigured } from "@/lib/supabase/config";

/**
 * The portfolio as the team arranged it (`portfolio_videos`, public to read). No session and no cookies here, so the page
 * stays static between refreshes. The list in the code stands in while the table cannot be read - a free Supabase project
 * pauses when idle, and the portfolio must not go blank with it.
 */
export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  if (!supabaseConfigured) return seedItems();
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("portfolio_videos")
      .select("source, video_id, categories, orientation")
      .order("position")
      .abortSignal(AbortSignal.timeout(8000));
    if (error || !data) return seedItems();
    return data.flatMap((row) => itemFromRow(row) ?? []);
  } catch {
    return seedItems();
  }
}
