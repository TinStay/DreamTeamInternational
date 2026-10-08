import { projectFromRow, type ClientProject } from "@/lib/client-projects";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in client's projects, newest first (row level security in Supabase hands back only their own). If the
 * `projects` table does not exist yet (supabase/projects.sql not run) or the query fails, the list is simply empty.
 */
export async function getMyProjects(): Promise<ClientProject[]> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  // Only this account's own projects: a team member's account can read every client's, but Your Projects is theirs alone.
  const { data, error } = await supabase.from("projects").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false });
  if (error || !data) return [];
  // Which ones the client has rated (supabase/changes.sql) - an approved film without a rating gets a "Leave a review" CTA.
  const { data: reviews } = await supabase.from("project_reviews").select("project_id").eq("user_id", auth.user.id);
  const rated = new Set((reviews ?? []).map((r) => String(r.project_id)));
  return data.map((row) => ({ ...projectFromRow(row as Record<string, unknown>), reviewed: rated.has(String(row.id)) }));
}
