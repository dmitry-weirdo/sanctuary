import { game, type Sprite } from '../engine.js';
import type { ItemDef, ItemRarity } from '../bridge/types.js';
import { syncIso } from '../iso.js';

const RARITY_TINT: Record<ItemRarity, string> = {
    normal: '#e8e0d0',
    magic: '#80b0ff',
    rare: '#ffd060',
    unique: '#ff9050',
};

const PILE_RADIUS = 14;

/** Nudge a new drop off any loot already sitting on this spot. */
function scatter(lx: number, ly: number): { x: number; y: number }
{
    let n = 0;
    for (const raw of game.roster.tagged('loot')) {
        const data = (raw as LootSprite).data;
        if (Math.hypot(data.lx - lx, data.ly - ly) < 26) n += 1;
    }
    if (n === 0) return { x: lx, y: ly };
    const angle = n * 2.2;
    return { x: lx + Math.cos(angle) * PILE_RADIUS, y: ly + Math.sin(angle) * PILE_RADIUS };
}

export type LootData = {
    kind: 'loot';
    lx: number;
    ly: number;
    item: ItemDef;
    /** Fresh from the bag: ignore pickup until the mouse has been released. */
    hold: boolean;
};

export type LootSprite = Sprite<LootData>;

export function spawnLoot(lx: number, ly: number, item: ItemDef, hold = false): LootSprite
{
    const spot = scatter(lx, ly);
    const drop = game.spawn({
        id: 'loot',
        texture: item.icon,
        x: 0,
        y: 0,
        width: 36,
        height: 36,
        layer: 'world',
        tags: ['loot'],
        tint: RARITY_TINT[item.rarity],
        data: { kind: 'loot' as const, lx: spot.x, ly: spot.y, item, hold },
    });
    syncIso(drop, spot.x, spot.y);
    game.tween.from(drop, { scale: 0.2, y: drop.y - 16 }, { duration: 0.28, ease: 'easeOutBack' });
    return drop as LootSprite;
}
