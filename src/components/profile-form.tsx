"use client";

import { useState } from "react";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { ACCOUNT_CARD } from "@/components/account-shell";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";
import { profilePatch, type ProfileFields } from "@/lib/clients";
import { createClient } from "@/lib/supabase/client";

/**
 * The client's own details on `/profile` - name, company, phone, country - saved to their `profiles` row (row level
 * security lets them update only these columns of their own row; the team sees the same fields in its Clients tab).
 */
export function ProfileForm({ initial }: { initial: ProfileFields }) {
  const { t } = useLanguage();
  const f = t.account.profileForm;
  const [saved, setSaved] = useState(initial);
  const [fields, setFields] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = (Object.keys(fields) as (keyof ProfileFields)[]).some((k) => fields[k].trim() !== saved[k]);

  async function save() {
    if (!dirty || busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { error: updateError } = auth.user ? await supabase.from("profiles").update(profilePatch(fields)).eq("id", auth.user.id) : { error: new Error("not_signed_in") };
    setBusy(false);
    if (updateError) {
      setError(f.error);
      return;
    }
    const trimmed = { fullName: fields.fullName.trim(), company: fields.company.trim(), phone: fields.phone.trim(), country: fields.country.trim() };
    setSaved(trimmed);
    setFields(trimmed);
    setDone(true);
    window.setTimeout(() => setDone(false), 2500);
  }

  const rows: { key: keyof ProfileFields; label: string; type?: string; auto?: string }[] = [
    { key: "fullName", label: f.name, auto: "name" },
    { key: "company", label: f.company, auto: "organization" },
    { key: "phone", label: f.phone, type: "tel", auto: "tel" },
    { key: "country", label: f.country, auto: "country-name" },
  ];

  return (
    <section className={`${ACCOUNT_CARD} mt-6 p-6`}>
      <h2 className="font-heading text-base font-black uppercase tracking-wide text-white/90">{f.title}</h2>
      <p className="mt-1.5 text-sm text-white/55">{f.hint}</p>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {rows.map((r) => (
          <div key={r.key}>
            <label htmlFor={`profile-${r.key}`} className="mb-1.5 block text-sm font-semibold text-white/75">
              {r.label}
            </label>
            <Input
              id={`profile-${r.key}`}
              type={r.type ?? "text"}
              autoComplete={r.auto}
              maxLength={200}
              value={fields[r.key]}
              onChange={(e) => setFields((v) => ({ ...v, [r.key]: e.target.value }))}
              className="h-11 border-white/12 bg-black/30"
            />
          </div>
        ))}
        <div className="flex items-center gap-4 sm:col-span-2">
          <button
            type="submit"
            disabled={!dirty || busy}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-6 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {busy ? <IconLoader2 className="size-4 animate-spin" aria-hidden /> : null}
            {f.save}
          </button>
          {done ? (
            <span role="status" className="flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
              <IconCheck className="size-4" stroke={3} aria-hidden />
              {f.saved}
            </span>
          ) : null}
          {error ? (
            <span role="alert" className="text-sm text-[#ffb066]">
              {error}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}
