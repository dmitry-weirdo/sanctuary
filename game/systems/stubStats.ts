import type {
    CharacterSheet,
    EquipSlot,
    ItemDef,
    KillContext,
    StatsProvider,
} from '../bridge/types.js';
import { pickSlotFor, slotAccepts } from '../bridge/types.js';
import { starterArmor, starterHelm } from './stubItems.js';

const XP_BASE = 40;
const XP_LEVEL_SCALE = 1.45;
const LIFE_PER_VIT = 4;
const MANA_PER_ENERGY = 3;
const DAMAGE_PER_STR = 0.6;

function emptyGear(): CharacterSheet['gear']
{
    return {
        armor: null,
        helm: null,
        belt: null,
        amulet: null,
        ring1: null,
        ring2: null,
        weapon: null,
    };
}

function xpToReach(level: number): number
{
    return Math.floor(100 * Math.pow(XP_LEVEL_SCALE, level - 1));
}

function gearBonus(sheet: CharacterSheet, stat: string): number
{
    let n = 0;
    for (const item of Object.values(sheet.gear)) {
        if (!item) continue;
        for (const mod of item.mods) {
            if (mod.stat === stat) n += mod.value;
        }
    }
    return n;
}

function recalc(sheet: CharacterSheet): void
{
    const { vitality, energy, strength, dexterity } = sheet.stats;
    sheet.lifeMax = 40 + vitality * LIFE_PER_VIT + (sheet.level - 1) * 8 + gearBonus(sheet, 'life');
    sheet.manaMax = 20 + energy * MANA_PER_ENERGY + (sheet.level - 1) * 4 + gearBonus(sheet, 'mana');
    sheet.damageMin = 3 + Math.floor(strength * DAMAGE_PER_STR) + gearBonus(sheet, 'damage');
    sheet.damageMax = sheet.damageMin + 4 + sheet.level;
    sheet.defense = 2 + dexterity + sheet.level + gearBonus(sheet, 'defense');
    sheet.life = Math.min(sheet.life, sheet.lifeMax);
    sheet.mana = Math.min(sheet.mana, sheet.manaMax);
}

function levelUp(sheet: CharacterSheet): void
{
    sheet.level += 1;
    sheet.stats.strength += 1;
    sheet.stats.dexterity += 1;
    sheet.stats.vitality += 2;
    sheet.stats.energy += 1;
    sheet.xpToLevel = xpToReach(sheet.level);
    recalc(sheet);
    sheet.life = sheet.lifeMax;
    sheet.mana = sheet.manaMax;
}

export const stubStats: StatsProvider = {
    createHero(name = 'Wanderer') {
        const sheet: CharacterSheet = {
            name,
            level: 1,
            xp: 0,
            xpToLevel: xpToReach(1),
            life: 1,
            lifeMax: 1,
            mana: 1,
            manaMax: 1,
            damageMin: 1,
            damageMax: 1,
            defense: 1,
            stats: { strength: 20, dexterity: 15, vitality: 25, energy: 10 },
            gear: emptyGear(),
        };
        // Level 1 start: image-backed helm + armor already worn
        sheet.gear.helm = starterHelm();
        sheet.gear.armor = starterArmor();
        recalc(sheet);
        sheet.life = sheet.lifeMax;
        sheet.mana = sheet.manaMax;
        return sheet;
    },

    recalc,

    xpForKill(ctx: KillContext) {
        const gap = Math.max(1, ctx.monsterLevel);
        return Math.max(8, Math.floor(XP_BASE * gap * (0.85 + ctx.monsterLevel * 0.08)));
    },

    applyXp(sheet, amount) {
        sheet.xp += amount;
        let leveled = false;
        while (sheet.xp >= sheet.xpToLevel) {
            sheet.xp -= sheet.xpToLevel;
            levelUp(sheet);
            leveled = true;
        }
        return leveled;
    },

    equip(sheet, item: ItemDef, targetSlot?: EquipSlot) {
        const slot = targetSlot && slotAccepts(targetSlot, item.kind)
            ? targetSlot
            : pickSlotFor(sheet.gear, item.kind);
        if (!slotAccepts(slot, item.kind)) return item;
        const previous = sheet.gear[slot];
        sheet.gear[slot] = item;
        recalc(sheet);
        return previous;
    },

    unequip(sheet, slot: EquipSlot) {
        const previous = sheet.gear[slot];
        sheet.gear[slot] = null;
        recalc(sheet);
        return previous;
    },
};
