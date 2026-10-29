// Sanctuary — Diablo-like dungeon crawl. Swap game systems via bridge/providers.ts.
import { game } from './engine.js';
import assets from './assets.json';
import { paintArt } from './art.js';
import { addDebugControls } from './debug.js';
import { Title } from './scenes/Title.js';
import { Play } from './scenes/Play.js';
import { GameOver } from './scenes/GameOver.js';
import { Pause } from './scenes/Pause.js';
import { Character } from './scenes/Character.js';

paintArt();
game.ui.theme = 'metal';
await game.assets.load(assets, { pack: 'title' });

game.scenes.register(Title);
game.scenes.register(Play);
game.scenes.register(GameOver);
game.scenes.register(Pause);
game.scenes.register(Character);
addDebugControls();

await game.start();
game.scenes.go('title');

game.assets.load(assets, { pack: 'game' });
