import type { CharacterSheet, ItemDef } from './bridge/types.js';

export type RunState = {
    floor: number;
    kills: number;
    /** Unequipped loot. */
    bag: ItemDef[];
    hero: CharacterSheet | null;
    talking: boolean;
    menuOpen: boolean;
    won: boolean;
    dead: boolean;
};

export const run: RunState = {
    floor: 1,
    kills: 0,
    bag: [],
    hero: null,
    talking: false,
    menuOpen: false,
    won: false,
    dead: false,
};

export function resetRun(hero: CharacterSheet): void
{
    run.floor = 1;
    run.kills = 0;
    run.bag = [];
    run.hero = hero;
    run.talking = false;
    run.menuOpen = false;
    run.won = false;
    run.dead = false;
}

export function addToBag(item: ItemDef): boolean
{
    if (run.bag.length >= 24) return false;
    run.bag.push(item);
    return true;
}
