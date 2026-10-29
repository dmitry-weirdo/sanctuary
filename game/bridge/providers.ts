/**
 * Swap these for your own engine:
 *   setProviders({ stats, combat, items, dialogue, appearance })
 */
import type {
    AppearanceProvider,
    CombatProvider,
    DialogueProvider,
    ItemProvider,
    StatsProvider,
} from './types.js';
import { stubAppearance } from '../systems/stubAppearance.js';
import { stubCombat } from '../systems/stubCombat.js';
import { stubDialogue } from '../systems/stubDialogue.js';
import { stubItems } from '../systems/stubItems.js';
import { stubStats } from '../systems/stubStats.js';

export type Providers = {
    stats: StatsProvider;
    combat: CombatProvider;
    items: ItemProvider;
    dialogue: DialogueProvider;
    appearance: AppearanceProvider;
};

const providers: Providers = {
    stats: stubStats,
    combat: stubCombat,
    items: stubItems,
    dialogue: stubDialogue,
    appearance: stubAppearance,
};

export function getProviders(): Providers
{
    return providers;
}

export function setProviders(next: Partial<Providers>): void
{
    if (next.stats) providers.stats = next.stats;
    if (next.combat) providers.combat = next.combat;
    if (next.items) providers.items = next.items;
    if (next.dialogue) providers.dialogue = next.dialogue;
    if (next.appearance) providers.appearance = next.appearance;
}
