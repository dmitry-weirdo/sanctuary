import { game, type Sprite } from '../engine.js';
import type { AppearanceKit, CharacterSheet } from '../bridge/types.js';
import { getProviders } from '../bridge/providers.js';
import { syncIso } from '../iso.js';

export const PLAYER_RADIUS = 12;
export const PLAYER_SPEED = 190;
export const MELEE_RANGE = 52;
export const ATTACK_COOLDOWN = 0.42;

export type PlayerData = {
    kind: 'player';
    sheet: CharacterSheet;
    lx: number;
    ly: number;
    attackCd: number;
    targetX: number;
    targetY: number;
    hasTarget: boolean;
};

export type PlayerSprite = Sprite<PlayerData>;

type LayerSprite = Sprite<{ layer: string }>;

const overlays = new Map<string, LayerSprite>();

function overlayKey(layer: string): string
{
    return `hero-overlay-${layer}`;
}

export function spawnPlayer(lx: number, ly: number, sheet: CharacterSheet): PlayerSprite
{
    const kit = getProviders().appearance.fromGear(sheet.gear);
    const hero = game.spawn({
        id: 'hero',
        texture: kit.body,
        x: 0,
        y: 0,
        width: 96,
        height: 128,
        layer: 'world',
        tags: ['player', 'hero'],
        data: {
            kind: 'player' as const,
            sheet,
            lx,
            ly,
            attackCd: 0,
            targetX: lx,
            targetY: ly,
            hasTarget: false,
        },
    });
    syncIso(hero, lx, ly);
    applyAppearance(hero as PlayerSprite, kit);
    game.lights.point({
        follow: hero,
        radius: 280,
        color: '#ffc070',
        intensity: 1.55,
        flicker: 0.35,
        flickerSpeed: 1.1,
        shadows: true,
        softness: 10,
    });
    return hero as PlayerSprite;
}

export function applyAppearance(player: PlayerSprite, kit: AppearanceKit): void
{
    player.texture = kit.body;
    player.width = 96;
    player.height = 128;
    const layers: { name: keyof AppearanceKit; texture: string | null }[] = [
        { name: 'belt', texture: kit.belt },
        { name: 'armor', texture: kit.armor },
        { name: 'helm', texture: kit.helm },
        { name: 'weapon', texture: kit.weapon },
    ];
    for (const layer of layers) {
        const key = overlayKey(layer.name);
        const existing = overlays.get(key);
        if (!layer.texture) {
            if (existing?.alive) existing.destroy();
            overlays.delete(key);
            continue;
        }
        if (existing?.alive) {
            existing.texture = layer.texture;
            existing.width = 40;
            existing.height = 52;
            syncIso(existing, player.data.lx, player.data.ly);
            continue;
        }
        const part = game.spawn({
            id: key,
            texture: layer.texture,
            x: player.x,
            y: player.y,
            width: 40,
            height: 52,
            layer: 'world',
            tags: ['hero-layer'],
            z: layer.name === 'weapon' ? 3 : 1,
            data: { layer: layer.name },
        }) as LayerSprite;
        overlays.set(key, part);
    }
}

export function refreshHeroLook(player: PlayerSprite): void
{
    const kit = getProviders().appearance.fromGear(player.data.sheet.gear);
    applyAppearance(player, kit);
}

export function syncPlayerIso(player: PlayerSprite): void
{
    syncIso(player, player.data.lx, player.data.ly);
    for (const part of overlays.values()) {
        if (part.alive) {
            syncIso(part, player.data.lx, player.data.ly);
            part.sx = player.sx;
        }
    }
}

export function setMoveTarget(player: PlayerSprite, lx: number, ly: number): void
{
    player.data.targetX = lx;
    player.data.targetY = ly;
    player.data.hasTarget = true;
}

export function clearHeroOverlays(): void
{
    for (const part of overlays.values()) {
        if (part.alive) part.destroy();
    }
    overlays.clear();
}
