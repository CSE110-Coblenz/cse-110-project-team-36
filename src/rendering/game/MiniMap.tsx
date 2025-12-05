import React from 'react';
import type { Track } from '../../game/models/track';
import type { Car } from '../../game/models/car';

type MiniMapProps = {
    track: Track;
    cars: readonly Car[];
    playerCar: Car;
    width?: number;
    height?: number;
};

export const MiniMap: React.FC<MiniMapProps> = ({
    track,
    cars,
    playerCar,
    width = 210,
    height = 210,
}) => {
    const samples = track.getSamples();
    if (!samples.length) return null;

    // 1) Collect track points (downsampled) and bounds (track + cars)
    const trackPoints: { x: number; y: number }[] = [];
    const bounds: { x: number; y: number }[] = [];

    const maxPts = 240;
    const step = Math.max(1, Math.floor(samples.length / maxPts));

    for (let i = 0; i < samples.length; i += step) {
        const p = { x: samples[i].x, y: samples[i].y };
        trackPoints.push(p);
        bounds.push(p);
    }

    for (const car of cars) {
        const w = car.getWorldPosition(track, car.lateral);
        bounds.push({ x: w.x, y: w.y });
    }

    // 2) Compute bounding box and scale
    let minX = bounds[0].x,
        maxX = bounds[0].x,
        minY = bounds[0].y,
        maxY = bounds[0].y;

    for (const p of bounds) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const pad = 14;
    const usableW = width - pad * 2;
    const usableH = height - pad * 2;
    const scale = Math.min(usableW / spanX, usableH / spanY);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const worldToMini = (x: number, y: number) => ({
        x: (x - centerX) * scale + width / 2,
        y: (y - centerY) * scale + height / 2,
    });

    // 3) SVG points for track polyline
    const pointsAttr = trackPoints
        .map((p) => {
            const s = worldToMini(p.x, p.y);
            return `${s.x.toFixed(1)},${s.y.toFixed(1)}`;
        })
        .join(' ');

    // 4) Car dots
    const carDots = cars.map((car) => {
        const w = car.getWorldPosition(track, car.lateral);
        const p = worldToMini(w.x, w.y);
        const isPlayer = car === playerCar;
        return {
            x: p.x,
            y: p.y,
            r: isPlayer ? 4.5 : 3,
            fill: isPlayer ? '#22c55e' : '#ef4444',
        };
    });

    return (
        <div
            aria-label="Mini map"
            style={{
                position: 'absolute',
                right: 12,
                bottom: 12,
                zIndex: 10000,
                fontFamily: '"Baloo 2", system-ui, sans-serif',
            }}
        >
            <div
                style={{
                    background:
                        'linear-gradient(180deg, rgba(15,15,30,0.95), rgba(30,30,60,0.95))',
                    border: '3px solid #fff',
                    borderRadius: 18,
                    padding: '8px 10px 10px',
                    color: '#fff',
                    boxShadow:
                        '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.08)',
                    minWidth: width,
                    maxWidth: width,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 900,
                            color: '#ffd6a8',
                            textShadow: '0 0 4px #000',
                            letterSpacing: '0.06em',
                        }}
                    >
                        MINIMAP
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                        You <span style={{ color: '#22c55e' }}>●</span> Bots{' '}
                        <span style={{ color: '#ef4444' }}>●</span>
                    </span>
                </div>

                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    style={{
                        display: 'block',
                        borderRadius: 12,
                        background:
                            'radial-gradient(circle at 30% 20%, #1e293b, #020617 70%)',
                    }}
                >
                    {pointsAttr && (
                        <polyline
                            points={pointsAttr}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth={3}
                        />
                    )}

                    {carDots.map((dot, i) => (
                        <circle
                            key={i}
                            cx={dot.x}
                            cy={dot.y}
                            r={dot.r}
                            fill={dot.fill}
                            stroke="#0f172a"
                            strokeWidth={1}
                        />
                    ))}
                </svg>
            </div>
        </div>
    );
};
