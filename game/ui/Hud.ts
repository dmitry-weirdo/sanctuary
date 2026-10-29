import { game } from '../engine.js';
import type { CharacterSheet, ItemDef } from '../bridge/types.js';
import { getProviders } from '../bridge/providers.js';

type Bar = ReturnType<typeof game.bars.create>;

export type Hud = {
    sync(sheet: CharacterSheet): void;
    setFloor(floor: number): void;
    setLootHint(text: string): void;
    showPickup(item: ItemDef): void;
};

export function createHud(sheet: CharacterSheet): Hud
{
    const life = game.bars.create({
        style: 'fighter',
        anchor: 'top-left',
        x: 16,
        y: 16,
        width: 280,
        height: 22,
        max: sheet.lifeMax,
        value: sheet.life,
        ghost: true,
        fill: { colors: ['#ff6a4a', '#a01010'] },
        label: { text: 'LIFE  {value}/{max}', position: 'center', fillColor: '#fff0e0' },
    });
    const mana = game.bars.create({
        style: 'glossy',
        anchor: 'top-left',
        x: 16,
        y: 46,
        width: 280,
        height: 18,
        max: sheet.manaMax,
        value: sheet.mana,
        fill: { colors: ['#60a0ff', '#2040a0'] },
        label: { text: 'MANA  {value}/{max}', position: 'center', fillColor: '#e8f0ff' },
    });
    const xp = game.bars.create({
        style: 'flat',
        anchor: 'top-left',
        x: 16,
        y: 74,
        width: 280,
        height: 12,
        max: sheet.xpToLevel,
        value: sheet.xp,
        fill: '#c8a040',
        track: '#201808',
        label: { text: 'XP  {value}/{max}', position: 'after', fillColor: '#e8d8a0' },
    });

    const levelLabel = game.text(`Lvl ${sheet.level}  ${sheet.name}`, 310, 28, {
        size: 22,
        font: 'sans-bold',
        color: '#e8d8a0',
        align: 'left',
        baseline: 'middle',
        stroke: { color: '#000000', width: 3 },
    });
    const floorLabel = game.text('Crypt 1', 310, 52, {
        size: 16,
        color: '#a09080',
        align: 'left',
        baseline: 'middle',
    });
    const hint = game.text('Click move · click loot · C character · E talk', game.screen.width / 2, game.screen.height - 36, {
        size: 16,
        color: '#c0b090',
        stroke: { color: '#000000', width: 2 },
    });
    const lootToast = game.text('', game.screen.width / 2, 110, {
        size: 20,
        font: 'sans-bold',
        color: '#ffd060',
        stroke: { color: '#000000', width: 3 },
    });

    game.ui.button({
        anchor: 'top-right',
        x: -200,
        y: 16,
        h: 56,
        text: 'Char',
        style: 'flat',
        onClick: () => {
            game.sound.play('ui');
            game.scenes.push('character');
        },
    });

    const syncBar = (bar: Bar, value: number, max: number): void => {
        bar.max = max;
        bar.value = value;
    };

    return {
        sync(s) {
            syncBar(life, s.life, s.lifeMax);
            syncBar(mana, s.mana, s.manaMax);
            syncBar(xp, s.xp, s.xpToLevel);
            levelLabel.text = `Lvl ${s.level}  ${s.name}`;
        },
        setFloor(floor) {
            floorLabel.text = `Crypt ${floor}`;
        },
        setLootHint(text) {
            hint.text = text;
        },
        showPickup(item) {
            const line = getProviders().items.describe(item);
            lootToast.text = line;
            lootToast.alpha = 1;
            game.after(2.2, () => {
                game.tween.to(lootToast, { alpha: 0 }, { duration: 0.4 });
            });
        },
    };
}
