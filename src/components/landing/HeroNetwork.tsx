"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient knowledge-graph backdrop for the hero: glowing nodes that drift
 * slowly and link up with faint dashed edges whenever they come close.
 *
 * Purely decorative — it sits behind the hero copy, never takes pointer
 * events, and renders a single static frame when the visitor prefers
 * reduced motion.
 */

type Node = {
  /** normalised 0–1 position, so the layout scales with the section */
  x: number;
  y: number;
  /** normalised units per second */
  vx: number;
  vy: number;
  radius: number;
  color: string;
  /** hubs get a wider halo and a bright core */
  hub: boolean;
};

const PALETTE = [
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#22d3ee", // cyan
  "#f59e0b", // amber
];

const NODE_COUNT = 42;
const HUB_COUNT = 8;
/** normalised distance under which two nodes are linked */
const LINK_DISTANCE = 0.26;
/** keeps the middle of the canvas clear so the headline stays legible */
const CLEAR_ZONE = { x: 0.33, y: 0.4 };

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

function createNodes(): Node[] {
  const random = mulberry32(20260927);
  const nodes: Node[] = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    let x = random();
    let y = random();

    // Push anything that lands over the copy out towards the edges.
    const dx = (x - 0.5) / CLEAR_ZONE.x;
    const dy = (y - 0.5) / CLEAR_ZONE.y;
    const spread = Math.hypot(dx, dy);
    if (spread < 1) {
      const push = (1 + random() * 0.45) / (spread || 0.001);
      x = 0.5 + dx * CLEAR_ZONE.x * push;
      y = 0.5 + dy * CLEAR_ZONE.y * push;
    }

    const hub = i < HUB_COUNT;
    nodes.push({
      x: Math.min(0.98, Math.max(0.02, x)),
      y: Math.min(0.98, Math.max(0.02, y)),
      vx: (random() - 0.5) * 0.009,
      vy: (random() - 0.5) * 0.009,
      radius: hub ? 4.5 + random() * 2.5 : 1.6 + random() * 1.8,
      color: PALETTE[Math.floor(random() * PALETTE.length)],
      hub,
    });
  }

  return nodes;
}

export function HeroNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nodes = createNodes();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function step(delta: number) {
      for (const node of nodes) {
        node.x += node.vx * delta;
        node.y += node.vy * delta;

        // Drift back inside instead of wrapping, so nothing pops.
        if (node.x < 0.02 || node.x > 0.98) {
          node.vx *= -1;
          node.x = Math.min(0.98, Math.max(0.02, node.x));
        }
        if (node.y < 0.02 || node.y > 0.98) {
          node.vy *= -1;
          node.y = Math.min(0.98, Math.max(0.02, node.y));
        }
      }
    }

    function draw() {
      if (!width || !height) return;
      const context = ctx!;
      context.clearRect(0, 0, width, height);

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
          context.strokeStyle = `rgba(129, 140, 248, ${(0.28 * fade).toFixed(3)})`;
          context.beginPath();
          context.moveTo(a.x * width, a.y * height);
          context.lineTo(b.x * width, b.y * height);
          context.stroke();
        }
      }
      context.restore();

      for (const node of nodes) {
        const cx = node.x * width;
        const cy = node.y * height;
        const halo = node.radius * (node.hub ? 6 : 4);

        const glow = context.createRadialGradient(cx, cy, 0, cx, cy, halo);
        glow.addColorStop(0, `${node.color}${node.hub ? "66" : "33"}`);
        glow.addColorStop(1, `${node.color}00`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(cx, cy, halo, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = node.color;
        context.globalAlpha = node.hub ? 0.9 : 0.55;
        context.beginPath();
        context.arc(cx, cy, node.radius, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;

        // Bright core turns the larger nodes into rings, as in the design.
        if (node.hub) {
          context.fillStyle = "rgba(255, 255, 255, 0.92)";
          context.beginPath();
          context.arc(cx, cy, node.radius * 0.42, 0, Math.PI * 2);
          context.fill();
        }
      }
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
      frame = requestAnimationFrame(loop);
    }

    return () => {
      observer.disconnect();
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
