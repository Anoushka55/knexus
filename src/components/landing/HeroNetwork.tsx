"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient knowledge-graph backdrop for the hero: glowing nodes that drift
 * slowly, link up with faint dashed edges whenever they come close, and
 * occasionally pass a signal along one of those links.
 *
 * Purely decorative — it sits behind the hero copy, never takes pointer
 * events, and settles into a single static frame when the visitor prefers
 * reduced motion.
 */

type Node = {
  /** normalised 0–1 position, so the layout scales with the section */
  x: number;
  y: number;
  /** normalised units per second */
  vx: number;
  vy: number;
  /** radius of the coloured core, in device-independent pixels */
  radius: number;
  color: string;
  /** hubs get a wider halo, stronger links and their own breathing rhythm */
  hub: boolean;
  /** draws the white collar that turns a plain dot into an orb */
  ring: boolean;
  phase: number;
  /** pre-rendered glow, so no gradient is rebuilt per frame */
  sprite: HTMLCanvasElement | null;
  spriteRadius: number;
};

type Pulse = { from: number; to: number; progress: number; speed: number };

const PALETTE = [
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#22d3ee", // cyan
  "#f59e0b", // amber
];

const NODE_COUNT = 46;
const HUB_COUNT = 7;
/** mid-sized orbs: same treatment as a hub, without the pull of one */
const MID_COUNT = 13;
/**
 * An orb is a bullseye, measured outwards in multiples of the core radius:
 * a coloured annulus, a white gap, then the core dot itself.
 */
const ORB = { outer: 3.6, collar: 2.6 };
/** normalised distance under which two nodes are linked */
const LINK_DISTANCE = 0.24;
/** ellipse around the hero copy that nodes are pushed out of */
const CLEAR_ZONE = { x: 0.3, y: 0.4 };
/** how far apart placement tries to keep things, in normalised units */
const MIN_SEPARATION = { hubHub: 0.26, hubDot: 0.09, dotDot: 0.06 };
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MAX_PULSES = 3;

/** Deterministic PRNG so the layout looks the same on every load. */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shoves a point outside the copy ellipse, along the direction it already sits in. */
function clearCentre(x: number, y: number, slack: number) {
  const dx = (x - 0.5) / CLEAR_ZONE.x;
  const dy = (y - 0.5) / CLEAR_ZONE.y;
  const spread = Math.hypot(dx, dy) || 0.001;
  if (spread >= slack) return { x, y };
  const push = slack / spread;
  return {
    x: 0.5 + dx * CLEAR_ZONE.x * push,
    y: 0.5 + dy * CLEAR_ZONE.y * push,
  };
}

function separation(a: Node, b: Node) {
  if (a.hub && b.hub) return MIN_SEPARATION.hubHub;
  if (a.hub || b.hub) return MIN_SEPARATION.hubDot;
  return MIN_SEPARATION.dotDot;
}

function createNodes(): Node[] {
  const random = mulberry32(20260927);
  const nodes: Node[] = [];

  // Hubs go down first, fanned around the copy by the golden angle so no two
  // of them end up in the same corner.
  for (let i = 0; i < HUB_COUNT; i++) {
    const angle = i * GOLDEN_ANGLE + random() * 0.5;
    const reach = 1.12 + random() * 0.35;
    nodes.push({
      x: 0.5 + Math.cos(angle) * CLEAR_ZONE.x * reach,
      // Damped vertically: the hero is far wider than it is tall, so a full
      // reach would pin most hubs flat against the top and bottom edges.
      y: 0.5 + Math.sin(angle) * CLEAR_ZONE.y * reach * 0.78,
      vx: (random() - 0.5) * 0.006,
      vy: (random() - 0.5) * 0.006,
      radius: 4 + random() * 1.6,
      color: PALETTE[i % PALETTE.length],
      hub: true,
      ring: true,
      phase: random() * Math.PI * 2,
      sprite: null,
      spriteRadius: 0,
    });
  }

  for (let i = HUB_COUNT; i < NODE_COUNT; i++) {
    const placed = clearCentre(random(), random(), 1 + random() * 0.5);
    // The next band are smaller orbs; the tail are bare dots, which keeps the
    // field from reading as one uniform texture.
    const mid = i < HUB_COUNT + MID_COUNT;
    nodes.push({
      x: placed.x,
      y: placed.y,
      vx: (random() - 0.5) * 0.011,
      vy: (random() - 0.5) * 0.011,
      radius: mid ? 1.9 + random() * 0.9 : 1.3 + random() * 0.9,
      color: PALETTE[Math.floor(random() * PALETTE.length)],
      hub: false,
      ring: mid,
      phase: random() * Math.PI * 2,
      sprite: null,
      spriteRadius: 0,
    });
  }

  // A few relaxation passes break up any remaining clumps.
  for (let pass = 0; pass < 14; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const min = separation(a, b);
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (distance >= min) continue;

        if (distance < 1e-4) {
          dx = (random() - 0.5) * 1e-3;
          dy = (random() - 0.5) * 1e-3;
        }
        const scale = ((min - distance) / (distance || 1e-4)) * 0.5;
        // Hubs carry more weight, so dots yield to them rather than the reverse.
        const aShare = b.hub && !a.hub ? 1 : a.hub && !b.hub ? 0 : 0.5;
        a.x -= dx * scale * aShare * 2;
        a.y -= dy * scale * aShare * 2;
        b.x += dx * scale * (1 - aShare) * 2;
        b.y += dy * scale * (1 - aShare) * 2;
      }
    }

    for (const node of nodes) {
      const cleared = clearCentre(node.x, node.y, node.hub ? 1.12 : 1);
      node.x = Math.min(0.97, Math.max(0.03, cleared.x));
      node.y = Math.min(0.96, Math.max(0.04, cleared.y));
    }
  }

  return nodes;
}

/**
 * Bakes a node into a small canvas once, up front — no gradient is rebuilt per
 * frame. An orb is stacked outwards: a soft halo, a saturated annulus, a white
 * gap punched out of it, then the core dot at the centre.
 */
function buildSprite(node: Node) {
  const outer = node.ring ? node.radius * ORB.outer : node.radius;
  const halo = outer * (node.hub ? 2.6 : node.ring ? 2.4 : 3.6);
  const size = Math.ceil(halo * 2);
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;

  const paint = sprite.getContext("2d");
  if (!paint) return;

  const centre = size / 2;
  const disc = (radius: number) => {
    paint.beginPath();
    paint.arc(centre, centre, radius, 0, Math.PI * 2);
    paint.fill();
  };

  const glow = paint.createRadialGradient(centre, centre, 0, centre, centre, halo);
  if (node.ring) {
    // A pale rim sits where the annulus ends, so the ring reads as lit from
    // within rather than dropped onto the glow.
    const edge = outer / halo;
    glow.addColorStop(0, `${node.color}55`);
    glow.addColorStop(edge * 0.9, `${node.color}44`);
    glow.addColorStop(edge * 1.04, "rgba(255, 255, 255, 0.55)");
    glow.addColorStop(edge * 1.35, `${node.color}2a`);
    glow.addColorStop(1, `${node.color}00`);
  } else {
    glow.addColorStop(0, `${node.color}3d`);
    glow.addColorStop(0.4, `${node.color}22`);
    glow.addColorStop(1, `${node.color}00`);
  }
  paint.fillStyle = glow;
  disc(halo);

  if (node.ring) {
    // The annulus, then the white gap that cuts it back to a ring.
    paint.fillStyle = node.color;
    disc(outer);

    paint.fillStyle = "rgba(255, 255, 255, 0.97)";
    disc(node.radius * ORB.collar);
  }

  paint.globalAlpha = node.ring ? 1 : 0.62;
  paint.fillStyle = node.color;
  disc(node.radius);
  paint.globalAlpha = 1;

  node.sprite = sprite;
  node.spriteRadius = halo;
}

export function HeroNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nodes = createNodes();
    nodes.forEach(buildSprite);

    const pulses: Pulse[] = [];
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let elapsed = 0;
    // Pointer parallax, eased towards the cursor rather than snapped to it.
    let pointerX = 0;
    let pointerY = 0;
    let driftX = 0;
    let driftY = 0;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function handlePointer(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / (rect.width || 1) - 0.5;
      pointerY = (event.clientY - rect.top) / (rect.height || 1) - 0.5;
    }

    function linked(a: Node, b: Node) {
      return Math.hypot(a.x - b.x, a.y - b.y) <= LINK_DISTANCE;
    }

    function spawnPulse() {
      const from = Math.floor(Math.random() * nodes.length);
      const candidates: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        if (i !== from && linked(nodes[from], nodes[i])) candidates.push(i);
      }
      if (!candidates.length) return;
      pulses.push({
        from,
        to: candidates[Math.floor(Math.random() * candidates.length)],
        progress: 0,
        speed: 0.35 + Math.random() * 0.4,
      });
    }

    function step(delta: number) {
      elapsed += delta;
      driftX += ((pointerX * 0.014) - driftX) * Math.min(1, delta * 2.5);
      driftY += ((pointerY * 0.01) - driftY) * Math.min(1, delta * 2.5);

      for (const node of nodes) {
        node.x += node.vx * delta;
        node.y += node.vy * delta;

        // Steer back inside instead of wrapping, so nothing pops.
        if (node.x < 0.03 || node.x > 0.97) {
          node.vx *= -1;
          node.x = Math.min(0.97, Math.max(0.03, node.x));
        }
        if (node.y < 0.04 || node.y > 0.96) {
          node.vy *= -1;
          node.y = Math.min(0.96, Math.max(0.04, node.y));
        }
      }

      // Keep the hubs from drifting back into a clump over time.
      for (let i = 0; i < HUB_COUNT; i++) {
        for (let j = i + 1; j < HUB_COUNT; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          if (distance >= MIN_SEPARATION.hubHub || distance < 1e-4) continue;
          const nudge = (MIN_SEPARATION.hubHub - distance) * 0.35 * delta;
          a.vx -= (dx / distance) * nudge;
          a.vy -= (dy / distance) * nudge;
          b.vx += (dx / distance) * nudge;
          b.vy += (dy / distance) * nudge;
        }
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].progress += pulses[i].speed * delta;
        if (
          pulses[i].progress >= 1 ||
          !linked(nodes[pulses[i].from], nodes[pulses[i].to])
        ) {
          pulses.splice(i, 1);
        }
      }
      if (pulses.length < MAX_PULSES && Math.random() < delta * 0.9) {
        spawnPulse();
      }
    }

    function draw() {
      if (!width || !height) return;
      const context = ctx!;
      context.clearRect(0, 0, width, height);

      const px = (node: Node) => (node.x + driftX * (node.hub ? 1 : 0.45)) * width;
      const py = (node: Node) => (node.y + driftY * (node.hub ? 1 : 0.45)) * height;

      // Edges first, so nodes always sit on top of their own links.
      context.save();
      context.setLineDash([3, 6]);
      context.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance > LINK_DISTANCE) continue;

          const fade = 1 - distance / LINK_DISTANCE;
          context.strokeStyle = `rgba(129, 140, 248, ${(0.3 * fade).toFixed(3)})`;
          context.beginPath();
          context.moveTo(px(a), py(a));
          context.lineTo(px(b), py(b));
          context.stroke();
        }
      }
      context.restore();

      for (const pulse of pulses) {
        const a = nodes[pulse.from];
        const b = nodes[pulse.to];
        const x = px(a) + (px(b) - px(a)) * pulse.progress;
        const y = py(a) + (py(b) - py(a)) * pulse.progress;
        // Fade in and out so the signal never blinks on or off abruptly.
        const strength = Math.sin(pulse.progress * Math.PI);

        context.globalAlpha = strength * 0.75;
        context.fillStyle = a.color;
        context.beginPath();
        context.arc(x, y, 2.4, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = strength * 0.3;
        context.beginPath();
        context.arc(x, y, 6, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;
      }

      for (const node of nodes) {
        if (!node.sprite) continue;
        // Orbs breathe slightly, hubs most of all; bare dots hold steady.
        context.globalAlpha = node.hub
          ? 0.84 + Math.sin(elapsed * 0.9 + node.phase) * 0.16
          : node.ring
            ? 0.9 + Math.sin(elapsed * 0.7 + node.phase) * 0.1
            : 0.85;
        context.drawImage(
          node.sprite,
          px(node) - node.spriteRadius,
          py(node) - node.spriteRadius,
        );
      }
      context.globalAlpha = 1;

      // Finally, soften everything sitting behind the headline and search bar
      // so the copy always reads cleanly, wherever the nodes have drifted.
      context.save();
      context.globalCompositeOperation = "destination-out";
      context.translate(width * 0.5, height * 0.46);
      context.scale(1, (height * 0.36) / (width * 0.44));
      const mask = context.createRadialGradient(0, 0, 0, 0, 0, width * 0.44);
      mask.addColorStop(0, "rgba(0, 0, 0, 0.92)");
      mask.addColorStop(0.55, "rgba(0, 0, 0, 0.6)");
      mask.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = mask;
      context.beginPath();
      context.arc(0, 0, width * 0.44, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    resize();
    draw();

    const observer = new ResizeObserver(() => {
      resize();
      draw();
    });
    observer.observe(canvas);

    let frame = 0;
    let last = 0;

    function loop(now: number) {
      // Clamp so a backgrounded tab doesn't resume with one giant jump.
      const delta = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      step(delta);
      draw();
      frame = requestAnimationFrame(loop);
    }

    if (!reduceMotion) {
      window.addEventListener("pointermove", handlePointer, { passive: true });
      frame = requestAnimationFrame(loop);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", handlePointer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
