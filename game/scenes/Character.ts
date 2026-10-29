import { game, type Sprite } from '../engine.js';
import type { EquipSlot, ItemDef } from '../bridge/types.js';
import { EQUIP_SLOTS, SLOT_LABEL, slotAccepts } from '../bridge/types.js';
import { getProviders } from '../bridge/providers.js';
import { addToBag, run } from '../run.js';
import { refreshHeroLook, type PlayerSprite } from '../entities/Player.js';
import { spawnLoot } from '../entities/LootDrop.js';
import { PLAY_ZOOM } from './Play.js';

const BAG_COLS = 6;
const BAG_ROWS = 4;
const BAG_CAP = BAG_COLS * BAG_ROWS;
const CELL = 68;
const SLOT = 64;
const DROP_RANGE = 40;

type SlotFrame = Sprite<{ kind: 'equip-slot'; slot: EquipSlot }>;
type BagCell = Sprite<{ kind: 'bag-cell'; index: number }>;
type ItemIcon = Sprite<{
    kind: 'inv-item';
    item: ItemDef;
    from: 'bag' | 'gear';
    bagIndex: number;
    equipSlot: EquipSlot | null;
    homeX: number;
    homeY: number;
}>;

function rarityColor(item: ItemDef): string
{
    if (item.rarity === 'unique') return '#ff8040';
    if (item.rarity === 'rare') return '#ffd040';
    if (item.rarity === 'magic') return '#60a0ff';
    return '#c0c0c0';
}

function statsBlock(): string
{
    const hero = run.hero!;
    return [
        `${hero.name}  ·  L${hero.level}`,
        `Life ${hero.life}/${hero.lifeMax}`,
        `Mana ${hero.mana}/${hero.manaMax}`,
        `Dmg ${hero.damageMin}–${hero.damageMax}`,
        `Def ${hero.defense}`,
        '',
        `STR ${hero.stats.strength}   DEX ${hero.stats.dexterity}`,
        `VIT ${hero.stats.vitality}   ENE ${hero.stats.energy}`,
        `XP ${hero.xp}/${hero.xpToLevel}`,
        '',
        'Drag items onto slots.',
        'Drag gear back to the bag.',
        'Drag a bag item onto Drop.',
    ].join('\n');
}

/** Drag-and-drop character sheet + bag. */
export const Character = {
    name: 'character',
    enter(): void {
        const hero = run.hero;
        if (!hero) {
            game.scenes.pop();
            return;
        }
        run.menuOpen = true;
        const providers = getProviders();
        const W = game.screen.width;
        const H = game.screen.height;
        // The crypt camera is zoomed, and pointer hits use that camera. Flatten it so
        // the sheet's screen positions are what a drag lands on.
        const lockCamera = (): void => {
            game.camera.zoom = 1;
            game.camera.x = W / 2;
            game.camera.y = H / 2;
        };
        game.rig.follow(null);
        lockCamera();
        game.step('character-cam', lockCamera, { before: 'pointer' });

        game.background.color('#08060acc');
        game.spawn({
            id: 'sheet-panel',
            texture: 'ui-sheet',
            x: W / 2,
            y: H / 2 + 10,
            width: W - 48,
            height: H - 36,
            layer: 'hud',
            z: -40,
        });

        // Block clicks to the world under the menu
        game.spawn({
            id: 'inv-blocker',
            x: W / 2,
            y: H / 2,
            width: W,
            height: H,
            layer: 'hud',
            alpha: 0.01,
            z: -100,
            pointer: {},
        });

        const close = (): void => {
            run.menuOpen = false;
            game.camera.zoom = PLAY_ZOOM;
            for (const s of game.roster.tagged('player')) {
                refreshHeroLook(s as PlayerSprite);
                game.rig.follow(s);
            }
            game.scenes.pop();
        };

        game.ui.label({
            anchor: 'center',
            y: -H * 0.42,
            w: W - 80,
            h: 56,
            text: 'Character & Inventory',
            style: 'heading',
        });
        game.ui.button({
            anchor: 'top-right',
            x: -24,
            y: 24,
            h: 56,
            icon: 'close',
            style: 'icon',
            onClick: close,
        });
        game.ui.button({
            anchor: 'bottom',
            y: -20,
            h: 60,
            text: 'Close',
            style: 'good',
            onClick: close,
        });

        const statsText = game.text(statsBlock(), W * 0.14, H * 0.42, {
            size: 17,
            color: '#e8d8a0',
            align: 'left',
            baseline: 'middle',
            stroke: { color: '#000', width: 2 },
        });

        const hint = game.text('', W / 2, H * 0.88, {
            size: 16,
            color: '#c0b090',
        });

        // --- Paper doll slots ---
        const dollCX = W * 0.42;
        const dollCY = H * 0.46;
        const slotPos: Record<EquipSlot, { x: number; y: number }> = {
            helm: { x: dollCX, y: dollCY - 130 },
            amulet: { x: dollCX - 88, y: dollCY - 50 },
            armor: { x: dollCX, y: dollCY - 30 },
            weapon: { x: dollCX + 88, y: dollCY - 50 },
            ring1: { x: dollCX - 88, y: dollCY + 55 },
            belt: { x: dollCX, y: dollCY + 70 },
            ring2: { x: dollCX + 88, y: dollCY + 55 },
        };

        const slotFrames = new Map<EquipSlot, SlotFrame>();
        for (const slot of EQUIP_SLOTS) {
            const p = slotPos[slot];
            const frame = game.spawn({
                id: 'equip-slot',
                texture: 'ui-slot',
                x: p.x,
                y: p.y,
                width: SLOT,
                height: SLOT,
                layer: 'hud',
                z: 0,
                tags: ['equip-slot'],
                pointer: {},
                data: { kind: 'equip-slot' as const, slot },
            }) as SlotFrame;
            slotFrames.set(slot, frame);
            game.text(SLOT_LABEL[slot], p.x, p.y + 42, {
                size: 12,
                color: '#a09080',
                layer: 'hud',
            });
        }

        // --- Bag grid ---
        const bagX0 = W * 0.68;
        const bagY0 = H * 0.30;
        const bagLabel = game.text(`Bag (${run.bag.length}/${BAG_CAP})`, bagX0 + (BAG_COLS * CELL) / 2 - CELL / 2, bagY0 - 48, {
            size: 18,
            font: 'sans-bold',
            color: '#c0b090',
        });

        const dropX = W * 0.16;
        const dropY = H * 0.74;
        const dropPad = game.spawn({
            id: 'drop-pad',
            texture: 'ui-slot',
            x: dropX,
            y: dropY,
            width: 168,
            height: 64,
            layer: 'hud',
            z: 0,
            tint: '#8a6840',
            tags: ['drop-pad'],
        });
        game.text('Drop to ground', dropX, dropY, {
            size: 15,
            font: 'sans-bold',
            color: '#f0e0c0',
            stroke: { color: '#000', width: 2 },
            layer: 'hud',
        });

        const overDrop = (x: number, y: number): boolean =>
            Math.abs(x - dropX) < 140 && Math.abs(y - dropY) < 80;

        /** Pointer events are world units. The sheet is drawn in screen pixels. */
        const hudAt = (e: { x: number; y: number }): { x: number; y: number } =>
            game.camera.toScreen(e.x, e.y);

        let feet = { x: 0, y: 0 };
        for (const s of game.roster.tagged('player')) {
            const heroSprite = s as PlayerSprite;
            feet = { x: heroSprite.data.lx, y: heroSprite.data.ly };
        }

        const bagCells: BagCell[] = [];
        for (let i = 0; i < BAG_CAP; i += 1) {
            const col = i % BAG_COLS;
            const row = Math.floor(i / BAG_COLS);
            const x = bagX0 + col * CELL;
            const y = bagY0 + row * CELL;
            bagCells.push(game.spawn({
                id: 'bag-cell',
                texture: 'ui-slot',
                x,
                y,
                width: SLOT,
                height: SLOT,
                layer: 'hud',
                z: 0,
                tags: ['bag-cell'],
                pointer: {},
                data: { kind: 'bag-cell' as const, index: i },
            }) as BagCell);
        }

        let dragging: ItemIcon | null = null;
        const nameLabels: { destroy(): void }[] = [];

        const clearHot = (): void => {
            for (const f of slotFrames.values()) { f.texture = 'ui-slot'; f.tint = '#ffffff'; }
            for (const c of bagCells) { c.texture = 'ui-slot'; c.tint = '#ffffff'; }
            dropPad.tint = '#8a6840';
        };

        const highlightAt = (x: number, y: number, item: ItemDef): void => {
            clearHot();
            for (const slot of EQUIP_SLOTS) {
                const p = slotPos[slot];
                if (slotAccepts(slot, item.kind) && Math.hypot(p.x - x, p.y - y) < DROP_RANGE) {
                    const hot = slotFrames.get(slot)!;
                    hot.texture = 'ui-slot';
                    hot.tint = '#ffd080';
                }
            }
            for (const cell of bagCells) {
                if (Math.hypot(cell.x - x, cell.y - y) < DROP_RANGE) {
                    cell.texture = 'ui-slot';
                    cell.tint = '#ffd080';
                }
            }
            if (overDrop(x, y)) dropPad.tint = '#ffd080';
        };

        const findEquipDrop = (x: number, y: number, item: ItemDef): EquipSlot | null => {
            let best: EquipSlot | null = null;
            let bestD = DROP_RANGE;
            for (const slot of EQUIP_SLOTS) {
                if (!slotAccepts(slot, item.kind)) continue;
                const p = slotPos[slot];
                const d = Math.hypot(p.x - x, p.y - y);
                if (d < bestD) {
                    bestD = d;
                    best = slot;
                }
            }
            return best;
        };

        const findBagDrop = (x: number, y: number): number | null => {
            let best: number | null = null;
            let bestD = DROP_RANGE;
            for (const cell of bagCells) {
                const d = Math.hypot(cell.x - x, cell.y - y);
                if (d < bestD) {
                    bestD = d;
                    best = cell.data.index;
                }
            }
            return best;
        };

        const destroyItems = (): void => {
            for (const s of [...game.roster.tagged('inv-item')]) s.destroy();
            for (const t of nameLabels) t.destroy();
            nameLabels.length = 0;
        };

        const placeIcon = (
            item: ItemDef,
            x: number,
            y: number,
            from: 'bag' | 'gear',
            bagIndex: number,
            equipSlot: EquipSlot | null,
        ): void => {
            const icon = game.spawn({
                id: 'inv-item',
                texture: item.icon,
                x,
                y,
                width: 48,
                height: 48,
                layer: 'hud',
                z: 10,
                tags: ['inv-item'],
                data: {
                    kind: 'inv-item' as const,
                    item,
                    from,
                    bagIndex,
                    equipSlot,
                    homeX: x,
                    homeY: y,
                },
                pointer: {
                    dragThreshold: 4,
                    onDown: () => {
                        dragging = icon as ItemIcon;
                        icon.z = 50;
                        icon.scale = 1.12;
                    },
                    onDrag: e => {
                        const at = hudAt(e);
                        icon.x = at.x;
                        icon.y = at.y;
                        highlightAt(at.x, at.y, item);
                    },
                    onUp: e => {
                        clearHot();
                        icon.scale = 1;
                        icon.z = 10;
                        const at = hudAt(e);
                        const dropSlot = findEquipDrop(at.x, at.y, item);
                        const dropBag = findBagDrop(at.x, at.y);
                        let ok = false;

                        if (overDrop(at.x, at.y)) {
                            let dropped: ItemDef | null = null;
                            if (from === 'bag') {
                                const idx = run.bag.findIndex(it => it.id === item.id);
                                if (idx >= 0) dropped = run.bag.splice(idx, 1)[0] ?? null;
                            }
                            else if (equipSlot) {
                                dropped = providers.stats.unequip(hero, equipSlot);
                            }
                            if (dropped) {
                                spawnLoot(feet.x + 42, feet.y, dropped, true);
                                game.sound.play('ui');
                                hint.text = `Dropped ${dropped.name} beside you`;
                                ok = true;
                            }
                        }
                        else if (dropSlot) {
                            // Remove from origin
                            if (from === 'bag') {
                                const idx = run.bag.findIndex(it => it.id === item.id);
                                if (idx >= 0) run.bag.splice(idx, 1);
                            }
                            else if (equipSlot) {
                                providers.stats.unequip(hero, equipSlot);
                            }
                            const displaced = providers.stats.equip(hero, item, dropSlot);
                            if (displaced) addToBag(displaced);
                            game.sound.play('equip');
                            hint.text = `Equipped ${item.name} → ${SLOT_LABEL[dropSlot]}`;
                            ok = true;
                        }
                        else if (dropBag !== null && from === 'gear' && equipSlot) {
                            const removed = providers.stats.unequip(hero, equipSlot);
                            if (removed) {
                                // Insert near drop cell if space
                                if (run.bag.length < BAG_CAP) {
                                    const at = Math.min(dropBag, run.bag.length);
                                    run.bag.splice(at, 0, removed);
                                }
                                else addToBag(removed);
                            }
                            game.sound.play('equip');
                            hint.text = `Unequipped ${item.name}`;
                            ok = true;
                        }
                        else if (dropBag !== null && from === 'bag') {
                            // Reorder within bag
                            const idx = run.bag.findIndex(it => it.id === item.id);
                            if (idx >= 0) {
                                run.bag.splice(idx, 1);
                                const at = Math.min(dropBag, run.bag.length);
                                run.bag.splice(at, 0, item);
                                game.sound.play('ui');
                                ok = true;
                            }
                        }

                        if (!ok) {
                            icon.x = icon.data.homeX;
                            icon.y = icon.data.homeY;
                            hint.text = 'Invalid drop';
                            game.sound.play('ui');
                        }
                        dragging = null;
                        if (ok) {
                            statsText.text = statsBlock();
                            bagLabel.text = `Bag (${run.bag.length}/${BAG_CAP})`;
                            rebuildItems();
                            for (const s of game.roster.tagged('player')) {
                                refreshHeroLook(s as PlayerSprite);
                            }
                        }
                    },
                },
            }) as ItemIcon;

            nameLabels.push(game.text(item.name.slice(0, 9), x, y + 30, {
                size: 11,
                color: rarityColor(item),
                layer: 'hud',
            }));
        };

        const rebuildItems = (): void => {
            destroyItems();
            for (const slot of EQUIP_SLOTS) {
                const item = hero.gear[slot];
                if (!item) continue;
                const p = slotPos[slot];
                placeIcon(item, p.x, p.y, 'gear', -1, slot);
            }
            run.bag.forEach((item, i) => {
                if (i >= BAG_CAP) return;
                const cell = bagCells[i]!;
                placeIcon(item, cell.x, cell.y, 'bag', i, null);
            });
        };

        rebuildItems();

        game.step('character', () => {
            if (game.input.keyPressed('Escape') || game.input.keyPressed('KeyC') || game.input.keyPressed('KeyI')) {
                if (!dragging) close();
            }
        });
    },
    exit(): void {
        run.menuOpen = false;
        game.camera.zoom = PLAY_ZOOM;
    },
};
