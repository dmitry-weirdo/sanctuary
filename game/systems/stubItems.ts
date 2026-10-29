import type { ItemDef, ItemKind, ItemProvider, ItemRarity } from '../bridge/types.js';

const NAMES: Record<ItemKind, Record<ItemRarity, string[]>> = {
    weapon: {
        normal: ['Rusted Blade', 'Short Sword'],
        magic: ['Gleaming Sabre', 'Frost Edge'],
        rare: ['Doom Bringer', 'Bone Cleaver'],
        unique: ['Heartstrike', 'Ashen Fang'],
    },
    helm: {
        normal: ['Worn Cap', 'Leather Hood'],
        magic: ['Raven Hood', 'Iron Casque'],
        rare: ['Skull Visage', 'War Crown'],
        unique: ['Ashen Crown', 'Night Circlet'],
    },
    armor: {
        normal: ['Hide Armor', 'Quilted Mail'],
        magic: ['Ember Mail', 'Shadow Coat'],
        rare: ['Boneweave', 'Plate of Thorns'],
        unique: ['Nightfall Harness', 'Sanctuary Plate'],
    },
    belt: {
        normal: ['Frayed Belt', 'Leather Cord'],
        magic: ['Sharkskin Belt', 'Iron Wrap'],
        rare: ['Troll Belt', 'War Sash'],
        unique: ['Cord of the Crypt', 'Girdle of Stars'],
    },
    amulet: {
        normal: ['Copper Amulet', 'Bone Charm'],
        magic: ['Amber Amulet', 'Jade Pendant'],
        rare: ['Blood Amulet', 'Storm Talisman'],
        unique: ['Eye of Sanctuary', 'The Cat\'s Eye'],
    },
    ring: {
        normal: ['Copper Band', 'Chipped Ring'],
        magic: ['Sapphire Ring', 'Ruby Circle'],
        rare: ['Blood Charm', 'Storm Signet'],
        unique: ['Angelical Shard', 'Void Loop'],
    },
};

const KINDS: ItemKind[] = ['weapon', 'armor', 'helm', 'belt', 'amulet', 'ring'];
const RARITY_CHANCE: { rarity: ItemRarity; below: number }[] = [
    { rarity: 'unique', below: 0.04 },
    { rarity: 'rare', below: 0.14 },
    { rarity: 'magic', below: 0.45 },
    { rarity: 'normal', below: 1 },
];

/** Inventory / world texture keys. Helm & armor use real image files in game/art/. */
const ICON: Record<ItemKind, string> = {
    weapon: 'icon-weapon',
    helm: 'item-helm',
    armor: 'item-armor',
    belt: 'icon-belt',
    amulet: 'icon-amulet',
    ring: 'icon-ring',
};

const VISUAL: Partial<Record<ItemKind, { layer: 'helm' | 'armor' | 'weapon' | 'belt'; texture: string }>> = {
    weapon: { layer: 'weapon', texture: 'hero-weapon-magic' },
    helm: { layer: 'helm', texture: 'item-helm' },
    armor: { layer: 'armor', texture: 'item-armor' },
    belt: { layer: 'belt', texture: 'hero-belt' },
};

/** Starter gear worn from the first screen (image-backed helm & armor). */
export function starterHelm(): ItemDef
{
    return {
        id: 'starter-helm',
        name: 'Iron Helm',
        rarity: 'normal',
        kind: 'helm',
        mods: [{ stat: 'defense', value: 3 }],
        icon: 'item-helm',
        visual: { layer: 'helm', texture: 'item-helm' },
    };
}

export function starterArmor(): ItemDef
{
    return {
        id: 'starter-armor',
        name: 'Hide Armor',
        rarity: 'normal',
        kind: 'armor',
        mods: [{ stat: 'defense', value: 4 }, { stat: 'life', value: 8 }],
        icon: 'item-armor',
        visual: { layer: 'armor', texture: 'item-armor' },
    };
}

let nextId = 1;

function pickRarity(roll: number): ItemRarity
{
    for (const row of RARITY_CHANCE) {
        if (roll < row.below) return row.rarity;
    }
    return 'normal';
}

export function makeItem(rarity: ItemRarity, monsterLevel: number, nameRoll = 0, kindRoll = 0): ItemDef
{
    const kind = KINDS[Math.floor(kindRoll * KINDS.length) % KINDS.length]!;
    const names = NAMES[kind][rarity];
    const name = names[Math.floor(nameRoll * names.length) % names.length]!;
    const power = 1 + monsterLevel + (rarity === 'magic' ? 2 : rarity === 'rare' ? 4 : rarity === 'unique' ? 7 : 0);
    const primary =
        kind === 'weapon' ? 'damage'
            : kind === 'ring' || kind === 'amulet' ? 'mana'
                : kind === 'belt' ? 'life'
                    : 'defense';
    const mods = rarity === 'normal'
        ? [{ stat: primary, value: 1 + Math.floor(power / 2) }]
        : [
            { stat: primary, value: 2 + power },
            ...(rarity === 'rare' || rarity === 'unique'
                ? [{ stat: kind === 'weapon' ? 'life' : 'defense', value: 1 + Math.floor(power / 2) }]
                : []),
        ];
    const visual = VISUAL[kind]
        ? {
            layer: VISUAL[kind]!.layer,
            texture: rarity === 'normal' && kind === 'weapon' ? 'hero-weapon-basic' : VISUAL[kind]!.texture,
        }
        : undefined;
    return {
        id: `item-${nextId++}`,
        name,
        rarity,
        kind,
        mods,
        icon: ICON[kind],
        visual,
    };
}

/** Every kill leaves one item. Rarity still rolls. */
export function rollStubDrop(
    monsterLevel: number,
    rarityRoll: number,
    nameRoll: number,
    kindRoll: number,
): ItemDef
{
    return makeItem(pickRarity(rarityRoll), monsterLevel, nameRoll, kindRoll);
}

export const stubItems: ItemProvider = {
    rollDrop(monsterLevel) {
        return makeItem('magic', monsterLevel);
    },
    describe(item) {
        const mods = item.mods.map(m => `+${m.value} ${m.stat}`).join(', ');
        return mods ? `${item.name} (${item.rarity}) — ${mods}` : `${item.name} (${item.rarity})`;
    },
};
