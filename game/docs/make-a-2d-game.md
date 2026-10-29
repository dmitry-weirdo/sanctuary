# Make a 2D game

This page is the engine for a 2D game: sprites, pictures, text, backgrounds, input, motion, sound, collisions and
scenes. Import `game` from `./engine.js`; everything below is on it. The other pages in `docs/` are reference.

## A whole game

Rocks fall; the ship dodges them with the arrow keys or the pointer. Each part is explained below.

```ts
import { game, type Sprite } from './engine.js';

const W = game.screen.width, H = game.screen.height;

// Pictures: painted once, by name, with the 2D canvas.
game.paint('ship', 48, 40, ctx => {
    const body = ctx.createLinearGradient(0, 0, 0, 40);
    body.addColorStop(0, '#9fe8ff'); body.addColorStop(1, '#2a6cff');
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(48, 40); ctx.lineTo(0, 40); ctx.closePath(); ctx.fill();
});
game.paint('rock', 40, 40, ctx => {
    ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.arc(20, 20, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a4430'; ctx.beginPath(); ctx.arc(14, 15, 5, 0, Math.PI * 2); ctx.fill();
});
game.sound.defineAll({
    hit: { type: 'noise', duration: 0.4, filter: { type: 'lowpass', freq: 1800, freqEnd: 200 }, volume: 0.8 },
});

type Rock = { speed: number };

game.scenes.register({
    name: 'play',
    enter() {
        game.background.gradient('#0b1030', '#3a2a6a');
        game.background.stars({ density: 0.6 });
        const ship = game.spawn({ id: 'ship', texture: 'ship', x: W / 2, y: H - 80, layer: 'world', tags: ['ship'] });
        const score = game.text('0', W / 2, 40, { size: 36, stroke: { color: '#000000', width: 2 } });
        let points = 0;

        game.every(0.6, () => {
            game.spawn({ id: 'rock', texture: 'rock', x: game.rng.between(20, W - 20), y: -20, layer: 'world',
                tags: ['rock'], data: { speed: game.rng.between(120, 260) } });
        });

        game.step('play', dt => {
            if (game.input.keyDown('ArrowLeft')) ship.x -= 300 * dt;
            if (game.input.keyDown('ArrowRight')) ship.x += 300 * dt;
            const p = game.input.pointer;
            if (p?.down) ship.x += (p.x - ship.x) * 0.2;
            ship.x = Math.max(24, Math.min(W - 24, ship.x));
            for (const rock of game.roster.tagged('rock') as Iterable<Sprite<Rock>>) {
                rock.y += rock.data.speed * dt;
                rock.rot += dt;
                if (rock.y > H + 40) { rock.destroy(); points += 1; score.text = String(points); }
            }
        });

        game.collide.on('ship', 'rock', () => {
            game.sound.play('hit');
            game.feel.shake(10, 0.4);
            game.scenes.go('over');
        });
    },
});

game.scenes.register({
    name: 'over',
    enter() {
        game.background.color('#200a14');
        const title = game.text('Game over', W / 2, H / 2, { size: 64, font: 'sans-bold', color: '#ff6a6a' });
        game.tween.from(title, { scale: 0.4, alpha: 0 }, { duration: 0.4, ease: 'easeOutBack' });
        game.text('Space to play again', W / 2, H / 2 + 70, { size: 24 });
        game.step('over', () => { if (game.input.keyPressed('Space') || game.input.pointer?.pressed) game.scenes.go('play'); });
    },
});

await game.start();
game.scenes.go('play');
```

## The screen

`game.screen.width` and `game.screen.height` are the game's size in pixels, whatever the window. Positions are in
the same units: (0, 0) is the top-left until the camera moves, `y` points down, and an object's `x, y` is its
**center**. Angles are radians.

The manifest's `screen` sets it: `{ "width": 720, "height": 1280, "fit": "letterbox", "background": "#10162a" }`.
`fit` is how the game meets the window: `letterbox` scales the whole screen to fit, with bars where the shapes
differ; `height` keeps the height and takes the width from the window, so a wider window sees more of the world
(read `game.screen.width`, never assume it); `fill` makes one game pixel one page pixel; `fixed` is exactly
`width` x `height` page pixels. `"pixelArt": true` keeps scaled pixels square and sharp.

## Two worlds

A 2D game is seen side-on or from above, and each is a world pack. `core-2d` composes the side-on one,
`world-side`: its layers are `'back'`, `'world'` and `'front'`, and depth within a layer is `z`. For a game seen
from above (a Zelda, a twin-stick shooter, a farm, a maze), name `world-topdown` in the manifest and it takes the
side-on world's place: its layers are `'floor'`, `'world'` and `'fx'`, and things on a layer draw back to front by
their feet, so a character walks behind a tree with nothing sorted by hand. Spawn with a layer the world has; a
spawn with no layer lands on the world's first. Either world can wrap its edges into a torus
(`"options": { "wrap": { "w": 1280, "h": 720 } }`): positions wrap, and collisions and the camera see across the seam.

## Pictures

Every picture has a name. Paint it once, before the scenes start (`art.ts` is the place), and every sprite of it is
`texture: 'name'`.

```ts
game.paint('coin', 32, 32, ctx => {
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 3; ctx.stroke();
});
game.paint('bird', 40, 30, (ctx, i) => { /* frame i of 4: wings up, level, down, level */ }, { frames: 4 });
game.pixels('heart', ['.RR.RR.', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#ff3355' }, 4);
```

- `paint(name, width, height, draw, { frames })` draws with the ordinary canvas 2D context: paths, arcs, gradients,
  `shadowBlur` for glow, `globalCompositeOperation`, text. Draw in the picture's own units; it is drawn at twice that
  density, so it stays sharp on a high-density screen, and shows at `width` × `height`.
- With `frames`, `draw(ctx, i)` runs once per frame, each clipped to its own `width` × `height`: an animation, or a
  thing's states (a button up and down, a tile's variants).
- `pixels(name, rows, palette, scale)` is pixel art: one character per pixel, `.` (or any character not in the
  palette) is clear, each pixel `scale` units square. Set `"pixelArt": true` in the manifest's `screen` to keep
  scaled pixels square.
- Paint at the size the picture is shown. A big painting (a sky, a far hill line) is fine: it gets a texture of
  its own, as does anything once the shared one is full, so there is nothing to size. `'white'` is taken: it is the
  plain square a sprite with no picture shows.
- A file is a picture too, by the key `assets.json` gives it: `texture: 'hero'` shows it.

## Sprites

```ts
const ship = game.spawn({ id: 'ship', texture: 'ship', x: 400, y: 300, layer: 'world', tags: ['player'], data: { hp: 3 } });
ship.x += 120 * dt; ship.rot = Math.PI / 4; ship.alpha = 0.5; ship.tint = '#ff8080'; ship.visible = false;
ship.scale = 2;               // or sx / sy for each axis; sx = -1 mirrors it
ship.texture = 'ship-hurt';   // another picture; setTexture('bird', 2) picks a frame of one
heart.setFrame(1);            // frame 1 of its own picture
ship.data.hp -= 1;            // its own state, typed from the literal
ship.destroy();               // gone; ship.alive is false from now on
```

- A sprite is the size of its picture. Give `width` alone (or `height`) to resize it and keep its shape, both to
  stretch it, or `scale`.
- `layer`: `'world'` for the play, `'back'` behind it, `'front'` over it, `'hud'` for what stays on screen while the
  camera moves. With no layer a sprite goes on `'back'`. `z` orders sprites within a layer.
- `id` names it for inspect (`ship-1`, `ship-2` …). `tags` are how you find it and how collisions find it.
- Frames: `frame: 2` at spawn, or `bird.setFrame(2)` later, shows frame 2 of its picture (0 is the first): a button
  up and down, a heart full and empty. Animation: `anims: { flap: { strip: 'bird', fps: 10 } }` at spawn, then
  `bird.play('flap')`.
- Find sprites, rather than keeping your own lists: `game.roster.tagged('rock')`, `game.roster.near(x, y, radius)`,
  `game.roster.at(x, y)`.
- Name the type where you must: `Sprite` (from `./engine.js`), with its data, `Sprite<{ hp: number }>`. Leave what
  `spawn` returns inferred everywhere else. Declare a data shape with `type`, not `interface`.

## Text

```ts
const score = game.text('Score 0', W / 2, 40, { size: 32, color: '#ffffff', stroke: { color: '#000000', width: 2 } });
score.text = `Score ${points}`;
game.text('Paused', W / 2, H / 2, { size: 72, font: 'serif-bold', shadow: { color: '#00000099', x: 4, y: 4 } });
game.text('Lives 3', 16, 16, { align: 'left', baseline: 'top' });
```

- `x, y` is the text's **center** unless `align` (`'left' | 'center' | 'right'`) or `baseline`
  (`'top' | 'middle' | 'bottom'`) say otherwise.
- `size` in pixels (default 24); `font` is `'sans'`, `'serif'` or `'mono'`, each with `-bold`. Colors are hex.
- `stroke` outlines the letters, up to about a twentieth of the size; `shadow` is a hard offset copy behind.
- Text sits on the `'hud'` layer, so it stays on screen; give `layer: 'world'` for text that moves with the world.
- Change `text`, `x`, `y`, `color`, `alpha`, `scale` or `visible` at any time, tween them, and `destroy()` it. An
  empty string shows nothing. `width` and `height` are its size once its font has arrived.

## Backgrounds

```ts
game.background.gradient('#1a2a6c', '#fdbb2d');    // top color, bottom color
game.background.color('#10162a');                  // or one color
game.background.stars({ density: 0.8, twinkle: 1, drift: 0.2 });   // over the color or gradient
game.background.picture('sky', 'cover');           // or a picture by name: 'cover', 'contain', 'stretch'
```

Set the background in each scene's `enter()`; a new scene starts with none. Set the color or gradient before the
stars. For scenery that scrolls with the camera, paint it and spawn it as a sprite on `'back'`.

## Graphics

For what changes as the game runs: trails, glows, a line to the target, a meter. One `game.graphics()` covers the
screen; draw on it and it shows from the next frame.

```ts
const fx = game.graphics({ layer: 'front' });
game.step('trail', () => {
    fx.clear();
    fx.draw(ctx => {
        ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 3; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(ship.x, ship.y); ctx.lineTo(target.x, target.y); ctx.stroke();
    });
});
```

It keeps what was drawn until `clear()`. `draw(ctx => …)` is the 2D context; `rect`, `line`, `circle`, `ring`,
`poly`, `fill` and `text` are short forms. It is one object on a layer, like a sprite: draw sprites with sprites,
and keep a graphics for what moves too freely to be one. `game.graphics({ width, height, x, y })` makes a smaller one.
On a world layer it stays where the camera started; when the camera moves, give it `layer: 'hud'` and draw at
`game.camera.toScreen(x, y)`.

## Input

```ts
if (game.input.keyDown('ArrowLeft')) ship.x -= speed * dt;        // held
if (game.input.keyPressed('Space')) jump();                       // went down this step
const p = game.input.pointer;                                     // mouse, finger or pen, or null
if (p?.pressed) { const at = game.camera.toWorld(p.x, p.y); tapAt(at.x, at.y); }
game.input.bind('fire', ['Space', 'KeyJ']);                       // once; then
if (game.input.action('fire').pressed) fire();                    // .held .pressed .released
```

- Key names are `KeyboardEvent.code`: `'ArrowUp'`, `'KeyW'`, `'Space'`, `'Enter'`, `'Escape'`.
- Read input in a step. `pressed` is true for exactly one step, however short the press.
- The pointer is in screen pixels; `game.camera.toWorld(x, y)` gives world units once the camera moves.
- Swipes and taps: `const g = game.input.gestures('world', { onSwipe: e => turn(e.direction), onTap: e => tapAt(e.x, e.y) })`
  in a scene's `enter()`, and `g.cancel()` in its `exit()`.
- **Move and act through `game.controls`** rather than reading keys: `game.controls.axis('move')` reads the arrows,
  WASD and a gamepad's stick as one `{ x, y }`, and `game.controls.justPressed('fire')` (also `'action'`, `'pause'`)
  any key or button bound to it. `game.controls.bind('jump', { keys: ['Space'], pad: ['a'] })` adds an intent, and
  `players` in the manifest's `controls-2d` options gives two to four players their own keys and pads.
- **On a phone**, add `controls-touch`: a thumb stick and buttons that press key codes, bound beside the keys.
  ```json
  { "id": "controls-touch", "options": { "stick": { "codes": { "left": "Touch:left", "right": "Touch:right", "up": "Touch:up", "down": "Touch:down" } }, "buttons": [{ "code": "Touch:fire", "label": "A" }] } }
  ```
  ```ts
  game.controls.bindMove({ left: ['KeyA', 'ArrowLeft', 'Touch:left'], right: ['KeyD', 'ArrowRight', 'Touch:right'], up: ['KeyW', 'ArrowUp', 'Touch:up'], down: ['KeyS', 'ArrowDown', 'Touch:down'] });
  game.controls.bind('fire', { keys: ['Space', 'KeyJ', 'Touch:fire'], pad: ['a'] });
  ```
  The controls show only on a touch device.
- A gamepad: `const pad = game.input.gamepads[0]`, then `pad.connected`, `pad.axis('lx')` (`lx ly rx ry lt rt`, -1..1)
  and `pad.button('a')` (`a b x y lb rb lt rt back start up down left right`).
- Taps on a sprite: `pointer: { onTap: () => start(), onOver: e => { e.target.tint = '#ffd166'; } }` at spawn.

<!-- shared: every-step -->
## Every step

```ts
game.step('enemies', dt => { /* dt is the fixed step in seconds */ });
game.after(2, () => spawnBoss());              // once, in 2 seconds
const wave = game.every(0.5, spawnRock);       // repeatedly; wave.cancel() stops it
game.rng.between(0, 10); game.rng.int(1, 6); game.rng.pick(list); game.rng.chance(0.2);
```

Time is the game's: steps, timers and tweens all pause with it. Use `game.rng`, `game.after` and `game.every` for
chance and time, never `Math.random`, `setTimeout` or the clock. A step, a timer and a frame belong to the scene that
made them, and stop with it.
<!-- /shared: every-step -->

## Motion and juice

```ts
game.tween.to(coin, { y: coin.y - 40, alpha: 0 }, { duration: 0.4, ease: 'easeOutQuad', onComplete: () => coin.destroy() });
game.tween.to(banner, { scale: 1.2 }, { duration: 0.3, yoyo: true, loop: true });
await game.tween.to(door, { x: 600 });          // a tween is awaitable
game.feel.shake(8, 0.3); game.feel.flash('#ffffff', 0.2); game.feel.hitstop(0.06); game.feel.zoomPunch(0.1, 0.25);
game.particles.burst({ x, y, count: 30, layer: 'front', frame: 'particle:spark', blend: 'add',
    speed: [80, 220], lifespan: [0.3, 0.6], color: ['#fff3b0', '#ff7a00'] });   // on every hit: no new object
```

Tweens move any number on anything: a sprite, a text, a sprite's `data`. A `burst` is a one-shot spray (aim it with
`angle` and `spread`, degrees); it keeps one emitter per recipe, so call it on every hit. Particle pictures:
`particle:disc`, `soft`, `flare`, `ring`, `star`, `spark`, `petal`, `square`, `pixel` and `smoke`, or a picture you
painted. For a flow, `game.particles.emitter({ follow: ship, offset, rate })`.

## Collisions

```ts
game.collide.on('bullet', 'enemy', (b, e) => { b.destroy(); e.destroy(); });   // every step they overlap
game.collide.solid('player', 'wall');                                           // keep the player out of walls
game.spawn({ id: 'ball', texture: 'ball', x, y, tags: ['ball'], collide: { shape: 0 } });   // 0 circle, 1 box (default)
```

Shapes come from each sprite's size; `collide: { radius: 8 }` makes a circle smaller than its picture. Rules
belong to the scene that made them.

## Sound

```ts
game.sound.defineAll({
    jump: { type: 'square', freq: 300, freqEnd: 600, duration: 0.1 },
    coin: { notes: [660, 880, 1320], duration: 0.18, type: 'triangle' },
    tune: [{ type: 'square', tempo: 140, notes: 'C4 E4 G4 C5 - G4 E4 C4', volume: 0.4 }],
});
game.sound.play('jump');
const stop = game.sound.loop('tune');
game.sound.music('theme', { loop: true, fadeIn: 1 });   // a music file from assets.json
game.sound.volume('music', 0.5);                        // buses: 'master', 'music', 'sfx'
game.commands.mute(); game.commands.unmute();           // what the sound button does; game.sound.muted says which
```

<!-- shared: scenes -->
## Scenes

```ts
game.scenes.register({ name: 'play', enter() { /* build it */ }, exit() { /* rarely needed */ } });
game.scenes.go('play');          // replaces the scene
game.scenes.push('pause');       // the pause menu over it, 'play' held beneath; game.scenes.pop() resumes
```

Leaving a scene removes everything it made: sprites, text, graphics, backgrounds, steps, timers, tweens, collision rules and the camera's target.
So `go('play')` again is a clean restart, and nothing needs cleaning up by hand.

For a scene change that covers the screen (a fade, an iris, a wipe), add `transition` to the manifest and call
`game.transition.go('play', { kind: 'fade' })`; for a whole animated title screen as one data file, `title-screen`.
<!-- /shared: scenes -->

## Camera

```ts
game.rig.follow(player);                          // keep it in view as it moves
game.camera.bounds = { x: 0, y: 0, w: 4000, h: H };   // never show past the level's edges
game.camera.zoom = 1.5;
```

The camera starts centered on the screen. Sprites on world layers move with it; the HUD and text stay put.

<!-- shared: tail -->
## Saving

```ts
const best = game.save.read('best', 0);
game.save.write('best', Math.max(best, points));
```

## Buttons and menus

```ts
game.ui.theme = 'candy';                         // main.ts, once: the skin the manifest composes (ui-skin-candy)
game.ui.label({ anchor: 'center', y: -160, w: 640, h: 140, text: 'Game over', style: 'heading' });
game.ui.button({ anchor: 'center', h: 96, text: 'Play', style: 'good', icon: 'play', onClick: () => game.scenes.go('play') });
game.ui.pauseButton(); game.ui.muteButton();     // top right, round icon buttons: the pause menu, and the sound
game.ui.button({ parent: menu, h: 64, text: 'Restart', icon: 'restart', onClick: () => game.scenes.go('play') });
```

`game.ui` has windows, panels, buttons, toggles, sliders and progress bars, laid out by anchors; its page in `docs/` has the
rest. A button shows one of the engine's icons with `icon`: `pause play sound-on sound-off music-on music-off restart
home settings close fullscreen fullscreen-exit back`, tinted with the button's text colour. A symbol on a button is
always an icon, never letters standing in for it ("II", "SND"). The skeleton's `Play.ts` already has the pause and
sound buttons, and `Pause.ts` the pause menu they open; when the design has its own art for them, `icon` takes the
picture's name. Widgets answer the keyboard and a gamepad as well as the pointer: Tab and the arrows move the focus,
Enter or Space presses.

**The menus wear a skin.** A new game's manifest composes `ui-skins` and one skin pack, `ui-skin-candy`, and
`main.ts` chooses it (`game.ui.theme = 'candy'`): every button, window and heading is a glossy game button on a lip
that presses down, with a chunky stroked caption. Style widgets with the skin's styles, never with style data of
your own: `style: 'good'` for the way into play, `'warn'`, `'bad'`, `'flat'` or a colour name (`'orange'`, `'pink'`,
`'blue'`…) for the others, `'icon'` for a round icon button, `'heading'` for a title, which grows with its height
and shrinks to its width. Never give a button a width: without one it fits its icon and caption, and in a column
that stretches it (`align: 'stretch'`) it shrinks them to fit. Recolour the skin with its pack's options in the
manifest, `{ "id": "ui-skin-candy", "options": { "color": "pink", "radius": 18 } }` (`color`, `surface`, `radius`,
`depth`, `roles`, `colors`), or live with `game.skins.use({ material: 'candy', color: 'pink' })`. For another look,
put another skin pack in its place: `ui-skin-jelly`, `-glossy`, `-bubble`, `-block`, `-cartoon`, `-wood`,
`-timber`, `-metal`, `-bezel` or `-candystripe`, and choose its name. Compose one: a game carries every skin it
composes. Their pages in `docs/` have the rest. A speech box that matches the skin is `dialogue`
(`game.dialogue.open({ lines })`), and a framed picture that stretches without blurring its corners is `nine-slice`.

## Bars and meters

A game's health, timers, XP, ammo, loading and cooldowns are the `bars` pack: add `{ "id": "bars" }` to the
manifest. One call makes a styled bar; set its value and it animates there.

```ts
const hp = game.bars.create({ anchor: 'top-left', x: 16, y: 16, width: 240, height: 22, max: 100, label: '{value}/{max}' });
hp.value -= 10;                                   // eases there; ghost: true leaves a chunk that drains, as in a fighting game
const time = game.bars.create({ shape: 'ring', anchor: 'top', y: 12, width: 72, max: 60, label: '{time}',   // top right is the pause button's
    zones: [{ below: 0.2, fill: '#ff3b30', pulse: 2 }] });
time.to(0, 60, () => endRound());                 // a countdown that turns red and pulses at the end
const enemyHp = game.bars.create({ follow: enemy, style: 'flat', width: 40, height: 6, ghost: true });   // rides above it, dies with it
```

Ten styles (`style: 'glossy' | 'neon' | 'blocks' | 'fighter' …`), any colour or gradient, segments, glow, stripes,
labels inside, outside or riding the fill. Use `bars` for a game's meters, never `game.ui.progress` (a
menu widget) or rectangles; its page in `docs/` has the rest.

## Debug controls

```ts
game.cheats.add({ name: 'level', does: 'Start at level n', args: 'n', run: n => { startAt(Number(n)); return `level ${n}`; } });
game.inspect.state(() => run);   // the run's state, for whoever checks the game
```

Add them once in `debug.ts`: a jump to any level or screen, a power-up, win or lose now. A jump starts the game
as a player would find it there.
<!-- /shared: tail -->

## The rules

- No `document`, `window`, `Math.random`, `setTimeout` or `Date.now`: the engine gives each of them.
- One picture per name; paint it before a sprite shows it.
- Keep a thing's state on it (`data`), and find things by tag.
- Add a pack to the manifest for what this page does not cover, and its page appears in `docs/` when the game is
  baked: HUD bars and meters (`bars`), physics (`physics-2d`), tile maps (`tiles-2d`), 2D lights (`lighting-2d`), post
  effects (`post` and `post-*`, a colour grade with `post-grade`), shaders on sprites (`sprite-shaders`), a speech box
  (`dialogue`), framed panels (`nine-slice`), video (`video`), scene covers (`transition`), a whole title screen
  (`title-screen`), a genre's rules (a platformer, a match-3, a shooter). The catalogue lists every pack with what it
  is for: search it before writing a mechanic yourself.
