"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

/**
 * The signed-in visitor, or `null` (signed out) - `undefined` until the first answer, so the header never flashes the
 * wrong buttons. Follows sign-in / sign-out (also from another tab) through Supabase's auth events.
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
    void supabase.auth.getUser().then(({ data }) => {
      if (alive) setUser(data.user ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return user;
}
