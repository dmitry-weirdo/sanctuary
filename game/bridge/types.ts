/**
 * Contracts for systems you replace with your own engine.
 *
 *   setProviders({ stats, combat, items, appearance, dialogue })
 */

export type StatId = 'strength' | 'dexterity' | 'vitality' | 'energy';

/** Worn equipment slots on the paper doll. */
export type EquipSlot =
    | 'armor'
    | 'helm'
    | 'belt'
    | 'amulet'
    | 'ring1'
    | 'ring2'
    | 'weapon';

/** What an item *is* (rings fit ring1 or ring2). */
export type ItemKind = 'armor' | 'helm' | 'belt' | 'amulet' | 'ring' | 'weapon';

export type AppearanceLayer = 'body' | 'helm' | 'armor' | 'weapon' | 'belt';

export type CharacterSheet = {
    name: string;
    level: number;
    xp: number;
    xpToLevel: number;
    life: number;
    lifeMax: number;
    mana: number;
    manaMax: number;
    damageMin: number;
    damageMax: number;
    defense: number;
    stats: Record<StatId, number>;
    gear: Record<EquipSlot, ItemDef | null>;
};

export type ItemRarity = 'normal' | 'magic' | 'rare' | 'unique';

export type ItemDef = {
    id: string;
    name: string;
    rarity: ItemRarity;
    kind: ItemKind;
    mods: { stat: string; value: number }[];
    icon: string;
    visual?: { layer: AppearanceLayer; texture: string };
};

export type DialogueTurn = {
    speaker?: string;
    text: string;
};

export type KillContext = {
    monsterId: string;
    monsterLevel: number;
    heroLevel: number;
};

export type Fighter = {
    id: string;
    side: 'hero' | 'monster';
    level: number;
    life: number;
    lifeMax: number;
    damageMin: number;
    damageMax: number;
    defense: number;
};

export type HitResult = {
    damage: number;
    defenderLife: number;
};

export type StatsProvider = {
    createHero(name?: string): CharacterSheet;
    recalc(sheet: CharacterSheet): void;
    xpForKill(ctx: KillContext): number;
    applyXp(sheet: CharacterSheet, amount: number): boolean;
    /** Equip into an optional target slot (must accept the item kind). Returns displaced item. */
    equip(sheet: CharacterSheet, item: ItemDef, targetSlot?: EquipSlot): ItemDef | null;
    unequip(sheet: CharacterSheet, slot: EquipSlot): ItemDef | null;
};

export type CombatProvider = {
    fighterFromHero(sheet: CharacterSheet): Fighter;
    fighterFromMonster(m: {
        id: string;
        level: number;
        life: number;
        lifeMax: number;
        damageMin: number;
        damageMax: number;
        defense: number;
    }): Fighter;
    resolveHit(attacker: Fighter, defender: Fighter, roll01: number): HitResult;
};

export type ItemProvider = {
    rollDrop(monsterLevel: number): ItemDef | null;
    describe(item: ItemDef): string;
};

export type DialogueProvider = {
    intro(): DialogueTurn[];
    onPickup(item: ItemDef): DialogueTurn[] | null;
    onLevelUp(level: number): DialogueTurn[] | null;
};

export type AppearanceKit = {
    body: string;
    helm: string | null;
    armor: string | null;
    weapon: string | null;
    belt: string | null;
};

export type AppearanceProvider = {
    base(): AppearanceKit;
    fromGear(gear: CharacterSheet['gear']): AppearanceKit;
};

export const EQUIP_SLOTS: EquipSlot[] = [
    'helm',
    'amulet',
    'armor',
    'weapon',
    'ring1',
    'belt',
    'ring2',
];

export const SLOT_LABEL: Record<EquipSlot, string> = {
    armor: 'Body Armor',
    helm: 'Helm',
    belt: 'Belt',
    amulet: 'Amulet',
    ring1: 'Ring 1',
    ring2: 'Ring 2',
    weapon: 'Weapon',
};

export function slotAccepts(slot: EquipSlot, kind: ItemKind): boolean
{
    if (kind === 'ring') return slot === 'ring1' || slot === 'ring2';
    return slot === kind;
}

/** Prefer an empty compatible slot, else the first compatible. */
export function pickSlotFor(gear: CharacterSheet['gear'], kind: ItemKind): EquipSlot
{
    const candidates = EQUIP_SLOTS.filter(s => slotAccepts(s, kind));
    const empty = candidates.find(s => !gear[s]);
    return empty ?? candidates[0]!;
}
