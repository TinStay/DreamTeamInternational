"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * The English hero's background: a near-black tiger whose eyes burn from the start, and a "wet" trail that follows
 * the pointer and reveals the fur under it (a WebGL ping-pong simulation - advected, blurred, decaying - composited
 * over the photo with refraction, a chromatic split and a caustic sheen on the trail's edges). Still visitors and
 * touch screens get an idle "ghost" hand after a few seconds. Ported from the client's `dreamteam-hero-tiger.html`.
 * Without WebGL the dimmed photo stays as the background.
 */

const IMAGE_SRC = "/hero-tiger/tiger-eyes.jpg";
const IMG_ASPECT = 1920 / 1072;
/** Eye centres in image UV (y down). */
const EYES: [number, number][] = [
  [0.231, 0.448],
  [0.768, 0.448],
];
/** How long the reveal lingers (closer to 1 = longer). */
const TRAIL_DECAY = 0.972;
/** Reveal radius, as a fraction of the screen height. */
const BRUSH = 0.11;

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const NOISE = `
  vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453);}
  float noise(vec2 p){const float K1=.366025404,K2=.211324865;
    vec2 i=floor(p+(p.x+p.y)*K1),a=p-i+(i.x+i.y)*K2;float m=step(a.y,a.x);
    vec2 o=vec2(m,1.-m),b=a-o+K2,c=a-1.+2.*K2;
    vec3 h=max(.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.);
    vec3 n=h*h*h*h*vec3(dot(a,hash(i)),dot(b,hash(i+o)),dot(c,hash(i+1.)));
    return dot(n,vec3(70.));}
`;

// Trail simulation: advected, blurred, decaying "wet" mask.
const SIM = `precision highp float;
  uniform sampler2D uPrev; uniform vec2 uRes; uniform vec2 uA; uniform vec2 uB;
  uniform float uStrength; uniform float uRadius; uniform float uTime; uniform float uDecay;
  ${NOISE}
  float segDist(vec2 p, vec2 a, vec2 b){vec2 pa=p-a, ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.);return length(pa-ba*h);}
  void main(){
    vec2 uv=gl_FragCoord.xy/uRes; float asp=uRes.x/uRes.y; vec2 px=1./uRes;
    vec2 q=uv*vec2(asp,1.)*2.2;
    vec2 flow=vec2(noise(q+vec2(0.,uTime*.15)), noise(q+vec2(7.3,-uTime*.15)));
    vec2 st=uv-flow*px*2.2+vec2(0.,px.y*.35);
    float v=texture2D(uPrev,st).r*.6
      +(texture2D(uPrev,st+vec2(px.x,0.)).r+texture2D(uPrev,st-vec2(px.x,0.)).r
       +texture2D(uPrev,st+vec2(0.,px.y)).r+texture2D(uPrev,st-vec2(0.,px.y)).r)*.1;
    v=max(v*uDecay-.0025,0.);
    float d=segDist(uv*vec2(asp,1.),uA*vec2(asp,1.),uB*vec2(asp,1.));
    float wob=1.+.35*noise(uv*9.+uTime);
    v+=uStrength*exp(-pow(d/(uRadius*wob),2.));
    gl_FragColor=vec4(min(v,1.),0.,0.,1.);
  }`;

const FINAL = `precision highp float;
  uniform sampler2D uImg; uniform sampler2D uTrail; uniform vec2 uRes; uniform vec2 uTrailRes;
  uniform vec2 uScale; uniform vec2 uCenter; uniform float uTime; uniform float uIntro;
  uniform vec2 uEye0; uniform vec2 uEye1; uniform float uImgAsp;
  ${NOISE}
  vec2 toImg(vec2 s){ return (s-uCenter)*uScale+.5; }
  vec3 img(vec2 s){ vec2 u=toImg(s);
    float inside=smoothstep(0.,.06,u.x)*smoothstep(1.,.94,u.x)*smoothstep(0.,.15,u.y)*smoothstep(1.,.85,u.y);
    return texture2D(uImg,clamp(u,0.,1.)).rgb*inside; }
  float eyeMask(vec2 s){ vec2 u=toImg(s);
    float d0=length((u-uEye0)*vec2(uImgAsp,1.)), d1=length((u-uEye1)*vec2(uImgAsp,1.));
    return smoothstep(.15,.055,min(d0,d1)); }
  void main(){
    vec2 fc=gl_FragCoord.xy/uRes;
    vec2 s=vec2(fc.x,1.-fc.y);
    vec2 tp=2.5/uTrailRes;
    float t =texture2D(uTrail,fc).r;
    float tx=texture2D(uTrail,fc+vec2(tp.x,0.)).r-texture2D(uTrail,fc-vec2(tp.x,0.)).r;
    float ty=texture2D(uTrail,fc+vec2(0.,tp.y)).r-texture2D(uTrail,fc-vec2(0.,tp.y)).r;
    vec2 grad=vec2(tx,-ty);

    float n1=noise(s*vec2(uRes.x/uRes.y,1.)*5.+uTime*.35);
    float n2=noise(s*vec2(uRes.x/uRes.y,1.)*5.+17.+uTime*.35);
    vec2 amb=vec2(noise(s*2.+uTime*.05),noise(s*2.+9.-uTime*.05))*.0025;
    vec2 off=grad*.05+vec2(n1,n2)*.014*t+amb;

    float ca=.0012*t;
    vec3 col=vec3(img(s+off+vec2(ca,0.)).r, img(s+off).g, img(s+off-vec2(ca,0.)).b);

    float reveal=smoothstep(.03,.55,t);
    float eyes=eyeMask(s+off);
    float pulse=.88+.12*sin(uTime*1.6)+.05*sin(uTime*4.3);

    vec3 dark=col*vec3(.07,.075,.09);
    vec3 lit=pow(col,vec3(.92))*vec3(1.08,1.02,1.1)*1.25;
    vec3 outc=mix(dark,lit,reveal);

    vec3 eyeCol=col*vec3(1.25,1.14,.6)*pulse*uIntro;
    float lum=dot(col,vec3(.3,.59,.11));
    outc=mix(outc,max(outc,eyeCol),eyes*smoothstep(.08,.35,lum));
    outc+=vec3(1.,.72,.2)*eyes*.035*pulse*uIntro;

    float edge=clamp(length(grad)*6.,0.,1.);
    outc+=edge*vec3(.55,.62,.75)*.14*(.6+.4*n1);

    vec2 v=fc-.5; outc*=1.-dot(v,v)*.9;
    outc+=(fract(sin(dot(gl_FragCoord.xy+uTime,vec2(12.9898,78.233)))*43758.5453)-.5)*.025;
    gl_FragColor=vec4(outc,1.);
  }`;

type Program = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
type Target = { t: WebGLTexture; f: WebGLFramebuffer };

export function TigerReveal({
  areaRef,
  onWake,
}: {
  /** The element the pointer is tracked over and the canvas is sized to (the hero section). */
  areaRef: RefObject<HTMLElement | null>;
  /** Called once, on the visitor's first pointer move over the area. */
  onWake?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onWakeRef = useRef(onWake);

  useEffect(() => {
    onWakeRef.current = onWake;
  }, [onWake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const area = areaRef.current;
    if (!canvas || !area) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) {
      canvas.hidden = true;
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const program = (fs: string): Program => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, "p");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "program");
      const u: Program["u"] = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < n; i++) {
        const a = gl.getActiveUniform(p, i);
        if (a) u[a.name] = gl.getUniformLocation(p, a.name);
      }
      return { p, u };
    };

    let sim: Program;
    let fin: Program;
    try {
      sim = program(SIM);
      fin = program(FINAL);
    } catch (e) {
      console.error(e);
      canvas.hidden = true;
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = (w: number, h: number, data?: HTMLImageElement) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (data) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return t;
    };
    const target = (w: number, h: number): Target => {
      const t = tex(w, h);
      const f = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { t, f };
    };
    const dropTarget = (x: Target | null) => {
      if (!x) return;
      gl.deleteTexture(x.t);
      gl.deleteFramebuffer(x.f);
    };

    let W = 0;
    let H = 0;
    let TW = 0;
    let TH = 0;
    let A: Target | null = null;
    let B: Target | null = null;
    let imgTex: WebGLTexture | null = null;
    const scale = [1, 1];
    const center = [0.5, 0.5];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const r = area.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W;
      canvas.height = H;
      TW = Math.max(1, Math.round(W / 4));
      TH = Math.max(1, Math.round(H / 4));
      dropTarget(A);
      dropTarget(B);
      A = target(TW, TH);
      B = target(TW, TH);
      // "cover", but never crop so hard that an eye leaves the screen
      const a = W / H;
      if (a >= IMG_ASPECT) {
        scale[0] = 1;
        scale[1] = IMG_ASPECT / a;
        center[1] = 0.5;
      } else {
        const vis = Math.max(a / IMG_ASPECT, 0.8);
        scale[0] = vis;
        scale[1] = (vis * IMG_ASPECT) / a;
        center[1] = a < 1 ? 0.36 : 0.45;
      }
      center[0] = 0.5;
    };

    // Pointer, in the area's UV (y up).
    const m = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, last: performance.now() };
    let woke = false;
    const setPointer = (cx: number, cy: number) => {
      const r = area.getBoundingClientRect();
      if (cy < r.top || cy > r.bottom) return;
      m.x = (cx - r.left) / r.width;
      m.y = 1 - (cy - r.top) / r.height;
      m.last = performance.now();
      if (!woke) {
        woke = true;
        onWakeRef.current?.();
      }
    };
    const onPointer = (e: PointerEvent) => setPointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setPointer(t.clientX, t.clientY);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    let start = performance.now();
    let prev = performance.now();
    let visible = true;
    let disposed = false;

    const im = new Image();
    im.onload = () => {
      if (disposed) return;
      imgTex = tex(0, 0, im);
      start = performance.now();
    };
    im.src = IMAGE_SRC;

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(area);
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    });
    ro.observe(area);
    resize();

    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || !imgTex || !A || !B) return;
      const dt = Math.min((now - prev) / 16.67, 3);
      prev = now;
      const time = (now - start) / 1000;

      // idle "ghost" hand so touch screens and still visitors still see the water
      if (!reduceMotion && now - m.last > 2600) {
        const k = time * 0.45;
        m.x = 0.5 + Math.sin(k) * 0.28 + Math.sin(k * 2.3) * 0.06;
        m.y = 0.55 + Math.cos(k * 0.8) * 0.14;
      }
      const dx = (m.x - m.px) * (W / H);
      const dy = m.y - m.py;
      const speed = Math.hypot(dx, dy);
      const strength = Math.min(speed * 9, 0.55) * Math.min(dt, 1.5);

      // simulation step
      gl.useProgram(sim.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, B.f);
      gl.viewport(0, 0, TW, TH);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, A.t);
      gl.uniform1i(sim.u.uPrev, 0);
      gl.uniform2f(sim.u.uRes, TW, TH);
      gl.uniform2f(sim.u.uA, m.px, m.py);
      gl.uniform2f(sim.u.uB, m.x, m.y);
      gl.uniform1f(sim.u.uStrength, strength);
      gl.uniform1f(sim.u.uRadius, BRUSH * (1 + Math.min(speed * 4, 0.6)));
      gl.uniform1f(sim.u.uTime, time);
      gl.uniform1f(sim.u.uDecay, Math.pow(TRAIL_DECAY, dt));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      [A, B] = [B, A];
      m.px = m.x;
      m.py = m.y;

      // composite
      gl.useProgram(fin.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.uniform1i(fin.u.uImg, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, A.t);
      gl.uniform1i(fin.u.uTrail, 1);
      gl.uniform2f(fin.u.uRes, W, H);
      gl.uniform2f(fin.u.uTrailRes, TW, TH);
      gl.uniform2f(fin.u.uScale, scale[0], scale[1]);
      gl.uniform2f(fin.u.uCenter, center[0], center[1]);
      gl.uniform1f(fin.u.uTime, reduceMotion ? 0 : time);
      gl.uniform1f(fin.u.uIntro, Math.min(1, Math.max(0, (time - 0.3) / 1.4))); // eyes open on load
      gl.uniform2f(fin.u.uEye0, EYES[0][0], EYES[0][1]);
      gl.uniform2f(fin.u.uEye1, EYES[1][0], EYES[1][1]);
      gl.uniform1f(fin.u.uImgAsp, IMG_ASPECT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      dropTarget(A);
      dropTarget(B);
      if (imgTex) gl.deleteTexture(imgTex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(sim.p);
      gl.deleteProgram(fin.p);
    };
  }, [areaRef]);

  return (
    <>
      {/* No-WebGL fallback: the photo, dimmed. */}
      <div
        className="absolute inset-0 -z-30 bg-black bg-[url(/hero-tiger/tiger-eyes.jpg)] bg-cover bg-center bg-no-repeat brightness-[0.35]"
        aria-hidden
      />
      <canvas ref={canvasRef} className="absolute inset-0 -z-20 block h-full w-full" aria-hidden />
    </>
  );
}
