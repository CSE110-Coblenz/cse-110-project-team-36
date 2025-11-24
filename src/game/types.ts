export type Vec2 = { x: number; y: number };
export interface Camera {
    pos: Vec2;
    zoom: number;
    rotation: number;
}
