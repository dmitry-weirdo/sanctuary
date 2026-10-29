import { game, type Sprite } from '../engine.js';
import { syncIso } from '../iso.js';

export type NpcData = { kind: 'npc'; name: string; lx: number; ly: number };
export type NpcSprite = Sprite<NpcData>;

export function spawnNpc(lx: number, ly: number, name: string): NpcSprite
{
    const npc = game.spawn({
        id: 'npc',
        texture: 'npc',
        x: 0,
        y: 0,
        layer: 'world',
        tags: ['npc'],
        data: { kind: 'npc' as const, name, lx, ly },
    });
    syncIso(npc, lx, ly);
    game.lights.point({
        follow: npc,
        radius: 110,
        color: '#80a0ff',
        intensity: 0.7,
        flicker: 0.1,
    });
    return npc as NpcSprite;
}
