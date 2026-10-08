import Image from "next/image";

/**
 * The tiger hero's "Trusted by" strip: the client's white-ink logos (`public/hero-tiger/logos/`) on one slow marquee,
 * faded at both ends, paused on hover and while the hero is off screen (`[data-offstage]`). The track is rendered twice
 * so the loop is seamless; the copy is hidden from assistive tech. Under reduced motion it wraps into still rows.
 */
const LOGOS = [
  { file: "mindguard", name: "Mindguard", w: 104, h: 33 },
  { file: "valtcan", name: "Valtcan", w: 62, h: 55 },
  { file: "isupport", name: "iSupport", w: 118, h: 29 },
  { file: "iceheart", name: "Iceheart", w: 44, h: 58 },
  { file: "sneedspeed", name: "Sneedspeed Powertrain Systems", w: 102, h: 33 },
  { file: "together-local", name: "Together Local", w: 150, h: 21 },
  { file: "streetlight-taco", name: "Streetlight Taco", w: 124, h: 27 },
  { file: "raibranch", name: "Raibranch", w: 93, h: 37 },
  { file: "sinisco", name: "Sinisco", w: 61, h: 56 },
  { file: "chargecloud", name: "chargecloud", w: 133, h: 26 },
  { file: "pointrn", name: "PointRN", w: 107, h: 32 },
  { file: "senko", name: "Senkō", w: 115, h: 30 },
  { file: "hanstaiger", name: "Hanstaiger", w: 98, h: 35 },
];

function Track({ copy = false }: { copy?: boolean }) {
  return (
    <ul className="tiger-logos__track" aria-hidden={copy || undefined}>
      {LOGOS.map((l) => (
        <li key={l.file}>
          <Image
            src={`/hero-tiger/logos/${l.file}.png`}
            alt={copy ? "" : l.name}
            width={l.w}
            height={l.h}
            unoptimized
            className="tiger-logos__img"
          />
        </li>
      ))}
    </ul>
  );
}

/** The US flag, simplified for 18px: thirteen stripes and the blue canton with a hint of stars. */
function FlagUsa() {
  return (
    <svg viewBox="0 0 19 10" className="h-3 w-auto rounded-[2px]" aria-hidden>
      <rect width="19" height="10" fill="#b22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={(i * 10) / 13} width="19" height={10 / 13} fill="#fff" />
      ))}
      <rect width="7.6" height={(7 * 10) / 13} fill="#3c3b6e" />
      {[1.3, 3.8, 6.3].map((x) => [1.2, 2.9, 4.6].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" fill="#fff" />))}
    </svg>
  );
}

/** The EU flag: twelve gold stars in a ring on blue. */
function FlagEurope() {
  return (
    <svg viewBox="0 0 15 10" className="h-3 w-auto rounded-[2px]" aria-hidden>
      <rect width="15" height="10" fill="#003399" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={7.5 + Math.sin(a) * 3.3} cy={5 - Math.cos(a) * 3.3} r="0.55" fill="#ffcc00" />;
      })}
    </svg>
  );
}

/** Worldwide: a globe in the orange pearl. */
function FlagWorld() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
      <defs>
        <linearGradient id="pearl-globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5e00" />
          <stop offset="0.5" stopColor="#ffd2a1" />
          <stop offset="1" stopColor="#ff5e00" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#pearl-globe)" strokeWidth="1">
        <circle cx="6" cy="6" r="5.2" />
        <ellipse cx="6" cy="6" rx="2.3" ry="5.2" />
        <path d="M1 6h10M2 3.2h8M2 8.8h8" />
      </g>
    </svg>
  );
}

const REGION_FLAGS = { usa: FlagUsa, europe: FlagEurope, worldwide: FlagWorld } as const;

export function TigerLogos({
  label,
  regions,
}: {
  label: string;
  /** The markets under the line, each a small glass chip with its flag. */
  regions: Record<keyof typeof REGION_FLAGS, string>;
}) {
  return (
    <div className="relative pb-[clamp(22px,3.5vh,40px)] max-lg:pb-[5.5rem]" aria-label={label}>
      <p className="text-center text-[13px] tracking-[0.04em] text-white/55">{label}</p>
      <ul className="mt-2.5 mb-5 flex flex-wrap items-center justify-center gap-2">
        {(Object.keys(REGION_FLAGS) as (keyof typeof REGION_FLAGS)[]).map((key) => {
          const Flag = REGION_FLAGS[key];
          return (
            <li
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
            >
              <Flag />
              {regions[key]}
            </li>
          );
        })}
      </ul>
      <div className="tiger-logos__viewport">
        <Track />
        <Track copy />
      </div>
    </div>
  );
}
