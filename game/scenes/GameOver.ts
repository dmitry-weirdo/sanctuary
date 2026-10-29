import { game } from '../engine.js';
import { getProviders } from '../bridge/providers.js';
import { resetRun, run } from '../run.js';

export const GameOver = {
    name: 'gameover',
    enter(): void {
        const W = game.screen.width, H = game.screen.height;
        const won = run.won;
        game.background.color(won ? '#0a1810' : '#1a080c');
        game.ui.label({
            anchor: 'center',
            y: -H * 0.18,
            w: W - 64,
            h: 140,
            text: won ? 'Sanctuary Cleared' : 'You Died',
            style: 'heading',
        });
        const hero = run.hero;
        const detail = hero
            ? `Level ${hero.level}  ·  Crypt ${run.floor}  ·  ${run.kills} kills  ·  ${run.bag.length} bag`
            : '';
        if (detail) {
            game.ui.label({
                anchor: 'center',
                y: -H * 0.02,
                w: W - 80,
                h: 48,
                text: detail,
                style: 'label',
            });
        }
        const again = (): void => {
            resetRun(getProviders().stats.createHero('Wanderer'));
            game.scenes.go('play');
        };
        game.ui.button({
            anchor: 'center',
            y: H * 0.1,
            h: 88,
            text: won ? 'Play again' : 'Resurrect',
            style: 'good',
            icon: 'restart',
            onClick: again,
        });
        game.ui.button({
            anchor: 'center',
            y: H * 0.1 + 112,
            h: 72,
            text: 'Title',
            icon: 'home',
            onClick: () => game.scenes.go('title'),
        });
        game.step('gameover', () => {
            if (game.input.keyPressed('Space') || game.input.keyPressed('Enter')) again();
        });
    },
};
