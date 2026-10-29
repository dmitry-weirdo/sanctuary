import type { AppearanceKit, AppearanceProvider, CharacterSheet } from '../bridge/types.js';

export const stubAppearance: AppearanceProvider = {
    base(): AppearanceKit {
        return {
            body: 'hero-painted',
            helm: null,   // starter helm comes from gear (item-helm image)
            armor: null,  // starter armor comes from gear (item-armor image)
            weapon: 'hero-weapon-basic',
            belt: null,
        };
    },

    fromGear(gear: CharacterSheet['gear']): AppearanceKit {
        const kit = stubAppearance.base();
        for (const item of Object.values(gear)) {
            if (!item?.visual) continue;
            const { layer, texture } = item.visual;
            if (layer === 'body') kit.body = texture;
            if (layer === 'helm') kit.helm = texture;
            if (layer === 'armor') kit.armor = texture;
            if (layer === 'weapon') kit.weapon = texture;
            if (layer === 'belt') kit.belt = texture;
        }
        return kit;
    },
};
