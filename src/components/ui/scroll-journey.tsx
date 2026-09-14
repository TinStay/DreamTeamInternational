"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

/*
 * Scroll-driven "journey" for the home sections after the projects showcase.
 * The sections stay transparent (the fixed page background never moves) and
 * it is their PARTS that travel: inside each `JourneyScene` the section marks
 * its title block and its components with `JourneyItem`s, and those come in
 * from different sides and leave again, choreographed on scroll -
 *
 *   previous title leaves ▸ previous components leave (staggered) ▸
 *   next title arrives from the top ▸ next components arrive from their sides.
 *
 * A journey can also carry background furniture on a fixed, viewport-sized
 * canvas under the scenes: per-scene backdrops (`JourneyBackdrop`) and one
 * continuous morphing shape (`JourneyMorph`), both driven by the journey
 * position; `prelude` lets the canvas come up before the first scene so the
 * shape can be taken over from whatever precedes the journey (the OSMO disc).
 *
 * Every scene is a sticky box (`min-h-[100svh]`, `pt-24` for the floating
 * header, content vertically centred): it scrolls like a normal section until
 * its bottom reaches the bottom of the viewport, then stays pinned while its
 * parts leave; the incoming scene overlaps that tail by `OVERLAP` of a
 * viewport (negative top margin) and is held at the top of the viewport with
 * a counter-translate for the whole stretch, so its parts fly in onto a still
 * frame. The hand-over runs over `REVEAL` of a viewport (about four wheel
 * ticks: two out, two in) and the new scene then sits framed for the rest
 * before it scrolls on. Progress is read off zero-height flow markers
 * before/after each sticky box (a pinned element's own offsetTop moves with
 * the pin); the incoming's reveal and the outgoing's leave coincide because
 * the scenes are adjacent in flow. Part motion runs on a stiff spring so wheel
 * steps read as motion, not jumps; the hold itself is exact. Transforms are
 * gone once a scene is in, so nothing inside (forms, accordions) is affected
 * while it is in use. Scenes that are not on stage are `opacity: 0` +
 * `inert`. Below `lg` the pin sits above the mobile dock (`--journey-dock`).
 * Until the component has mounted (server HTML, no JS) the sections are plain
 * flow, no overlap; reduced motion keeps them that way and `JourneyItem`s
 * render plain (they also do outside any journey, e.g. on `/contact`).
 */

/** Default: how much of a viewport each scene overlaps the previous one's tail by (the room for the hand-over). */
const OVERLAP = 0.35;
/** Default: scroll distance, in viewports, of the hand-over - the previous parts leave, then the new ones arrive. */
const REVEAL = 0.5;
/** Part motion smoothing - stiff, so a wheel tick glides instead of stepping. */
const SPRING = { stiffness: 210, damping: 32, mass: 0.6, restDelta: 0.001 };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 0 → 1 across [a, b]. */
const across = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

export type JourneyContextValue = {
  /** Hand-over progress while this scene ARRIVES (0 → 1). */
  enter: MotionValue<number>;
  /** Hand-over progress while this scene LEAVES (0 → 1). */
  leave: MotionValue<number>;
  /** The whole held stretch: 0 when the scene starts arriving, 1 once its box sits at the top of the viewport. */
  travel: MotionValue<number>;
  /** The scene's own scrolling (taller than the viewport): 0 with its top at the viewport top, 1 once its bottom is pinned. */
  within: MotionValue<number>;
  /** First scene after the showcase: nothing leaves before it, so its parts arrive right away. */
  lead: boolean;
};
const JourneyContext = createContext<JourneyContextValue | null>(null);

/** The enclosing scene's progress values, or `null` outside a journey. */
export function useJourney() {
  return useContext(JourneyContext);
}

/** Scenes hand their arrival progress to the journey, which sums them into one continuous position. */
type JourneyRegistry = { register: (index: number, arrival: MotionValue<number>) => () => void };
const JourneyRegistryContext = createContext<JourneyRegistry | null>(null);

/* ---------------------------------------------------------------- backdrop */

/**
 * A scene's background furniture: a render function that gets the scene's
 * `presence` (0 → 1 while it arrives, 1 while it is on stage, → 0 while the
 * next scene arrives) - plus the raw `arrive` (0 → 1 as the scene comes in)
 * and `depart` (0 → 1 as the next one comes in) so a shape can time its own
 * hand-offs - and returns absolutely positioned decoration for the journey's
 * viewport-sized canvas. Shapes live in `journey-backdrops.tsx`.
 */
export type JourneyBackdropProps = {
  presence: MotionValue<number>;
  arrive: MotionValue<number>;
  depart: MotionValue<number>;
};
export type JourneyBackdrop = (props: JourneyBackdropProps) => ReactNode;
/**
 * The journey's one continuous shape (`journeyMorph`): rendered once on the
 * canvas with the journey position - scene k fully in at k + 1, and below 0
 * during the `prelude` before the first scene starts arriving.
 */
export type JourneyMorph = (position: MotionValue<number>) => ReactNode;

/** One scene's slot on the canvas: derives its presence from the journey position and renders the backdrop. */
function BackdropSlot({ position, index, render }: { position: MotionValue<number>; index: number; render: JourneyBackdrop }) {
  // Scene k is fully in at position k + 1; it fades as the next one arrives (k + 1 → k + 2).
  const arrive = useTransform(position, (p) => clamp01(p - index));
  const depart = useTransform(position, (p) => clamp01(p - index - 1));
  const presence = useTransform([arrive, depart], ([a, d]: number[]) => a * (1 - d));
  return <>{render({ presence, arrive, depart })}</>;
}

/**
 * The canvas behind the transparent scenes: fixed to the viewport (so it is in
 * place from the prelude on, when the first scene is still below the fold),
 * faded in and out by the journey (`opacity`), holding the morph shape and
 * every scene's backdrop slot. It stays under the scenes (they follow it in
 * the journey's stacking context) and over whatever the journey overlaps.
 */
function JourneyBackdropLayer({
  position,
  opacity,
  backdrops,
  morph,
}: {
  position: MotionValue<number>;
  opacity: MotionValue<number>;
  backdrops: (JourneyBackdrop | undefined)[];
  morph?: JourneyMorph;
}) {
  return (
    <motion.div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[100svh] overflow-hidden" style={{ opacity }} aria-hidden>
      {morph ? morph(position) : null}
      {backdrops.map((render, index) =>
        render ? <BackdropSlot key={index} position={position} index={index} render={render} /> : null
      )}
    </motion.div>
  );
}

/** Where the parts of the previous scene have gone and the new title starts to arrive. */
const arriveStart = (lead: boolean) => (lead ? 0.06 : 0.5);

/** Fade of the whole scene box - covers whatever a section does not mark as a `JourneyItem` (dividers, lines). */
function sceneOpacity(lead: boolean, isLast: boolean, p: number, c: number) {
  const s = arriveStart(lead);
  return easeOut(across(p, s - 0.05, s + 0.08)) * (isLast ? 1 : 1 - easeInOut(across(c, 0.42, 0.64)));
}

export type JourneySide = "top" | "bottom" | "left" | "right";
type ItemKind = "title" | "item";

const ARRIVE_FROM: Record<JourneySide, [number, number]> = {
  top: [0, -56],
  bottom: [0, 56],
  left: [-80, 0],
  right: [80, 0],
};

/** A part's offset/opacity/scale for arrive progress `p` and leave progress `c`. */
function itemFrame(kind: ItemKind, index: number, side: JourneySide, lead: boolean, p: number, c: number) {
  const s = arriveStart(lead);
  // Title first, then the components one after another (stagger capped so long lists still land by the end).
  const inA = kind === "title" ? s : Math.min(s + 0.12 + index * 0.05, 0.86);
  const inB = Math.min(1, inA + (kind === "title" ? 0.24 : 0.3));
  const outA = kind === "title" ? 0 : Math.min(0.08 + index * 0.04, 0.34);
  const outB = outA + (kind === "title" ? 0.2 : 0.24);
  const kIn = easeOut(across(p, inA, inB));
  const kOut = easeInOut(across(c, outA, outB));
  const [fx, fy] = ARRIVE_FROM[side];
  // Leaves upward (with the scroll), sideways parts drifting back toward their side.
  const outX = side === "left" ? -56 : side === "right" ? 56 : 0;
  return {
    x: fx * (1 - kIn) + outX * kOut,
    y: fy * (1 - kIn) - 44 * kOut,
    opacity: kIn * (1 - kOut),
    scale: 1 - 0.04 * (1 - kIn) - 0.04 * kOut,
  };
}

export type JourneyItemProps = {
  /** `title` = the section's heading block (arrives first, leaves first); `item` = a component. */
  kind?: ItemKind;
  /** Position among the scene's items - drives the stagger. */
  index?: number;
  /** Side it arrives from (title: top; items alternate left / right by default). */
  from?: JourneySide;
  as?: "div" | "header" | "li";
  className?: string;
  children: ReactNode;
};

/** Marks a part of a section for the journey choreography. Plain wrapper outside a `JourneyScene`. */
export function JourneyItem({ kind = "item", index = 0, from, as = "div", className, children }: JourneyItemProps) {
  const journey = useContext(JourneyContext);
  const settled = useMotionValue(1);
  const still = useMotionValue(0);
  const enter = journey?.enter ?? settled;
  const leave = journey?.leave ?? still;
  const lead = journey?.lead ?? false;
  const side: JourneySide = from ?? (kind === "title" ? "top" : index % 2 ? "right" : "left");
  const x = useTransform([enter, leave], ([p, c]: number[]) => itemFrame(kind, index, side, lead, p, c).x);
  const y = useTransform([enter, leave], ([p, c]: number[]) => itemFrame(kind, index, side, lead, p, c).y);
  const opacity = useTransform([enter, leave], ([p, c]: number[]) => itemFrame(kind, index, side, lead, p, c).opacity);
  const scale = useTransform([enter, leave], ([p, c]: number[]) => itemFrame(kind, index, side, lead, p, c).scale);

  if (!journey) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  const Tag = as === "header" ? motion.header : as === "li" ? motion.li : motion.div;
  return (
    <Tag className={className} style={{ x, y, opacity, scale }}>
      {children}
    </Tag>
  );
}

export type JourneySceneProps = {
  children: ReactNode;
  className?: string;
  /** Filled in by `ScrollJourney`. */
  isFirst?: boolean;
  isLast?: boolean;
  /** Overlap the previous block's tail (negative top margin) - off for the very first scene of the page. */
  overlap?: boolean;
  /** Fade out while the next block arrives - off for the last scene before the footer. */
  leaves?: boolean;
  /** Pacing overrides from `ScrollJourney` (viewport fractions). */
  overlapBy?: number;
  revealOver?: number;
  /** Position in the journey (set by `ScrollJourney`). */
  index?: number;
  /** Background furniture wanted behind this scene - see `JourneyBackdropLayer`. */
  backdrop?: JourneyBackdrop;
  /** Per-scene pacing: a smaller overlap than the journey's = a longer hold on this scene. */
  pace?: { overlap?: number };
};

/** Viewport box in px - the same numbers motion resolves its scroll offsets against. */
type Viewport = { w: number; h: number };

export function JourneyScene({
  children,
  className,
  isFirst = false,
  isLast = false,
  overlap = true,
  leaves = !isLast,
  overlapBy = OVERLAP,
  revealOver = REVEAL,
  index = 0,
}: JourneySceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const registry = useContext(JourneyRegistryContext);
  // Zero-height flow markers before/after the sticky box: scroll progress is read off THEM, because a pinned
  // element's own offsetTop moves with the pin (so its progress would freeze exactly when it matters).
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const viewport = useRef<Viewport>({ w: 0, h: 0 });
  const [mounted, setMounted] = useState(false);
  const [height, setHeight] = useState(0);
  const [parked, setParked] = useState(false);
  const reduceMotion = useReducedMotion();

  // `travel`: the box's top going from the viewport bottom (its marker meets the bottom - the previous scene has
  // just pinned) up to the top of the viewport; the hand-over is the first `REVEAL` of that.
  const { scrollYProgress: travel } = useScroll({ target: startRef, offset: ["start end", `start ${overlapBy}`] });
  // The box's bottom doing the same - which is exactly the next scene's hand-over.
  const { scrollYProgress: leaving } = useScroll({ target: endRef, offset: ["start end", `start ${1 - revealOver}`] });
  const cover = useTransform(leaving, (v) => (leaves ? v : 0));
  const reveal = useTransform(travel, (v) => clamp01((v * (1 - overlapBy)) / revealOver));
  // The scene's own scroll: its box top at the viewport top (end marker at `height`) → its bottom pinned.
  const { scrollYProgress: within } = useScroll({ target: endRef, offset: [`start ${Math.max(height, 1)}px`, "start end"] });
  const enter = useSpring(reveal, SPRING);
  const leave = useSpring(cover, SPRING);

  useEffect(() => setMounted(true), []);
  // Feed the journey's backdrop with this scene's (smoothed) arrival.
  useEffect(() => registry?.register(index, enter), [registry, index, enter]);

  // The sticky offset pins the scene by its bottom edge (`100svh - height`), so a scene taller than the
  // viewport is fully read before it stays behind; measured with a ResizeObserver (accordions, wrapping).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion) return;
    const measure = () => {
      viewport.current = { w: document.documentElement.clientWidth, h: document.documentElement.clientHeight };
      setHeight(el.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reduceMotion]);

  // Hold at the top of the viewport for the whole overlap stretch (exact - no spring - so the frame is still).
  const y = useTransform(travel, (tr) => (mounted && tr > 0 && tr < 1 ? -(1 - tr) * (1 - overlapBy) * viewport.current.h : 0));
  // Off stage (not started yet, or gone) = fully transparent and inert. Opacity rather than `visibility: hidden`:
  // Chrome never lazy-loads images inside a hidden subtree, which left badges blank after the scene appeared.
  const offStage = useTransform([travel, cover], ([tr, c]: number[]): number => (mounted && (tr <= 0 || c >= 0.999) ? 1 : 0));
  const opacity = useTransform([enter, leave, offStage], ([p, c, off]: number[]) =>
    !mounted ? 1 : off ? 0 : sceneOpacity(isFirst, !leaves, p, c)
  );
  useMotionValueEvent(offStage, "change", (v) => setParked(v === 1));

  // The marker refs must stay attached: useScroll asserts its targets are hydrated.
  if (reduceMotion) {
    return (
      <>
        <div ref={startRef} className="h-0" aria-hidden />
        <div ref={ref} className={className}>
          {children}
        </div>
        <div ref={endRef} className="h-0" aria-hidden />
      </>
    );
  }
  return (
    <>
      <div ref={startRef} className="h-0" aria-hidden />
      <motion.div
        ref={ref}
        className={cn(
          // pt-24 keeps a held scene's title clear of the floating header.
          "relative flex min-h-[100svh] flex-col justify-center pt-24 [--journey-dock:5rem] lg:[--journey-dock:0px]",
          height > 0 && "sticky",
          className
        )}
        style={{
          top: `calc(100svh - var(--journey-dock) - ${height}px)`,
          marginTop: mounted && overlap ? `${-overlapBy * 100}svh` : 0,
          y,
          opacity,
        }}
        inert={parked ? true : undefined}
      >
        <JourneyContext.Provider value={{ enter, leave, travel, within, lead: isFirst }}>{children}</JourneyContext.Provider>
      </motion.div>
      <div ref={endRef} className="h-0" aria-hidden />
    </>
  );
}

export type ScrollJourneyProps = {
  children: ReactNode;
  className?: string;
  /** Let the first scene overlap whatever precedes the journey (the stage's tail); off at the top of the page. */
  overlapFirst?: boolean;
  /** Let the last scene leave too - when a non-journey block (the projects stage) follows instead of the footer. */
  leaveLast?: boolean;
  /** Pacing (viewport fractions): how much a scene overlaps the previous tail, and how much scroll the hand-over takes. */
  overlap?: number;
  reveal?: number;
  /** One continuous background shape for the whole journey (see `journeyMorph`). */
  morph?: JourneyMorph;
  /**
   * Viewports of scroll before the first scene starts arriving during which the canvas is already live (the morph's
   * position runs -1 → 0 over it) - how the journey takes a shape over from whatever precedes it.
   */
  prelude?: number;
};

/** Stacks `JourneyScene`s: tells each one whether it is first (nothing leaves before it), last, overlapping, leaving. */
export function ScrollJourney({
  children,
  className,
  overlapFirst = true,
  leaveLast = false,
  overlap = OVERLAP,
  reveal = REVEAL,
  morph,
  prelude = 0,
}: ScrollJourneyProps) {
  const scenes = Children.toArray(children).filter((child): child is ReactElement<JourneySceneProps> =>
    isValidElement(child)
  );
  // The scenes' arrivals summed (scene k fully in at k + 1) ...
  const arrived = useMotionValue(0);
  const arrivals = useRef(new Map<number, MotionValue<number>>());
  const registry = useRef<JourneyRegistry>({
    register: (index, arrival) => {
      arrivals.current.set(index, arrival);
      const recompute = () => {
        let sum = 0;
        for (const mv of arrivals.current.values()) sum += mv.get();
        arrived.set(sum);
      };
      const unsubscribe = arrival.on("change", recompute);
      recompute();
      return () => {
        unsubscribe();
        arrivals.current.delete(index);
      };
    },
  });
  // ... plus the prelude: zero-height markers at the journey's head and tail. `approach` runs 0 → 1 while the head
  // marker climbs the last `prelude` viewports to the fold (raw scroll, no spring - it is a hand-over from outside),
  // `exit` 0 → 1 as the tail marker rises from the fold to mid-viewport (the footer coming up under the last scene).
  const headRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: approach } = useScroll({
    target: headRef,
    offset: [`start ${100 + Math.max(prelude, 0.01) * 100}%`, "start 100%"],
  });
  const { scrollYProgress: exit } = useScroll({ target: tailRef, offset: ["start 100%", "start 50%"] });
  // Continuous journey position: -1 → 0 over the prelude, then the arrivals.
  const position = useTransform([arrived, approach], ([sum, q]: number[]) => sum + q - 1);
  // The canvas is up as soon as the prelude has begun and gone once the tail has cleared the fold.
  const canvasOpacity = useTransform([approach, exit], ([q, e]: number[]) => clamp01(q / 0.3) * (1 - e));
  const backdrops = scenes.map((scene) => scene.props.backdrop);
  const hasBackdrop = backdrops.some(Boolean) || Boolean(morph);
  // flow-root: a scene's negative margin must not collapse through to the container (it would move the markers).
  // z-10: level with the showcase, so a scene held over its tail paints on top.
  return (
    <JourneyRegistryContext.Provider value={registry.current}>
      <div className={cn("relative z-10 flow-root", className)}>
        <div ref={headRef} className="h-0" aria-hidden />
        {hasBackdrop ? (
          <JourneyBackdropLayer position={position} opacity={canvasOpacity} backdrops={backdrops} morph={morph} />
        ) : null}
        {scenes.map((scene, index) =>
          cloneElement(scene, {
            index,
            isFirst: index === 0,
            isLast: index === scenes.length - 1,
            overlap: overlapFirst || index > 0,
            leaves: leaveLast || index < scenes.length - 1,
            overlapBy: scene.props.pace?.overlap ?? overlap,
            revealOver: reveal,
          })
        )}
        <div ref={tailRef} className="h-0" aria-hidden />
      </div>
    </JourneyRegistryContext.Provider>
  );
}
