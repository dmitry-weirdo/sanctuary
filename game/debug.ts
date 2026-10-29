import { game } from './engine.js';
import { getProviders } from './bridge/providers.js';
import { run, resetRun, addToBag } from './run.js';
import { makeItem } from './systems/stubItems.js';

export function addDebugControls(): void
{
    game.inspect.state(() => run);

    game.cheats.add({
        name: 'screen',
        does: 'Go straight to a screen: title, play, gameover or character',
        args: 'name',
        run: name => {
            const n = name ?? 'title';
            if (n === 'character') game.scenes.push('character');
            else game.scenes.go(n);
            return `screen ${n}`;
        },
    });

    game.cheats.add({
        name: 'floor',
        does: 'Jump to crypt floor n (1-3) with a fresh hero',
        args: 'n',
        run: n => {
            const floor = Math.max(1, Math.min(3, Number(n) || 1));
            resetRun(getProviders().stats.createHero('Wanderer'));
            run.floor = floor;
            game.scenes.go('play');
            return `floor ${floor}`;
        },
    });

    game.cheats.add({
        name: 'god',
        does: 'Refill life and mana',
        run: () => {
            if (!run.hero) return 'no hero';
            run.hero.life = run.hero.lifeMax;
            run.hero.mana = run.hero.manaMax;
            return `life ${run.hero.life}`;
        },
    });

    game.cheats.add({
        name: 'level',
        does: 'Grant enough XP to level up once',
        run: () => {
            if (!run.hero) return 'no hero';
            getProviders().stats.applyXp(run.hero, run.hero.xpToLevel - run.hero.xp);
            return `level ${run.hero.level}`;
        },
    });

    game.cheats.add({
        name: 'loot',
        does: 'Put a rare item of each slot into the bag',
        run: () => {
            for (let i = 0; i < 5; i += 1) {
                addToBag(makeItem('rare', run.floor + 2, 0.2 * i, i / 5));
            }
            return `bag ${run.bag.length}`;
        },
    });

    game.cheats.add({
        name: 'win',
        does: 'Clear the sanctuary now',
        run: () => {
            run.won = true;
            game.scenes.go('gameover');
            return 'won';
        },
    });

    game.cheats.add({
        name: 'killall',
        does: 'Destroy every monster in the room',
        run: () => {
            let n = 0;
            for (const m of [...game.roster.tagged('monster')]) {
                m.destroy();
                n += 1;
            }
            return `killed ${n}`;
        },
    });
}
