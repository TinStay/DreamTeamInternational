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

export function TigerLogos({ label }: { label: string }) {
  return (
    <div className="relative pb-[clamp(22px,3.5vh,40px)] max-lg:pb-[5.5rem]" aria-label={label}>
      <p className="mb-3.5 text-center text-[13px] tracking-[0.04em] text-white/50">{label}</p>
      <div className="tiger-logos__viewport">
        <Track />
        <Track copy />
      </div>
    </div>
  );
}
