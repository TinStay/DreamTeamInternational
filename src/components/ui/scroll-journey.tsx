"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  frame,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";
import { useFlowProgress, useScrollEased } from "@/lib/smooth-scroll";
import { useHydrated } from "@/lib/use-media-query";
import { usePagedHandover } from "@/components/ui/paged-handover";

/*
 * Scroll-driven "journey" for the home sections after the projects showcase.
 * The sections stay transparent (the fixed page background never moves) and
 * it is their PARTS that travel: inside each `JourneyScene` the section marks
 * its title block and its components with `JourneyItem`s, and those come in
 * from different sides and leave again, choreographed on scroll -
 *
 *   previous title leaves ▸ previous components leave (staggered) ▸
 *   next title rises in ▸ next components arrive from their sides.
 *
 * A journey can also carry background furniture on a fixed, viewport-sized
 * canvas under the scenes: per-scene backdrops (`JourneyBackdrop`) and one
 * continuous morphing shape (`JourneyMorph`), both driven by the journey
 * position; `prelude` lets the canvas come up before the first scene so the
 * shape can be taken over from whatever precedes the journey (the OSMO disc).
 *
 * Every scene is a sticky box (at least a viewport high, `pt-24` for the
 * floating header, content vertically centred in the first viewport, plus
 * `hold` of a viewport of room at the bottom so even a screen-high scene
 * scrolls on for a while, fully in, before it is pinned): it scrolls like a
 * normal section until its bottom reaches the bottom of the viewport, then
 * stays pinned while its parts leave; the incoming scene overlaps that tail
 * by `OVERLAP` of a viewport (negative top margin), and the hand-over spans
 * that WHOLE stretch (`1 - OVERLAP` of a viewport of scroll): the previous
 * parts leave in the first half, the new ones arrive in the second, and the
 * moment they have landed the scene scrolls on - there is never a stretch
 * where the wheel moves nothing. The incoming box is not held still: a
 * counter-translate eases it up into place (`riseOffset`) - nearly still
 * while the previous parts leave, rising with growing speed as its own parts
 * land, at exactly scroll speed when it lets go - so the release has no jolt.
 * Progress is read off zero-height flow markers before/after each sticky box
 * (a pinned element's own offsetTop moves with the pin); the incoming's
 * arrival and the outgoing's leave coincide because the scenes are adjacent
 * in flow. Part motion follows the scroll directly while the smooth scroller
 * glides it, and runs on a stiff spring under native scrolling so wheel steps
 * read as motion, not jumps (`useScrollEased`). Transforms are gone once a
 * scene is in, so nothing inside (forms, accordions) is affected while it is
 * in use. Scenes that are not on stage are `opacity: 0` + `inert`. Below
 * `lg` the pin sits above the mobile dock (`--journey-dock`).
 * Until the component has mounted (server HTML, no JS) the sections are plain
 * flow, no overlap; reduced motion keeps them that way and `JourneyItem`s
 * render plain (they also do outside any journey, e.g. on `/contact`).
 */

/**
 * Default: how much of a viewport each scene overlaps the previous one's tail by. The hand-over (previous parts out,
 * new ones in) takes the rest of that viewport (`1 - OVERLAP`) of scroll - a bigger overlap is a quicker change.
 */
const OVERLAP = 0.35;
/** Default reading room (viewport fraction) a scene scrolls through, fully in, before it is pinned for the next hand-over. */
const HOLD = 0.2;
/** Part motion smoothing under native scrolling - stiff, so a wheel tick glides instead of stepping. */
const SPRING = { stiffness: 210, damping: 32, mass: 0.6, restDelta: 0.001 };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 0 → 1 across [a, b]. */
const across = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
/**
 * The incoming box's counter-translate over its stretch (`stretch` px of scroll, `tr` 0 → 1): its natural top runs
 * from `stretch` down to 0; instead it starts a third of the way down and rises along `(1 - tr³) / 3` - velocity 0 at
 * the start, exactly the scroll's at the end, so the box is as good as still while the previous parts leave and is
 * already moving at full speed when it is released into normal flow.
 */
const riseOffset = (tr: number, stretch: number) => stretch * ((1 - tr * tr * tr) / 3 - (1 - tr));

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

/** Where the new title starts to arrive - a little before the previous parts are all gone, so the two cross-fade. */
const arriveStart = (lead: boolean) => (lead ? 0.06 : 0.44);

/** Fade of the whole scene box - covers whatever a section does not mark as a `JourneyItem` (dividers, lines). */
function sceneOpacity(lead: boolean, isLast: boolean, p: number, c: number) {
  const s = arriveStart(lead);
  // Out over the middle of the hand-over: a crossfade with the arriving parts rather than a cut.
  return easeOut(across(p, s - 0.05, s + 0.08)) * (isLast ? 1 : 1 - easeInOut(across(c, 0.3, 0.64)));
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
  // Title first, then the components one after another (stagger capped so long lists still land by the end - the
  // scene is released the moment they have).
  const inA = kind === "title" ? s : Math.min(s + 0.1 + index * 0.045, 0.72);
  const inB = Math.min(1, inA + (kind === "title" ? 0.24 : 0.28));
  const outA = kind === "title" ? 0 : Math.min(0.06 + index * 0.04, 0.3);
  const outB = outA + (kind === "title" ? 0.22 : 0.26);
  const kIn = easeOut(across(p, inA, inB));
  const kOut = easeInOut(across(c, outA, outB));
  const [fx, fy] = ARRIVE_FROM[side];
  // The heading travels a shorter way than the components.
  const reach = kind === "title" ? 0.75 : 1;
  // Leaves upward (with the scroll), sideways parts drifting back toward their side.
  const outX = side === "left" ? -56 : side === "right" ? 56 : 0;
  return {
    x: fx * reach * (1 - kIn) + outX * kOut,
    y: fy * reach * (1 - kIn) - 56 * kOut,
    opacity: kIn * (1 - kOut),
    scale: 1 - 0.03 * (1 - kIn) - 0.03 * kOut,
  };
}

export type JourneyItemProps = {
  /** `title` = the section's heading block (arrives first, leaves first); `item` = a component. */
  kind?: ItemKind;
  /** Position among the scene's items - drives the stagger. */
  index?: number;
  /** Side it arrives from (rising from below for a title; items alternate left / right by default). */
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
  const side: JourneySide = from ?? (kind === "title" ? "bottom" : index % 2 ? "right" : "left");
  const x = useTransform([enter, leave], ([p, c]: number[]) => itemFrame(kind, index, side, lead, p, c).x);
  const y = useTransform([enter, leave], ([p, c]: number[]) => itemFrame(kind, index, side, lead, p, c).y);
  const opacity = useTransform([enter, leave], ([p, c]: number[]) => itemFrame(kind, index, side, lead, p, c).opacity);
  const scale = useTransform([enter, leave], ([p, c]: number[]) => itemFrame(kind, index, side, lead, p, c).scale);

  if (!journey) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  const Tag = as === "header" ? motion.header : as === "li" ? motion.li : motion.div;
  // Its own compositor layer: the scroll-linked transform / opacity must not repaint the part every frame.
  return (
    <Tag className={cn("will-change-[transform,opacity]", className)} style={{ x, y, opacity, scale }}>
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
  /** Pacing override from `ScrollJourney` (viewport fraction). */
  overlapBy?: number;
  /** Position in the journey (set by `ScrollJourney`). */
  index?: number;
  /** Background furniture wanted behind this scene - see `JourneyBackdropLayer`. */
  backdrop?: JourneyBackdrop;
  /** Per-scene pacing: a smaller overlap than the journey's = a slower hand-over into this scene. */
  pace?: { overlap?: number };
  /**
   * Reading room (viewport fraction, default `HOLD`): bottom padding the scene scrolls through, fully in, before it
   * is pinned and starts leaving - `0` for a scene that brings its own runway (the reviews' conveyor) or is pinned
   * from the top of the page (the hero).
   */
  hold?: number;
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
  index = 0,
  hold = HOLD,
}: JourneySceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const registry = useContext(JourneyRegistryContext);
  // Zero-height flow markers before/after the sticky box: scroll progress is read off THEM, because a pinned
  // element's own offsetTop moves with the pin (so its progress would freeze exactly when it matters).
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const viewport = useRef<Viewport>({ w: 0, h: 0 });
  // Server HTML and the hydrating render are plain flow; the overlap / rise apply from the first client render after.
  const mounted = useHydrated();
  const [height, setHeight] = useState(0);
  const [parked, setParked] = useState(false);
  const reduceMotion = useReducedMotion();

  // `travel`: the box's top going from the viewport bottom (its marker meets the bottom - the previous scene has
  // just pinned) up to the top of the viewport - the whole of it is the hand-over. (The markers' positions are
  // measured once, not per frame - `useFlowProgress`.)
  const travel = useFlowProgress(startRef, (top, _h, vh) => [top - vh, top - overlapBy * vh], [overlapBy]);
  // The box's bottom doing the same - which is exactly the next scene's hand-over.
  const leaving = useFlowProgress(endRef, (top, _h, vh) => [top - vh, top - overlapBy * vh], [overlapBy]);
  const never = useMotionValue(0);
  // Raw scroll values straight into the easing (both progresses are already clamped 0 → 1): a derived value in
  // between would be recomputed in the same frame step as the easing and could leave it a frame behind.
  const cover = leaves ? leaving : never;
  // The scene's own scroll: its box top at the viewport top (end marker at `height`) → its bottom pinned.
  const within = useFlowProgress(endRef, (top, _h, vh) => [top - Math.max(height, 1), top - vh], [height]);
  const enter = useScrollEased(travel, useSpring(travel, SPRING));
  const leave = useScrollEased(cover, useSpring(cover, SPRING));

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

  // Eased up into place over the overlap stretch (exact - no spring - it must meet normal flow at the end).
  const y = useTransform(travel, (tr) =>
    mounted && tr > 0 && tr < 1 ? riseOffset(tr, (1 - overlapBy) * viewport.current.h) : 0
  );
  // Off stage (not started yet, or gone) = fully transparent and inert. Opacity rather than `visibility: hidden`:
  // Chrome never lazy-loads images inside a hidden subtree, which left badges blank after the scene appeared.
  const offStage = useTransform([travel, cover], ([tr, c]: number[]): number => (mounted && (tr <= 0 || c >= 0.999) ? 1 : 0));
  const opacity = useTransform([enter, leave, offStage], ([p, c, off]: number[]) =>
    !mounted ? 1 : off ? 0 : sceneOpacity(isFirst, !leaves, p, c)
  );
  useMotionValueEvent(offStage, "change", (v) => setParked(v === 1));
  // Click-through while (near) transparent: an arriving box overlaps the previous scene's tail from the start of
  // the hand-over, before its own parts are in - it covered the training cards' CTAs, the contact section's social
  // links and, over the showcase, the OSMO CTA (a parked box is inert, but an arriving one is not). The pointer
  // reaches the box only once its content shows.
  const pointerEvents = useTransform(opacity, (o) => (o < 0.5 ? "none" : "auto"));

  // The marker refs must stay attached: `useFlowProgress` measures them.
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
  // A viewport (content centred in it) plus the reading room - the same numbers on the server and the client. A scene
  // that never leaves (the last one before the footer) needs none.
  const room = `${leaves ? Math.round(hold * 100) : 0}svh`;
  return (
    <>
      <div ref={startRef} className="h-0" aria-hidden />
      <motion.div
        ref={ref}
        className={cn(
          // pt-24 keeps an arriving scene's title clear of the floating header. Its own compositor layer, so the
          // scroll-linked rise / fade never repaints the whole section.
          "relative flex flex-col justify-center pt-24 will-change-[transform,opacity] [--journey-dock:5rem] lg:[--journey-dock:0px]",
          height > 0 && "sticky",
          className
        )}
        style={{
          minHeight: `calc(100svh + ${room})`,
          paddingBottom: room,
          top: `calc(100svh - var(--journey-dock) - ${height}px)`,
          marginTop: mounted && overlap ? `${-overlapBy * 100}svh` : 0,
          y,
          opacity,
          pointerEvents,
        }}
        inert={parked ? true : undefined}
        // For `scrollToElement`: a scene's flow position is its start marker's (the previous sibling) less this
        // overlap (a viewport fraction) - the box's own rect is wherever it is pinned.
        data-journey-scene=""
        data-journey-overlap={mounted && overlap ? overlapBy : 0}
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
  /**
   * Pacing (viewport fraction): how much a scene overlaps the previous one's tail - the hand-over takes the rest of
   * the viewport, so a bigger overlap is a quicker change.
   */
  overlap?: number;
  /** One continuous background shape for the whole journey (see `journeyMorph`). */
  morph?: JourneyMorph;
  /**
   * Viewports of scroll before the first scene starts arriving during which the canvas is already live (the morph's
   * position runs -1 → 0 over it) - how the journey takes a shape over from whatever precedes it.
   */
  prelude?: number;
  /**
   * The first hand-over (scene 1 → scene 2) played as a page: a wheel tick or a swipe from either end plays the whole
   * stretch as one animation, and the scroll never rests inside it (`usePagedHandover`) - the hero → the wizard.
   */
  pageFirst?: boolean;
};

/** Stacks `JourneyScene`s: tells each one whether it is first (nothing leaves before it), last, overlapping, leaving. */
export function ScrollJourney({
  children,
  className,
  overlapFirst = true,
  leaveLast = false,
  overlap = OVERLAP,
  morph,
  prelude = 0,
  pageFirst = false,
}: ScrollJourneyProps) {
  const scenes = Children.toArray(children).filter((child): child is ReactElement<JourneySceneProps> =>
    isValidElement(child)
  );
  const rootRef = useRef<HTMLDivElement>(null);
  // The two ends of the first hand-over: the first scene's flow top (its start marker) and the point where the
  // second is fully in - its start marker less the overlap its box is pulled up by, where `scrollToElement` lands a
  // hash inside it too. Measured when asked (the boxes are direct children of the root, each after its marker).
  const firstHandover = useCallback((): [number, number] | null => {
    const boxes = rootRef.current?.querySelectorAll<HTMLElement>(":scope > [data-journey-scene]");
    const first = boxes?.[0]?.previousElementSibling;
    const second = boxes?.[1];
    const marker = second?.previousElementSibling;
    if (!(first instanceof HTMLElement) || !second || !(marker instanceof HTMLElement)) return null;
    const overlapBy = parseFloat(second.dataset.journeyOverlap ?? "0") || 0;
    const start = first.getBoundingClientRect().top + window.scrollY;
    const end = marker.getBoundingClientRect().top + window.scrollY - overlapBy * window.innerHeight;
    return end > start ? [start, end] : null;
  }, []);
  usePagedHandover(pageFirst, firstHandover);
  // The scenes' arrivals summed (scene k fully in at k + 1) ... The sum is taken on the NEXT frame's pre-update
  // step, before anything derived from it is recomputed: an arrival changes in the pre-render step (it is derived
  // from the scroll), and a value derived from the sum that has already been recomputed in that step would not be
  // again - the backdrop would sit a step behind until the next scroll.
  const arrived = useMotionValue(0);
  const arrivals = useRef(new Map<number, MotionValue<number>>());
  // One registry object for the journey's life (state, not a ref: it is handed to the context during render).
  const [registry] = useState<JourneyRegistry>(() => ({
    register: (index, arrival) => {
      arrivals.current.set(index, arrival);
      const sum = () => {
        let total = 0;
        for (const mv of arrivals.current.values()) total += mv.get();
        arrived.set(total);
      };
      const recompute = () => frame.preUpdate(sum);
      const unsubscribe = arrival.on("change", recompute);
      recompute();
      return () => {
        unsubscribe();
        arrivals.current.delete(index);
        recompute();
      };
    },
  }));
  // ... plus the prelude: zero-height markers at the journey's head and tail. `approach` runs 0 → 1 while the head
  // marker climbs the last `prelude` viewports to the fold (raw scroll, no spring - it is a hand-over from outside),
  // `exit` 0 → 1 as the tail marker rises from the fold to mid-viewport (the footer coming up under the last scene).
  const headRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const approach = useFlowProgress(headRef, (top, _h, vh) => [top - (1 + Math.max(prelude, 0.01)) * vh, top - vh], [prelude]);
  const exit = useFlowProgress(tailRef, (top, _h, vh) => [top - vh, top - 0.5 * vh]);
  // Continuous journey position: -1 → 0 over the prelude, then the arrivals.
  const position = useTransform([arrived, approach], ([sum, q]: number[]) => sum + q - 1);
  // The canvas is up as soon as the prelude has begun and gone once the tail has cleared the fold.
  const canvasOpacity = useTransform([approach, exit], ([q, e]: number[]) => clamp01(q / 0.3) * (1 - e));
  const backdrops = scenes.map((scene) => scene.props.backdrop);
  const hasBackdrop = backdrops.some(Boolean) || Boolean(morph);
  // flow-root: a scene's negative margin must not collapse through to the container (it would move the markers).
  // z-10: level with the showcase, so a scene held over its tail paints on top.
  return (
    <JourneyRegistryContext.Provider value={registry}>
      <div ref={rootRef} className={cn("relative z-10 flow-root", className)}>
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
          })
        )}
        <div ref={tailRef} className="h-0" aria-hidden />
      </div>
    </JourneyRegistryContext.Provider>
  );
}
