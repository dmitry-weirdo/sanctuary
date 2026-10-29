import { game } from '../engine.js';

/**
 * The pause menu, opened over play by the pause button (`game.ui.pauseButton()` in Play.ts) or by P or Escape:
 * `game.scenes.push('pause')` holds play beneath it, and this scene runs while play waits, so the menu can move.
 * Resume is `game.scenes.pop()`, which carries play on from where it stopped.
 *
 * The buttons use the engine's icons (`icon: 'play'`, docs/ui.md): never spell a button's meaning out in letters.
 * When the design has its own art for them, `icon` takes a picture by name. The menu wears the skin main.ts chose;
 * a button takes the skin's styles (`style: 'good'`, `'bad'`, a colour such as `'orange'`), never a style of its own,
 * and no width: the window's column sets it, and the caption shrinks to fit. Add what the game needs (a settings
 * line, the level's goal); delete Title if the game has no title.
 */
export const Pause = {
    name: 'pause',
    enter(): void {
        const W = game.screen.width, H = game.screen.height;
        // The game dimmed beneath, then the menu, which drops in.
        game.ui.panel({ anchor: 'center', w: W, h: H, safeArea: false, style: { fill: '#000000a0', radius: 0, border: 0, bevel: 0, gloss: 0, shadow: 0 } });
        const menu = game.ui.window({ anchor: 'center', w: Math.min(W - 96, 460), h: 'auto', title: 'Paused', titleHeight: 56, layout: { padding: 24, gap: 14, align: 'stretch' } });
        game.ui.button({ parent: menu, h: 80, text: 'Resume', style: 'good', icon: 'play', onClick: () => game.scenes.pop() });
        game.ui.button({ parent: menu, h: 72, text: 'Restart', icon: 'restart', onClick: () => game.scenes.go('play') });
        game.ui.button({ parent: menu, h: 72, text: 'Title', icon: 'home', onClick: () => game.scenes.go('title') });
        game.ui.muteButton();
        menu.ui.y = -H;
        game.tween.to(menu.ui, { y: 0 }, { duration: 0.35, ease: 'easeOutBack' });
        game.step('pause', () => {
            if (game.input.keyPressed('Escape') || game.input.keyPressed('KeyP')) game.scenes.pop();
        });
    },
};
