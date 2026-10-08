import { redirect } from "next/navigation";
import { accountInfoFromUser, type AccountInfo } from "@/lib/account-info";
import { homePath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import type { Language } from "@/lib/i18n/config";

/** The signed-in visitor for an account page - or a redirect to the home page when nobody is signed in. */
export async function requireAccount(lang: Language): Promise<AccountInfo> {
  if (!supabaseConfigured) redirect(homePath(lang));
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(homePath(lang));
  return accountInfoFromUser(data.user);
}
