import type { User } from "@supabase/supabase-js";

/** The team: accounts whose `app_metadata.role` is "admin" (set in the Supabase dashboard - see supabase/team.sql). */
export function isTeamUser(user: User | null | undefined): boolean {
  return (user?.app_metadata as { role?: string } | undefined)?.role === "admin";
}
