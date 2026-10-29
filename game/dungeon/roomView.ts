import { game } from '../engine.js';
import { isoBounds, setIsoOrigin, toScreen } from '../iso.js';

type ArenaLayout = ReturnType<typeof game.arenaLayout.generate>;

/** Isometric floor, walls, portal. Returns camera bounds in screen space. */
export function buildRoomView(room: ArenaLayout): { width: number; height: number }
{
    const width = room.cols * room.cell;
    const height = room.rows * room.cell;
    const bounds = isoBounds(width, height, 160);
    setIsoOrigin(bounds.originX, bounds.originY);

    for (const cell of room.open) {
        const s = toScreen(cell.x, cell.y);
        game.spawn({
            id: 'floor',
            texture: 'iso-floor',
            x: s.x,
            y: s.y,
            width: 92,
            height: 52,
            layer: 'floor',
            z: -1000 + cell.y * 0.01,
        });
    }

    for (const wall of room.walls) {
        const lx = wall.x + wall.w / 2;
        const ly = wall.y + wall.h / 2;
        const s = toScreen(lx, ly);
        game.spawn({
            id: 'wall',
            texture: 'iso-wall',
            x: s.x,
            y: s.y - 16,
            width: 72,
            height: 72,
            layer: 'world',
            tags: ['wall'],
            z: 2,
        });
        // Occluder in screen space (approx diamond as rect)
        game.lights.occluders.addRect(s.x - 28, s.y - 20, 56, 40);
    }

    const exit = toScreen(room.exit.x, room.exit.y);
    const portal = game.spawn({
        id: 'portal',
        texture: 'portal',
        x: exit.x,
        y: exit.y - 8,
        layer: 'world',
        tags: ['portal'],
        anims: { spin: { strip: 'portal', fps: 6 } },
        data: { lx: room.exit.x, ly: room.exit.y },
    });
    portal.play('spin');
    game.lights.point({
        follow: portal,
        radius: 160,
        color: '#60e0ff',
        intensity: 1.15,
        flicker: 0.15,
    });

    return { width: bounds.w, height: bounds.h };
}
