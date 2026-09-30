"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { IconArrowRight, IconCheck, IconLoader2, IconMail, IconMailCheck, IconX } from "@tabler/icons-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { AUTH_EVENT, type AuthMode } from "@/lib/signup-dialog";
import { bunny, bunnyMp4Url, bunnyThumbnailUrl } from "@/lib/bunny-stream";
import { accountPath, privacyPath, termsPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";
import { MODAL_BACKDROP_Z, MODAL_CONTENT_Z, MODAL_CONTROL_Z } from "@/lib/modal-layer";
import { cn } from "@/lib/utils";

/** The launch film on Bunny Stream, played in the popup's window at the top. */
const LAUNCH_FILM = bunny("a9efb9af-1512-48f5-a446-2067567e02d7");

const PEARL_INK =
  "bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent";

type Provider = "google" | "microsoft" | "email";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
      <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
      <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
      <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
    </svg>
  );
}

const LINK = "text-white underline decoration-white/30 underline-offset-2 transition-colors hover:text-[#ff8a1f] hover:decoration-[#ff8a1f]";

/**
 * The sign-up / log-in popup, opened by the header's Sign up and Log in (`openSignup()` / `openLogin()`): one dark
 * window on the site's ground with the launch film across its top (16:9, uncropped, muted and looping, loaded only while
 * the popup is open) and the way in beneath it - Google, Microsoft, or an email. Sign-up also carries the consent
 * line (Terms of Use, Privacy Policy, 18+) that has to be ticked first; a line at the foot swaps between the two modes
 * in place. It signs in for real through Supabase (`choose()`): Google and Microsoft need to be switched on in the
 * Supabase dashboard (Authentication > Providers), email works out of the box.
 */
export function AuthDialog() {
  const { t, language } = useLanguage();
  const s = t.signup;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState("");
  // idle -> busy (a request is out) -> sent (the email link is on its way) / error.
  const [status, setStatus] = useState<{ kind: "idle" } | { kind: "busy"; provider: Provider } | { kind: "sent"; email: string } | { kind: "error"; message: string }>({ kind: "idle" });
  const [showConsentHint, setShowConsentHint] = useState(false);
  const [filmFailed, setFilmFailed] = useState(false);
  const filmReady = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const signup = mode === "signup";
  const copy = signup ? s.signupCopy : s.loginCopy;

  useEffect(() => {
    const onOpen = (e: Event) => {
      setMode((e as CustomEvent<AuthMode>).detail === "login" ? "login" : "signup");
      setOpen(true);
    };
    window.addEventListener(AUTH_EVENT, onOpen);
    return () => window.removeEventListener(AUTH_EVENT, onOpen);
  }, []);

  // The film plays while the popup is open. If it has not started within a few seconds (Bunny still encoding it, or
  // offline) the branded stand-in takes its place; each opening tries the film again.
  useEffect(() => {
    const video = videoRef.current;
    if (!open) {
      video?.pause();
      filmReady.current = false;
      const reset = window.setTimeout(() => setFilmFailed(false), 300);
      return () => window.clearTimeout(reset);
    }
    void video?.play().catch(() => {});
    const giveUp = window.setTimeout(() => {
      if (!filmReady.current) setFilmFailed(true);
    }, 4000);
    return () => window.clearTimeout(giveUp);
  }, [open]);

  // The real thing, through Supabase: Google / Microsoft (its `azure` provider) send the browser to the provider
  // and back to /auth/callback; email sends a one-time sign-in link (creating the account first time only on sign-up).
  const choose = async (provider: Provider) => {
    if (signup && !agreed) {
      setShowConsentHint(true);
      return;
    }
    if (status.kind === "busy") return;
    if (!supabaseConfigured) {
      setStatus({ kind: "error", message: s.notReady });
      return;
    }
    setStatus({ kind: "busy", provider });
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(accountPath(language))}`;

    if (provider === "email") {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: signup,
          data: signup ? { terms_accepted_at: new Date().toISOString(), age_confirmed: true } : undefined,
        },
      });
      if (error) {
        const noAccount = !signup && /signups not allowed|not found/i.test(error.message);
        setStatus({ kind: "error", message: noAccount ? s.noAccount : error.message || s.errorGeneric });
      } else {
        setStatus({ kind: "sent", email: email.trim() });
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider === "microsoft" ? "azure" : provider,
      options: { redirectTo, scopes: provider === "microsoft" ? "email" : undefined, skipBrowserRedirect: true },
    });
    if (error || !data.url) {
      setStatus({ kind: "error", message: error?.message || s.errorGeneric });
      return;
    }
    // Ask first: a provider that is not switched on in Supabase answers 400 with JSON, which would otherwise be the
    // page the visitor lands on. Any other answer (a redirect) - or a browser that will not let us look - just goes on.
    try {
      const probe = await fetch(data.url, { redirect: "manual" });
      if (probe.status === 400) {
        setStatus({ kind: "error", message: s.providerOff.replace("{provider}", s[provider]) });
        return;
      }
    } catch {
      // Cross-origin refusal: navigate anyway.
    }
    window.location.assign(data.url);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void choose("email");
  };

  const switchMode = () => {
    setMode(signup ? "login" : "signup");
    setStatus({ kind: "idle" });
    setShowConsentHint(false);
  };

  const providerBtn =
    "group flex h-12 min-w-0 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.04] px-3 text-sm font-semibold text-white transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#ff7a1a]/55 hover:bg-white/[0.08] hover:shadow-[0_10px_28px_-14px_rgba(255,106,20,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8a1f]";

  const providers: { key: Provider; label: string; icon: ReactNode }[] = [
    { key: "google", label: s.google, icon: <GoogleMark /> },
    { key: "microsoft", label: s.microsoft, icon: <MicrosoftMark /> },
  ];

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setStatus({ kind: "idle" });
          setShowConsentHint(false);
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 isolate bg-black/70 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            MODAL_BACKDROP_Z
          )}
        />
        <DialogPrimitive.Popup
          data-lenis-prevent
          className={cn(
            "fixed inset-0 m-auto h-fit max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[34rem] overflow-x-hidden overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[linear-gradient(160deg,#1b1c21_0%,#101114_70%)] text-white shadow-[0_50px_120px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.03)] outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            MODAL_CONTENT_Z
          )}
        >
          <DialogPrimitive.Close
            aria-label={s.close}
            className={cn(
              "absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-white/85 backdrop-blur-md transition-[transform,background-color,color] duration-200 ease-out hover:scale-105 hover:bg-black/80 hover:text-white",
              MODAL_CONTROL_Z
            )}
          >
            <IconX className="size-4" aria-hidden />
          </DialogPrimitive.Close>

          {/* The window: the launch film across the top, in its own 16:9 (nothing cropped), so it reads clearly. */}
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {filmFailed ? (
              // The film is not there yet (Bunny is still encoding it, or offline): a branded stand-in, not a blank box.
              <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(90%_90%_at_50%_100%,rgba(255,110,20,0.28),transparent_65%),#0d0e10]">
                <p className="font-heading text-2xl font-black uppercase">
                  {s.filmTitle1} <span className={PEARL_INK}>{s.filmTitle2}</span>
                </p>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={open ? bunnyMp4Url(LAUNCH_FILM, 720) : undefined}
                poster={bunnyThumbnailUrl(LAUNCH_FILM)}
                muted
                loop
                playsInline
                // The popup's content mounts a beat after `open` flips, so an effect cannot start the film: `autoPlay`
                // does, from the moment the element exists (its `src` is only set while the popup is open).
                autoPlay
                preload="auto"
                onLoadedData={(e) => {
                  filmReady.current = true;
                  void e.currentTarget.play().catch(() => {});
                }}
                onError={() => setFilmFailed(true)}
                className="absolute inset-0 size-full object-cover"
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(16,17,20,0.9),transparent)]" />
            <p className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-[#ff8a1f] shadow-[0_0_10px_#ff8a1f]" aria-hidden />
              {s.tag}
            </p>
            {/* The pearl hairline where the film meets the panel. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,#ff8a1f_25%,#ffd2a1_50%,#ff8a1f_75%,transparent)]"
            />
          </div>

          {/* The way in, beneath it. */}
          <div className="relative p-6 pt-5 sm:px-8 sm:pb-7">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.12),transparent_65%)]"
            />
            <DialogPrimitive.Title className="relative font-heading text-[clamp(22px,2.2vw,28px)] leading-[1.05] font-black uppercase">
              {copy.title1} <span className={PEARL_INK}>{copy.title2}</span>
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="relative mt-2 text-sm leading-relaxed text-white/60">
              {copy.subtitle}
            </DialogPrimitive.Description>

            <div className="relative mt-5 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
              {providers.map(({ key, label, icon }) => (
                <button key={key} type="button" onClick={() => void choose(key)} disabled={status.kind === "busy"} className={cn(providerBtn, "disabled:cursor-wait disabled:opacity-60")} aria-label={copy[key]}>
                  {status.kind === "busy" && status.provider === key ? <IconLoader2 className="size-5 animate-spin" aria-hidden /> : icon}
                  {label}
                </button>
              ))}
            </div>

            <div className="relative my-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
              <span className="h-px flex-1 bg-white/10" />
              {s.or}
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={onSubmit} className="relative flex flex-col gap-2.5">
              <label className="sr-only" htmlFor="auth-email">
                {s.emailLabel}
              </label>
              <div className="relative">
                <IconMail className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-white/40" aria-hidden />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={s.emailPlaceholder}
                  className="h-12 w-full rounded-xl border border-white/12 bg-black/30 pr-4 pl-11 text-[15px] text-white transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-white/35 focus:border-[#ff8a1f]/70 focus:shadow-[0_0_0_3px_rgba(255,138,31,0.15)]"
                />
              </div>
              <button
                type="submit"
                disabled={status.kind === "busy"}
                className="group inline-flex h-12 disabled:cursor-wait disabled:opacity-70 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_45%,#ffb066_100%)] px-4 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {copy.email}
                {status.kind === "busy" && status.provider === "email" ? (
                  <IconLoader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1" aria-hidden />
                )}
              </button>
            </form>

            {/* Sign-up only: the consent, ticked first, or no choice goes through. */}
            {signup ? (
              <>
                <label className="relative mt-4 flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-white/60">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (e.target.checked) setShowConsentHint(false);
                    }}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-white/25 bg-black/30 text-transparent transition-[background-color,border-color,color] duration-200 peer-checked:border-transparent peer-checked:bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#ff8a1f]"
                  >
                    <IconCheck className="size-3.5" stroke={3} />
                  </span>
                  <span>
                    {s.consent1}{" "}
                    <Link href={termsPath(language)} target="_blank" className={LINK}>
                      {s.terms}
                    </Link>
                    {s.consent2}{" "}
                    <Link href={privacyPath(language)} target="_blank" className={LINK}>
                      {s.privacy}
                    </Link>
                    {s.consent3}
                  </span>
                </label>
                {showConsentHint && !agreed ? (
                  <p role="alert" className="relative mt-2 text-[13px] font-medium text-[#ff9a3c]">
                    {s.consentHint}
                  </p>
                ) : null}
              </>
            ) : null}

            {status.kind === "sent" ? (
              <div role="status" className="relative mt-4 flex items-start gap-3 rounded-xl border border-[#ff7a1a]/35 bg-[#ff7a1a]/[0.08] p-4 text-sm leading-relaxed text-white/85">
                <IconMailCheck className="mt-0.5 size-5 shrink-0 text-[#ffb066]" aria-hidden />
                <span>
                  <span className="font-semibold text-white">{s.sentTitle}</span> {s.sentBefore} <span className="font-semibold text-white">{status.email}</span>
                  {s.sentAfter}
                </span>
              </div>
            ) : null}

            {status.kind === "error" ? (
              <p role="alert" className="relative mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm leading-relaxed text-red-200">
                {status.message}
              </p>
            ) : null}

            <p className="relative mt-5 text-center text-sm text-white/55">
              {copy.switchLead}{" "}
              <button type="button" onClick={switchMode} className="cursor-pointer font-semibold text-[#ffb066] transition-colors hover:text-white">
                {copy.switchAction}
              </button>
            </p>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
