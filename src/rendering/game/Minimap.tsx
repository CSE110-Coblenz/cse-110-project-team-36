import React, { useEffect, useRef, useState } from "react";
import type { GameState } from "../../game/models/game-state";
import type { Track } from "../../game/models/track";
import { worldToScreen, transformTrackPoints } from "./utils"; // not used directly; kept for familiarity

// Minimap: draws track + player + bots on a small canvas overlay
// Uses a precomputed projection from track world coords -> minimap pixel coords.
export function Minimap({
  gs,
  size = 160,
  padding = 6,
  position = "top-right",
  opacity = 0.9,
  enabled = true,
}: {
  gs: GameState;
  size?: number;
  padding?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  opacity?: number; // 0..1
  enabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sampledRef = useRef<{ x: number; y: number }[] | null>(null);
  const projRef = useRef<{ minX: number; minY: number; scale: number } | null>(null);
  const [dpr] = useState(() => window.devicePixelRatio || 1);

  // Build projection and sampled track points once when track changes
  useEffect(() => {
    const track: Track = gs.track;
    if (!track) return;

    // sample the track at fixed s-intervals (world units)
    const worldUnitSpacing = Math.max(0.5, track.length / 400); // sample at most ~400 points
    const samples: { x: number; y: number }[] = [];
    const trackLen = track.length;
    for (let s = 0; s <= trackLen; s += worldUnitSpacing) {
      const p = track.posAt(s);
      samples.push({ x: p.x, y: p.y });
    }

    // compute bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of samples) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    // compute scale to fit into size - 2*padding, maintaining aspect
    const avail = size - padding * 2;
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const scale = avail / Math.max(w, h);

    sampledRef.current = samples;
    projRef.current = { minX, minY, scale };
  }, [gs.track, size, padding]);

  // Draw loop: throttle with rAF, only when enabled
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // setup retina scaling
    const pixelSize = size * dpr;
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const draw = (t: number) => {
      // throttle to ~30 FPS
      if (t - last < 33) {
        raf = requestAnimationFrame(draw);
        return;
      }
      last = t;

      ctx.clearRect(0, 0, size, size);

      const samples = sampledRef.current;
      const proj = projRef.current;
      if (!samples || !proj) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const pad = 6;
      const cx = pad;
      const cy = pad;
      // background
      ctx.globalAlpha = opacity;
      ctx.fillStyle = "rgba(8,10,16,0.8)";
      ctx.fillRect(0, 0, size, size);
      ctx.globalAlpha = 1;

      // helper: world -> minimap pixel
      const worldToMinimap = (wx: number, wy: number) => {
        const x = (wx - proj.minX) * proj.scale + pad;
        // flip Y so world Y increasing maps visually (optional)
        const bboxHeight = (Math.max(...samples.map(s => s.y)) - proj.minY) || 1;
        const y = (wy - proj.minY) * proj.scale + pad;
        // clamp
        return { x: Math.max(0, Math.min(x, size)), y: Math.max(0, Math.min(y, size)) };
      };

      // track polyline
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const p = samples[i];
        const pt = worldToMinimap(p.x, p.y);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(200,200,220,0.9)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // draw cars: player + bots
      const cars = gs.getCars();
      for (let i = 0; i < cars.length; i++) {
        const car = cars[i];
        const p = gs.track.posAt(car.sPhys);
        const pt = worldToMinimap(p.x, p.y);
        ctx.beginPath();
        ctx.fillStyle = i === 0 ? "#22c55e" : "#ef4444"; // player = green, bots = red
        ctx.arc(pt.x, pt.y, i === 0 ? 4.0 : 3.0, 0, Math.PI * 2);
        ctx.fill();
        // small outline
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [gs, size, opacity, enabled, dpr]);

  // position style
  const posStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      position: "absolute",
      width: size,
      height: size,
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
      border: "2px solid rgba(255,255,255,0.06)",
      zIndex: 1200,
      touchAction: "none",
    };
    if (position === "top-right") return { ...base, top: 12, right: 12 };
    if (position === "top-left") return { ...base, top: 12, left: 12 };
    if (position === "bottom-right") return { ...base, bottom: 12, right: 12 };
    return { ...base, bottom: 12, left: 12 };
  })();

  if (!enabled) return null;

  return (
    <div aria-hidden style={posStyle}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

export default Minimap;
