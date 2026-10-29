/** Classic 2:1 isometric projection. Logic stays cartesian; sprites use screen space. */

const SCALE = 0.62;
const Y_RATIO = 0.5;

let originX = 400;
let originY = 80;

export function setIsoOrigin(x: number, y: number): void
{
    originX = x;
    originY = y;
}

export function toScreen(lx: number, ly: number): { x: number; y: number }
{
    return {
        x: (lx - ly) * SCALE + originX,
        y: (lx + ly) * SCALE * Y_RATIO + originY,
    };
}

export function toWorld(sx: number, sy: number): { x: number; y: number }
{
    const a = (sx - originX) / SCALE;
    const b = (sy - originY) / (SCALE * Y_RATIO);
    return { x: (a + b) / 2, y: (b - a) / 2 };
}

/** Camera bounds that fit a cartesian room of the given size. */
export function isoBounds(width: number, height: number, pad = 120): {
    x: number;
    y: number;
    w: number;
    h: number;
    originX: number;
    originY: number;
}
{
    const corners = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: 0, y: height },
        { x: width, y: height },
    ].map(c => ({
        x: (c.x - c.y) * SCALE,
        y: (c.x + c.y) * SCALE * Y_RATIO,
    }));
    const xs = corners.map(c => c.x);
    const ys = corners.map(c => c.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const ox = pad - minX;
    const oy = pad - minY;
    return {
        x: 0,
        y: 0,
        w: maxX - minX + pad * 2,
        h: maxY - minY + pad * 2,
        originX: ox,
        originY: oy,
    };
}

export function syncIso(sprite: { x: number; y: number }, lx: number, ly: number): void
{
    const s = toScreen(lx, ly);
    sprite.x = s.x;
    sprite.y = s.y;
}
