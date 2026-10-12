"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { IconAward, IconCheck, IconMail, IconRepeat, IconTrendingUp, IconUsersGroup } from "@tabler/icons-react";
import { AccountShell, ACCOUNT_CARD } from "@/components/account-shell";
import { useLanguage } from "@/lib/i18n/language-context";
import { emailHref } from "@/lib/contact-info";

const EASE = [0.22, 1, 0.36, 1] as const;

const PEARL = "linear-gradient(115deg,#ff5e00 0%,#ff8a1f 30%,#ffd2a1 48%,#ff9a3c 62%,#ff5e00 100%)";

const RISE = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease: EASE },
} as const;

const WHY_ICONS = [IconTrendingUp, IconRepeat, IconAward, IconUsersGroup];

const BUTTON =
  "inline-flex h-12 cursor-pointer items-center justify-center rounded-full px-7 text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,106,20,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(255,106,20,0.95)] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0";
const BUTTON_BG = { background: "linear-gradient(115deg,#ff5e00 0%,#ff8a1f 45%,#ffb066 100%)" };

const FIELD =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[15px] text-white placeholder:text-white/35 outline-none transition-[border-color,background-color] duration-200 focus:border-[#ff8a1f]/70 focus:bg-white/[0.06]";

const TYPE_KEYS = ["angel", "fund", "family", "strategic", "other"] as const;
const RANGE_KEYS = ["discuss", "under50", "from50", "from250", "over1m"] as const;

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-white/75">
        {label}
      </label>
      {children}
    </div>
  );
}

/** The "I'm interested" form: posts to `/api/contact` as an investor inquiry (the details ride in the message). */
function InterestForm() {
  const { t } = useLanguage();
  const f = t.investors.form;
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firm, setFirm] = useState("");
  const [type, setType] = useState<(typeof TYPE_KEYS)[number]>("angel");
  const [range, setRange] = useState<(typeof RANGE_KEYS)[number]>("discuss");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent" | "invalid" | "error">("idle");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !message.trim()) {
      setState("invalid");
      return;
    }
    setState("sending");
    try {
      // The details ride at the top of the message (it is an internal email to the inbox, so plain labels).
      const details = [
        `Investor type: ${f.types[type]}`,
        firm.trim() ? `Fund / company: ${firm.trim()}` : null,
        `Typical investment: ${f.ranges[range]}`,
      ].filter(Boolean);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: t.investors.direct.subject,
          formStateBg: "Инвеститор",
          website,
          message: `${details.join("\n")}\n\n${message.trim()}`,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-4">
        <span className="flex size-14 items-center justify-center rounded-full p-px" style={{ background: PEARL }}>
          <span className="flex size-full items-center justify-center rounded-full bg-[#141518]">
            <IconCheck className="size-7 text-[#ffb066]" stroke={2.4} aria-hidden />
          </span>
        </span>
        <h3 className="font-heading text-2xl font-black uppercase leading-tight">{f.successTitle}</h3>
        <p className="max-w-[44ch] text-[15px] leading-relaxed text-white/70">{f.successText}</p>
        <button
          type="button"
          onClick={() => {
            setName("");
            setEmail("");
            setFirm("");
            setMessage("");
            setState("idle");
          }}
          className="cursor-pointer text-sm font-semibold text-[#ffb066] underline decoration-[#ffb066]/40 underline-offset-4 transition-colors duration-200 hover:text-white"
        >
          {f.another}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {/* Honeypot: hidden from people, filled by bots. */}
      <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor={id("website")}>Company website</label>
        <input id={id("website")} type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.name} htmlFor={id("name")}>
          <input id={id("name")} name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className={`${FIELD} h-12`} />
        </Field>
        <Field label={f.email} htmlFor={id("email")}>
          <input id={id("email")} name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${FIELD} h-12`} />
        </Field>
      </div>

      <Field label={f.firm} htmlFor={id("firm")}>
        <input id={id("firm")} name="firm" autoComplete="organization" value={firm} onChange={(e) => setFirm(e.target.value)} className={`${FIELD} h-12`} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.type} htmlFor={id("type")}>
          <select id={id("type")} value={type} onChange={(e) => setType(e.target.value as (typeof TYPE_KEYS)[number])} className={`${FIELD} h-12 cursor-pointer [&>option]:bg-[#141518]`}>
            {TYPE_KEYS.map((key) => (
              <option key={key} value={key}>
                {f.types[key]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={f.range} htmlFor={id("range")}>
          <select id={id("range")} value={range} onChange={(e) => setRange(e.target.value as (typeof RANGE_KEYS)[number])} className={`${FIELD} h-12 cursor-pointer [&>option]:bg-[#141518]`}>
            {RANGE_KEYS.map((key) => (
              <option key={key} value={key}>
                {f.ranges[key]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={f.message} htmlFor={id("message")}>
        <textarea
          id={id("message")}
          name="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={f.messagePlaceholder}
          className={`${FIELD} min-h-[8.5rem] resize-y py-3 leading-relaxed`}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button type="submit" disabled={state === "sending"} className={BUTTON} style={BUTTON_BG}>
          {state === "sending" ? f.sending : f.submit}
        </button>
        <p role="alert" className="min-h-5 text-sm text-[#ff9a8a]">
          {state === "invalid" ? f.required : state === "error" ? f.error : ""}
        </p>
      </div>
    </form>
  );
}

/** `/investors` - investor relations (it took the contact page's place): why Keplerbay, who we would like to hear from,
 * what happens next, and the short "I'm interested" form. Copy in the dictionary under `investors`. */
export function InvestorsPageView() {
  const { t } = useLanguage();
  const c = t.investors;

  return (
    <AccountShell sideNav={false}>
      <header className="mt-8 max-w-4xl sm:mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff8a1f]">{c.eyebrow}</p>
        <h1 className="mt-3 font-heading text-[clamp(38px,6vw,96px)] leading-[0.94] font-black uppercase tracking-[-0.015em] text-balance">
          {c.title1} <span className="bg-[linear-gradient(115deg,#ff5e00_0%,#ff8a1f_30%,#ffd2a1_48%,#ff9a3c_62%,#ff5e00_100%)] bg-clip-text text-transparent">{c.title2}</span>
        </h1>
        <p className="mt-6 max-w-[62ch] text-[clamp(16px,1.3vw,21px)] leading-relaxed text-white/75">{c.lead}</p>
        <a href="#interested" className={`${BUTTON} mt-8`} style={BUTTON_BG}>
          {c.cta}
        </a>
      </header>

      <section aria-labelledby="why-heading" className="mt-16">
        <h2 id="why-heading" className="font-heading text-[clamp(24px,2.6vw,40px)] font-black uppercase leading-tight tracking-tight">
          {c.whyTitle}
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {c.why.map((item, index) => {
            const Icon = WHY_ICONS[index % WHY_ICONS.length];
            return (
              <motion.li
                key={item.title}
                initial={RISE.initial}
                whileInView={RISE.whileInView}
                viewport={RISE.viewport}
                transition={{ ...RISE.transition, delay: (index % 2) * 0.1 }}
                className={`${ACCOUNT_CARD} relative overflow-hidden p-7 sm:p-9`}
              >
                <span aria-hidden className="pointer-events-none absolute top-2 right-5 font-heading text-8xl font-black leading-none text-white/[0.04]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="relative flex size-12 items-center justify-center rounded-2xl p-px" style={{ background: PEARL }}>
                  <span className="flex size-full items-center justify-center rounded-[15px] bg-[#141518]">
                    <Icon className="size-6 text-[#ffb066]" stroke={1.6} aria-hidden />
                  </span>
                </span>
                <h3 className="relative mt-5 font-heading text-[clamp(20px,1.9vw,28px)] font-black uppercase leading-tight tracking-tight">{item.title}</h3>
                <p className="relative mt-3 text-[15px] leading-relaxed text-white/70">{item.text}</p>
              </motion.li>
            );
          })}
        </ul>
      </section>

      <div className="mt-16 grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
        <motion.div {...RISE} className="flex flex-col gap-6">
          <section className={`${ACCOUNT_CARD} p-7 sm:p-9`}>
            <h2 className="font-heading text-[clamp(20px,2vw,28px)] font-black uppercase leading-tight">{c.lookingTitle}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {c.looking.map((who) => (
                <li key={who} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-white/80">
                  <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(115deg,#ff5e00,#ff9a3c)] text-white">
                    <IconCheck className="size-3" stroke={3} aria-hidden />
                  </span>
                  {who}
                </li>
              ))}
            </ul>
          </section>

          <section className={`${ACCOUNT_CARD} p-7 sm:p-9`}>
            <h2 className="font-heading text-[clamp(20px,2vw,28px)] font-black uppercase leading-tight">{c.stepsTitle}</h2>
            <ol className="mt-5 flex flex-col gap-5">
              {c.steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#ff8a1f]/50 bg-[#ff8a1f]/10 font-heading text-sm font-black text-[#ffb066]">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-black uppercase leading-tight tracking-tight">{step.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-white/70">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={`${ACCOUNT_CARD} flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9`}>
            <div>
              <h2 className="font-heading text-[clamp(18px,1.7vw,24px)] font-black uppercase leading-tight">{c.direct.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/65">{c.direct.text}</p>
            </div>
            <a
              href={emailHref(c.direct.subject)}
              className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-[15px] font-semibold text-white/90 transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              <IconMail className="size-5 text-[#ffb066]" stroke={1.8} aria-hidden />
              {c.direct.cta}
            </a>
          </section>
        </motion.div>

        <motion.section
          {...RISE}
          id="interested"
          aria-labelledby="interested-heading"
          className={`${ACCOUNT_CARD} relative scroll-mt-32 overflow-hidden p-7 sm:p-9 lg:sticky lg:top-28`}
        >
          <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-52 rounded-full bg-[radial-gradient(circle,rgba(255,110,20,0.22),transparent_68%)]" />
          <h2 id="interested-heading" className="relative font-heading text-[clamp(22px,2.2vw,32px)] font-black uppercase leading-tight tracking-tight">
            {c.form.title}
          </h2>
          <p className="relative mt-2 mb-6 text-[15px] leading-relaxed text-white/65">{c.form.subtitle}</p>
          <div className="relative">
            <InterestForm />
          </div>
        </motion.section>
      </div>

      <p className="mt-10 max-w-[80ch] text-xs leading-relaxed text-white/40">{c.note}</p>
    </AccountShell>
  );
}
