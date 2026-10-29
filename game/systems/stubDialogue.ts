import type { DialogueProvider, DialogueTurn, ItemDef } from '../bridge/types.js';

export const stubDialogue: DialogueProvider = {
    intro(): DialogueTurn[] {
        return [
            { speaker: 'Akara', text: 'Stay a while and listen… the crypt below still breathes.' },
            { speaker: 'Akara', text: 'Click the ground to walk. Click a demon to strike. Click the loot they leave to pick it up. Reach the portal when you are ready.' },
            { text: 'The torches gutter. Something moves in the dark.' },
        ];
    },

    onPickup(item: ItemDef): DialogueTurn[] | null {
        if (item.rarity === 'normal') return null;
        return [
            { speaker: 'Akara', text: `A ${item.rarity} find — ${item.name}. Keep it close.` },
        ];
    },

    onLevelUp(level: number): DialogueTurn[] | null {
        return [
            { speaker: 'Akara', text: `Your power grows. You are now level ${level}.` },
        ];
    },
};
