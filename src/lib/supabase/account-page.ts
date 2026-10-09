import { redirect } from "next/navigation";
import { accountInfoFromUser, type AccountInfo } from "@/lib/account-info";
import { homePath, loginPath, safeNextPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import type { Language } from "@/lib/i18n/config";

/**
 * The signed-in visitor for an account page - or, when nobody is signed in, a redirect to the home page. With `next`
 * (the page's own path - a button in an email) the log-in popup opens there and brings them back to it once signed in.
 */
export async function requireAccount(lang: Language, next?: string): Promise<AccountInfo> {
  if (!supabaseConfigured) redirect(homePath(lang));
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const back = safeNextPath(next);
    redirect(back ? loginPath(lang, back) : homePath(lang));
  }
  return accountInfoFromUser(data.user);
}
