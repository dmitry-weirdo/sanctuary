import { game } from '../engine.js';
import assets from '../assets.json';
import { getProviders } from '../bridge/providers.js';
import { resetRun } from '../run.js';

const NAME = 'Sanctuary';

interface TitlePlayer { play(file: unknown, options: { next: string; wait: () => unknown }): unknown }
const designed = (): TitlePlayer | null => {
    const player = (game as unknown as { titleScreen?: TitlePlayer }).titleScreen;
    return player && game.assets.has('title-screen') ? player : null;
};

export const Title = {
    name: 'title',
    enter(): void {
        const player = designed();
        if (player) {
            player.play(game.assets.get('title-screen'), { next: 'play', wait: () => game.assets.load(assets, { pack: 'game' }) });
            return;
        }
        const W = game.screen.width, H = game.screen.height;
        game.background.gradient('#0a0608', '#2a1018');
        game.lights.ambient('#2a1818');
        game.ui.label({
            anchor: 'center',
            y: -H * 0.18,
            w: W - 64,
            h: 140,
            text: NAME,
            style: 'heading',
        });
        game.text('A dark crypt. Click to move. Kill. Loot. Descend.', W / 2, H * 0.48, {
            size: 22,
            color: '#c0a890',
            stroke: { color: '#000000', width: 2 },
        });
        let starting = false;
        const start = (): void => {
            if (starting) return;
            starting = true;
            resetRun(getProviders().stats.createHero('Wanderer'));
            void game.assets.load(assets, { pack: 'game' }).then(() => game.scenes.go('play'));
        };
        game.ui.button({
            anchor: 'center',
            y: H * 0.14,
            h: 96,
            text: 'Enter the Crypt',
            style: 'good',
            icon: 'play',
            onClick: start,
        });
        game.step('title', () => {
            if (game.input.keyPressed('Space') || game.input.keyPressed('Enter')) start();
        });
    },
};
