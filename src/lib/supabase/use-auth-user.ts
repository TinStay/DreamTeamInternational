"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

/**
 * The signed-in visitor, or `null` (signed out) - `undefined` until the first answer, so the header never flashes the
 * wrong buttons. Follows sign-in / sign-out through Supabase's auth events, and **re-reads the session whenever the tab
 * comes back into view**: an email sign-in link opens in a new tab (Gmail does that), where `/auth/callback` sets the
 * session cookies on the server - no auth event reaches the tab the visitor asked from, which kept showing "Log in"
 * until they signed in a second time. The cookies are shared by every tab, so a look at them on focus is enough.
 */
export function useAuthUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!supabaseConfigured) {
      // Sign-in is not set up: nobody is signed in.
      const id = window.setTimeout(() => setUser(null), 0);
      return () => window.clearTimeout(id);
    }
    const supabase = createClient();
    let alive = true;
    // Only replace the user when it is a different one (or none), so a focus does not re-render the header for nothing.
    const apply = (next: User | null) => setUser((prev) => ((prev?.id ?? null) === (next?.id ?? null) && prev !== undefined ? prev : next));

    void supabase.auth.getUser().then(({ data, error }) => {
      // A failed check (offline, a hiccup) is not a sign-out: the auth event below has the session from the cookies.
      if (alive && !error) apply(data.user ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) apply(session?.user ?? null);
    });

    const recheck = () => {
      if (document.visibilityState !== "visible") return;
      void supabase.auth.getSession().then(({ data: s }) => {
        if (alive) apply(s.session?.user ?? null);
      });
    };
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);

    return () => {
      alive = false;
      data.subscription.unsubscribe();
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  return user;
}
