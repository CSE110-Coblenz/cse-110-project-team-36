 import React, { useMemo } from "react";
 import type { Track } from "../../game/models/track";
 import type { Car } from "../../game/models/car";

 type MiniMapProps = {
   track: Track;
   cars: readonly Car[];
   playerCar: Car;
   width?: number;
   height?: number;
 };

 type Vec2 = { x: number; y: number };

 export const MiniMap: React.FC<MiniMapProps> = ({
   track,
   cars,
   playerCar,
   width = 210,
   height = 210,
 }) => {
   // Downsampled track samples + cached bounds for performance
   const { pointsAttr, center, scale } = useMemo(() => {
     const samples = track.getSamples();
     const raw: Vec2[] = [];

     // cap number of samples for perf
     const maxPts = 240;
     const step = Math.max(1, Math.floor(samples.length / maxPts));
     for (let i = 0; i < samples.length; i += step) {
       raw.push({ x: samples[i].x, y: samples[i].y });
     }

     if (raw.length === 0) {
       return { pointsAttr: "", center: { x: 0, y: 0 }, scale: 1 };
     }

     let minX = raw[0].x,
       maxX = raw[0].x,
       minY = raw[0].y,
       maxY = raw[0].y;
     for (const p of raw) {
       if (p.x < minX) minX = p.x;
       if (p.x > maxX) maxX = p.x;
       if (p.y < minY) minY = p.y;
       if (p.y > maxY) maxY = p.y;
     }

     const spanX = maxX - minX || 1;
     const spanY = maxY - minY || 1;
     const pad = 14; // inner padding in px
     const usableW = width - pad * 2;
     const usableH = height - pad * 2;
     const scale = Math.min(usableW / spanX, usableH / spanY);

     const center: Vec2 = {
       x: (minX + maxX) / 2,
       y: (minY + maxY) / 2,
     };

     const toScreen = (p: Vec2): Vec2 => ({
       x: (p.x - center.x) * scale + width / 2,
       y: (p.y - center.y) * scale + height / 2,
     });

     const pts: string[] = [];
     for (const p of raw) {
       const s = toScreen(p);
       pts.push(`${s.x.toFixed(1)},${s.y.toFixed(1)}`);
     }

     return {
       pointsAttr: pts.join(" "),
       center,
       scale,
     };
   }, [track, width, height]);

   const worldToMini = (wp: Vec2): Vec2 => ({
     x: (wp.x - center.x) * scale + width / 2,
     y: (wp.y - center.y) * scale + height / 2,
   });

   // Player + AI cars positions
   // Car dots: recompute every render so positions track physics updates
  const carDots = cars.map((car) => {
    const world = car.getWorldPosition(track, car.lateral);
    const p = worldToMini({ x: world.x, y: world.y });
    const isPlayer = car === playerCar;
    return {
      x: p.x,
      y: p.y,
      r: isPlayer ? 4.5 : 3,
      fill: isPlayer ? "#22c55e" : "#ef4444",
      stroke: "#0f172a",
    };
  });

   // Finish line marker at s = 0 (aligned with track’s world geometry)
   const finishLine = useMemo(() => {
     const s = 0;
     const centerPos = track.posAt(s);
     const normal = track.normalAt(s);
     const tangent = track.tangentAt(s);

     const halfWidth = track.width * 0.5;
     const halfThickness = Math.max(track.width / (track.numLanes * 6), 3);

     const cornersWorld: Vec2[] = [
       {
         x: centerPos.x + normal.x * halfWidth + tangent.x * halfThickness,
         y: centerPos.y + normal.y * halfWidth + tangent.y * halfThickness,
       },
       {
         x: centerPos.x - normal.x * halfWidth + tangent.x * halfThickness,
         y: centerPos.y - normal.y * halfWidth + tangent.y * halfThickness,
       },
       {
         x: centerPos.x - normal.x * halfWidth - tangent.x * halfThickness,
         y: centerPos.y - normal.y * halfWidth - tangent.y * halfThickness,
       },
       {
         x: centerPos.x + normal.x * halfWidth - tangent.x * halfThickness,
         y: centerPos.y + normal.y * halfWidth - tangent.y * halfThickness,
       },
     ];

     const mapped = cornersWorld.map(worldToMini);
     const d = mapped
       .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
       .join(" ") + " Z";

     return d;
   }, [track, center, scale]);

   return (
     <div
       aria-label="Mini map"
       style={{
         position: "absolute",
         right: 12,
         bottom: 12,
         zIndex: 10000,
         fontFamily: '"Baloo 2", system-ui, sans-serif',
       }}
     >
       <div
         style={{
           background:
             "linear-gradient(180deg, rgba(15,15,30,0.95), rgba(30,30,60,0.95))",
           border: "3px solid #fff",
           borderRadius: 18,
           padding: "8px 10px 10px",
           color: "#fff",
           boxShadow:
             "0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.08)",
           minWidth: width,
           maxWidth: width,
           animation: "hudPulse 2s infinite",
         }}
       >
         <div
           style={{
             display: "flex",
             justifyContent: "space-between",
             alignItems: "center",
             marginBottom: 4,
           }}
         >
           <span
             style={{
               fontSize: "0.85rem",
               fontWeight: 900,
               color: "#ffd6a8",
               textShadow: "0 0 4px #000",
               letterSpacing: "0.06em",
             }}
           >
             MINIMAP
           </span>
           <span
             style={{
               fontSize: "0.7rem",
               color: "#9ca3af",
             }}
           >
             You <span style={{ color: "#22c55e" }}>●</span>{" "}
             Bots <span style={{ color: "#ef4444" }}>●</span>
           </span>
         </div>

         <svg
           width={width}
           height={height}
           viewBox={`0 0 ${width} ${height}`}
           style={{
             display: "block",
             borderRadius: 12,
             background:
               "radial-gradient(circle at 30% 20%, #1e293b, #020617 70%)",
           }}
         >
           {/* Track outline */}
           {pointsAttr && (
             <polyline
               points={pointsAttr}
               fill="none"
               stroke="#64748b"
               strokeWidth={3}
             />
           )}

           {/* Finish line stripe */}
           <path
             d={finishLine}
             fill="#f9fafb"
             stroke="#0f172a"
             strokeWidth={0.6}
             opacity={0.95}
           />

           {/* Cars */}
           {carDots.map((dot, idx) => (
             <circle
               key={idx}
               cx={dot.x}
               cy={dot.y}
               r={dot.r}
               fill={dot.fill}
               stroke={dot.stroke}
               strokeWidth={1}
             />
           ))}
         </svg>
       </div>

       <style>{`
         @keyframes hudPulse {
           0%,100% {
             box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.08);
           }
           50% {
             box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 34px rgba(255,255,255,0.18);
           }
         }
         @media (prefers-reduced-motion: reduce) {
           * { animation: none !important; transition: none !important; }
         }
       `}</style>
     </div>
   );
 };