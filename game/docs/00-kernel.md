# The Phaser AE kernel — what every game has

Import `game` from `./engine.js` (and `signals`, when you read signals). It is the whole API: the kernel on this page
plus one key per pack the manifest composes, each with its page in `docs/`. A pack the manifest does not name does not
exist in the game — until you add it.

## Before you build it, add the pack

Packs are not only genre templates. Most of what a game shows already exists as a pack, drawn by the engine's own
shaders, styled by data and crisp at any size. Add `{ "id": "<pack>" }` to the manifest's `packs` (after any pack it
requires) and bake: its API appears on `game` and its page in `docs/`. Hand-building one of these from rectangles,
sprites or text is the commonest reason a game looks cheap. Don't.

| the game needs | add | and write |
|---|---|---|
| a health, timer, progress, loading, XP, stamina, ammo or boss bar; a cooldown ring; a gauge; a bar over each enemy | `bars` | `const hp = game.bars.create({ anchor: 'top-left', x: 16, y: 16, max: 100, label: '{value}/{max}' }); hp.value = 72;` — it animates there. Ten styles (`style: 'neon'`), any colour, rounded or slanted, gloss, glow, segments, rings, and zones that turn it red as it empties |
| buttons, panels, windows, menus, toggles, sliders, dropdowns, text fields; a pause and a sound button | `ui` | `game.ui.button({ anchor: 'center', h: 96, text: 'Play', style: 'good', icon: 'play', onClick: () => game.scenes.go('play') })` — no width: it fits its icon and caption; `game.ui.pauseButton()` |
| menus that look like a mobile game's: glossy buttons that press into a lip, chunky stroked captions, round icon buttons | `ui-skins`, then ONE of `ui-skin-candy`, `-jelly`, `-glossy`, `-bubble`, `-block`, `-cartoon`, `-wood`, `-metal` | `game.ui.theme = 'candy'` (a new game has it already); the skin's styles `'good'`, `'bad'`, `'orange'`, `'icon'`, `'heading'`, never style data of your own; recolour with the pack's options (`"color": "pink"`) |
| a look of the game's own for every widget (calm, flat, retro-computer) | `ui` | `game.ui.defineTheme({ name: 'crypt', styles: { … } })`, or `game.ui.loadTheme(url)` for a `phaser-ae-ui-theme` file; then `game.ui.theme = 'crypt'` |
| text: a score, a caption, a title, a paragraph | `typography` | `game.typography.label({ x: 16, y: 16, text: 'Score 0' })` |
| panels, frames and buttons from the game's own art | `nine-slice` | its page |
| a conversation, speech bubbles, a visual novel | `dialogue` | its page |
| a title screen | `title-screen` | its page |
| on-screen touch buttons and a thumb stick | `controls-touch` | its page |
| fades, irises and wipes between scenes | `transition` | its page |

`bars` and `ui` need `typography` before them. The 2D, 3D and vector cores (`core-2d`, `core-3d`, `core-vector`)
already bring `typography` and `ui`, so a HUD bar is one more line in the manifest: `{ "id": "bars" }`. For anything
else — a genre's rules, physics, lighting, particles — search the pack catalogue by the everyday word ('health bar',
'joystick', 'match-3', 'tile map') before writing it yourself.

## Input and browser lifecycle

`game.input` is the player's input, polled in a step. It reads nothing while the game is paused or a menu has captured it, never sees a key or pointer the UI claimed, and mutes presses, actions, pointers and gestures for a quarter of a second after every scene entry (`keyDown` excepted), so a key mashed as the player dies does not dismiss the screen that follows. Raw `game.kernel.input` remains available to UI and debugging tools. A pack can hold `input.captureWorld()` and cancel the returned token when done; keys and pointers held through it do not replay. Blur, a hidden page and lost pointer capture release held input and drags.

For a tap or a key press, read a latched edge: `pointer.pressed`, `keyPressed(code)`, an action's `pressed` or a rig's `justPressed`. Each is true for one step even when the press went down and up between two steps. Comparing `down` from one step to the next misses a click or tap shorter than a frame.

```ts
// poll it in a step; it reads nothing while paused or under a menu
if (game.input.keyPressed('ArrowUp')) walk(0, -1);       // KeyboardEvent.code; keyDown(code) while held, keyReleased(code)
game.input.bind('push', ['Space', 'Enter']);             // once, at boot; then any of its keys:
if (game.input.action('push').pressed) push();           // .held, .pressed, .released
const p = game.input.pointer;                            // the first pointer, or null: mouse, finger or pen
if (p?.pressed) tapAt(p.x, p.y);                         // logical screen px: game.camera.toWorld(p.x, p.y) for world units
// Swipes, taps, long presses and drags arrive as gestures, at a layer ('world' for play, 'ui' over it):
const swipes = game.input.gestures('world', { onSwipe: e => turn(e.direction), onTap: e => tapAt(e.x, e.y) });
```
`e.direction` is `'up' | 'down' | 'left' | 'right'`; `onPan` gives a drag's `start`, `move` and `end`, and
`onDoubleTap` and `onLongPress` are there too. Any handler may return `false` to keep it from the layers below. A
gesture subscription is not the scene's: make it in the scene's `enter()` and end it in its `exit()` with
`swipes.cancel()`.

The manifest's `backgroundPolicy` is `'continue'` by default. Set `'pause'` for a single-player game that should hold simulation while hidden. This hold is independent of manual pause, so returning to the tab does not dismiss a pause menu. The audio pack suspends sound while the page is hidden; its `suspendWhenHidden: false` option keeps it playing when the simulation also continues.

Screen safe insets (notches, rounded corners, a software keyboard) are logical pixels, computed from CSS safe-area values and the visual viewport. Root UI and touch controls respect them; edge-to-edge art can opt out. Standalone HTML includes `viewport-fit=cover`.

## Objects

Everything on stage is a roster object, spawned from data. There are no classes.

```ts
const crab = game.spawn({
    id: 'crab',                 // becomes crab-1, crab-2 … never reused
    texture: 'crab',            // the picture, by name: painted (game.paint) or loaded (assets.json)
    x: 100, y: 80,              // world units, y down; x,y is the object's CENTRE
                                // the size is the picture's; width alone (or height) keeps its shape; scale: 2 doubles it
    layer: 'world',             // a layer the world declares; depth is derived, never set
    tags: ['enemy'],            // queries and collision rules are by tag
    tint: '#ffffff', visible: true, rot: 0, z: 0,
    anims: { walk: { strip: 'crab', fps: 8 } },   // all the picture's frames, in order
    data: { vx: 0, hp: 3, cooldown: 0 },   // THE object's state: typed from this literal, read as crab.data.hp. Never a Map beside the roster.
});
crab.x += 40 * dt;              // properties are live; writes are the sim
crab.play('walk'); crab.texture = 'crab-hurt'; crab.setTexture('crab', 1); crab.setFrame(0); crab.destroy();
if (!crab.alive) ...            // after destroy a handle is inert, never reused
```
With no picture and no size, an object is a 32×32 white square (tint it for a placeholder). `color` is the same
value as `tint` and `yaw` the same as `rot`, by the names 3D and vector code use; `scale` sets `sx`, `sy` and `sz`.
A pack can claim a spawn key of its own: `mesh` and `model` (3D), `shape` (vector), `collide`, `body`, `pointer`.

**Leave what spawn() returns inferred.** `const crab = game.spawn(...)` keeps
`crab.data.hp` a number. Where you must NAME the type — a parameter, a field, a
list — use `Sprite` (or its other name `Obj`: `import type { Sprite } from './engine.js'`), never `Handle`: it
carries every composed pack's data (`crab.fsm`, `crab.collide` …). A bare `Obj`
is ANY object, so its `data` is `Record<string, unknown>`; say which data it
holds with `Obj<{ vx: number; hp: number; cooldown: number }>`. Writing
`const crab: Obj = game.spawn(...)` throws the literal's types away and every
`crab.data.hp` becomes `unknown`. Declare a data shape with `type`, never
`interface`: an interface has no index signature, and `spawn()` refuses it.

```ts
type CrabData = { vx: number; hp: number; cooldown: number };
const spawnCrab = (x: number, y: number): Obj<CrabData> => game.spawn({ ...CRAB, x, y, data: { vx: 0, hp: 3, cooldown: 0 } });
function hurt(c: Obj<CrabData>): void { c.data.hp -= 1; }   // typed; c.fsm, c.collide … too
```

Kinds that recur are plain templates: `const CRAB = { tags: [...], texture: 'crab' }; game.spawn({ ...CRAB, x, y })`.

## Art

```ts
// art.ts — pictures by name, painted once with the 2D canvas (no document, no window)
game.paint('crab', 28, 20, (ctx, i) => { /* draw frame i in the picture's own units */ }, { frames: 2 });
game.pixels('key', ['.YY.', 'Y..Y', '.YY.', '.Y..', '.YY.'], { Y: '#ffd34d' }, 4);   // pixel art: a character a pixel
game.spawn({ id: 'crab', texture: 'crab', x, y });         // sized by its picture
crab.setFrame(1);                                          // frame 1 of its own picture (frame: 1 at spawn does the same)
// a loaded picture or strip (assets.json) is shown the same way, by its key: texture: 'crate-sun'
```
`paint` draws at twice the picture's size (`{ res }` changes it) so it stays sharp on a high-density screen, and a
sprite shows it at the size given. A big painting gets a texture of its own, as a big loaded picture does, and so
does one the atlas has no room left for. `crab.frame` is the engine-wide frame number (every picture's frames share
one numbering, `game.assets.frames(key)` is a picture's first), which is why `setFrame` exists.

## Queries — never keep a second list

```ts
for (const e of game.roster.tagged('enemy')) ...
game.roster.near(x, y, radius);  game.roster.inRect(x, y, w, h);  game.roster.at(x, y, accept?);
game.roster.byId('crab-3');   // or byId('player') when exactly one 'player' is alive — but prefer keeping the handle spawn() returned
```
`near` finds every object whose bounds reach the circle, `inRect` every object whose box overlaps the rectangle, and
`at` the front-most visible object under a point (all in world units). Objects of a scene suspended beneath a pushed
one are left out of every query.

## Verbs — one import, one object or ten thousand

```ts
import { move, teleport, rotate, scale, tint, show, hide, kill, play, tag, untag } from '@phaser-ae/kernel/verbs';
tint(game.roster.tagged('enemy'), '#ff4444', { for: 0.12 });   // auto-restores; verbs skip dead handles, so a signal about something killed this step is safe
play(crab, 'walk'); kill(crab);       // play() every step is fine: it does not restart a running anim
teleport(ship, 0, ship.y);           // a respawn or a cut: no sweep across the screen (any jump over 256 units snaps on its own)
// A WRAPPING world (asteroids, endless runners) is the world pack's `wrap` option: positions, drawing, camera, queries and collision all wrap. Never wrap a coordinate yourself.
```

## Per-step logic

```ts
game.step('player', dt => { if (game.input.keyDown('ArrowRight')) player.x += 150 * dt; }, { before: 'collision' });
game.frame('trail', alpha => { /* once per drawn frame: immediate drawing goes here, never in a step */ });
```
`dt` is the fixed step in seconds (1/60 by default); a frame runs zero, one or several steps. Both are the current
scene's and end with it. Never read the clock yourself; never use `setTimeout`, `Date.now` or `performance.now`.

## Loading — a stack of anything, with a job to watch

**Load everything the game needs before `game.start()`.** That is the PRELOAD: one list, every level's files
in it, fetched and made ready under the loading screen, so nothing stops to load later. The preload lasts until
the first scene enters (`game.assets.preloading` turns false). A load started after that is silent, with no
loading screen, and is for the rare file the game cannot know about in advance. For a deliberate loading screen
later, between chapters say, call `game.preloader.run(items)`.

Text font assets load through `game.typography.load()`.

```ts
const job = game.assets.load([
    { kind: 'image', key: 'tiles', url: '/assets/gridtiles.png', w: 32, h: 32, cols: 14, rows: 10 },   // into the atlas: game.assets.frames('tiles')
    { kind: 'image', key: 'splash', url: '/art/splash.png' },                                           // a full-screen picture, whole, at the size it was made
    { kind: 'image', key: 'ghost', draw: () => sheet(), w: 16, h: 16, cols: 4 },                      // art the game DREW — same atlas, no file
    { kind: 'json', key: 'level1', url: '/levels/1.json' }, { kind: 'json', key: 'level4', url: '/levels/4.json' },
    { kind: 'text', key: 'credits', url: '/credits.txt' }, { kind: 'xml', key: 'ui', url: '/ui.xml' },
    { kind: 'binary', key: 'ship', url: '/models/ship.glb' },
    { kind: 'audio', key: 'boom', url: '/sfx/boom.ogg' },                                               // decoded in the job: game.sound.sample('boom') plays at once
    { kind: 'audio', key: 'theme', url: '/music/theme.mp3', stream: true },                              // music, kept as the file: game.sound.music('theme')
    { kind: 'font', key: 'title', url: '/fonts/Bangers.woff2', family: 'Bangers' },                       // a render texture can draw with it
    { kind: 'video', key: 'intro', url: '/intro.mp4' },
], { retries: 2, retryDelay: 0.5, concurrency: 6 });
job.progress; job.current; job.loaded; job.total; job.failed;   // poll each step for a bar
await job;                                                     // the JOB is awaitable; never rejects, so read job.ok and job.failed
await game.start();
game.scenes.go('title');                                       // the first scene: the preload is over
game.assets.get<Level>('level1');                              // typed by the caller; throws on an unknown key
```

**A list in a file.** `assets.json` holds the same list as data, with a base URL set once so each item names a file
rather than repeating a long address. Its files sit in named ASSET packs (groups of files, nothing to do with the
engine's packs):

```json
{ "baseURL": "https://cdn.example.com/my-game/", "spriteSize": 256, "packs": {
    "title": [
        { "kind": "image", "key": "title", "url": "title.webp" },
        { "kind": "audio", "key": "theme", "url": "theme.mp3", "stream": true } ],
    "game": [
        { "kind": "sprite", "key": "pip", "file": "pip" },
        { "kind": "sprite", "key": "boss", "file": "boss", "size": 128 },
        { "kind": "image", "key": "badge", "url": "https://other.example.com/badge.png" } ] } }
```

```ts
import assets from './assets.json';
await game.assets.load(assets, { pack: 'title' });   // title.webp → https://cdn.example.com/my-game/title.webp
await game.start();
game.scenes.go('title');
game.assets.load(assets, { pack: 'game' });          // quietly, while the title is up
```

**Asset packs load when the game needs them.** Here `title` holds what the title screen shows, loaded under the
loading screen, and `game` holds the rest, loaded quietly while the title is up. A game names and splits its asset
packs as it likes (`level-1`, `level-2` …) and loads each one before it is needed. An asset pack loads once: asking
for it again, while it loads or after, gives the same job. So a scene that needs one can always
`await game.assets.load(assets, { pack: 'game' })`, and only waits if it has not landed yet. `load(assets)` with no
pack loads every one, and an `items` list in place of `packs` loads as one.

**A sprite comes in sizes.** A `sprite` item names its file without the size, and the loader fetches
`<file>-<size>.webp`: `pip-256.webp` above, `boss-128.webp` for the one that says its own `size`. The file's
`spriteSize` (default 256) is the size every other sprite loads at, so loading them all smaller is one number, not an
edit to every file name. The size picks the copy fetched, never how big the sprite is drawn: choose the smallest that
stays sharp at the size the game draws it. A sprite loads exactly as an image does, `frames(key)` and all.

The base goes in front of every RELATIVE url. A url that is already absolute (`https:`, `data:`, `blob:`, `//host/…`,
or a root path `/…` on the page's own server) is fetched as written. `game.assets.baseURL` sets a base for every
`load` and `loadImage`, the file's `baseURL` wins over it, and a job's `{ baseURL }` option wins over both. Each
item is checked as it loads, because JSON types every `kind` as a plain string: an unknown kind or a missing url
throws, naming the item.

A job is **thenable**, so `await game.assets.load([...])` waits for it. Its `done` promise resolves with nothing,
because a promise that resolved with the (thenable) job would await it again and never settle.

A finished job means READY, not just downloaded: work a file needs before use (decoding audio) happens inside
the job, so it is covered by the bar and by `await job`, and the first use never waits on it.

**Load pictures whole.** A title screen, a background or a portrait goes into `assets.load` as a plain image item,
straight from its URL at the size it was made, and the engine decides where it lives. Sprites and sheets are packed into the
atlas; a picture whose frame is wider or taller than 1024 px, or would take more than a quarter of the atlas, gets a
texture of its own instead, uploaded once with mipmaps so it stays smooth at whatever size it is drawn. Draw it like
any frame, in a world layer or a HUD layer:

```ts
game.spawn({ id: 'splash', texture: 'splash', x: 360, y: 640, width: 720, layer: 'floor' });   // 720 wide, its height from its shape
```

The key, `frame(key)` and the frame index are the same whichever way it was stored, and `backdrop.background('splash')`
draws it too. A sheet stays in the atlas while it fits on a page and otherwise gets one texture for all its frames.
`atlas: false` on an item gives any image its own texture; `atlas: true` packs one the rule would not — do that for an
image a 3D mesh wears as its `texture`, or that particles, `fx` effects or a render texture's `sprite()` draw, since
those read the atlas. Each picture is a draw of its own, which is right for the handful of big images a screen shows.

**The atlas never fills.** It is pages of `atlas` pixels square (2048 by default): when a page has no room, the next
strip opens another, and every renderer draws from every page. A strip's frames stay on one page, and
`assets.addStrips` keeps a set together, such as a model's colour, normal and roughness maps, which one draw reads.
Sprites on different pages draw in separate batches, so raise `atlas` in the manifest (4096) to keep a lot of large art
on one page.

**Adding the same picture again is safe.** A scene's `enter` runs every time the scene is entered, so art made there
is made again: `addStrip`, `addGrid`, `paint` and `pixels` with a key already in use and the same frame size and count
repaint those frames in place and return the same index, and loading an image under its key from the same url again
lands at once with the frames it has. A different size takes new frames, and the key moves to them.

`{ silent: true }` loads in the background with no loading screen, even during the preload; after the preload
every load is silent unless it passes `silent: false`. Progress, `done`, `failed` and the hooks work either way,
so a game can draw its own indicator. `game.assets.track(label, work, { silent })` brings your own asynchronous
preparation under the same rule and into the same bar.

Every item is retried with a doubling delay, then listed in `failed`, and a warning names it on the console; the job
never rejects; `job.retry()` tries what failed again as a new job (the loading screen's Retry button). One URL
fetches once. Hooks: `assets.loadStart`, `assets.itemLoaded`, `assets.itemFailed` (with `attempt` and `final`), `assets.loadDone`, `assets.activity` (with `silent`) and `assets.prepare` (a pack readies an item inside its job). Headless every item resolves blank so a replay runs. The `preloader` pack draws the bar.

**The game is READY** once it has started, its first scene has drawn a frame, the loading screen has gone and every
file asked for so far (the background `game` asset pack too) has landed: `await game.ready`, or `game.isReady`. A file asked
for later does not take it back. Before it, a debug control is queued and runs at that moment, and a pause from the
page around the game is remembered and applied then. A scene that shows art from an asset pack it loads later still
awaits that pack: `await game.assets.load(assets, { pack: 'level-2' })`.

## Timers, chance, signals

```ts
game.after(2, respawn);   const t = game.every(0.5, spawnWave);   t.cancel();      // on the game clock, pause with it
game.rng.between(0, 10); game.rng.int(1, 6); game.rng.pick(list); game.rng.chance(0.2);   // never Math.random
for (const s of signals.read('anim.complete')) if (s.anim === 'pop') kill(s.handle);      // in a step: what the previous step emitted
```
Kernel signals: `spawn`, `kill`, `anim.complete`, `anim.marker`. Packs add their own (their page says which). A
signal is a record, not a call: what one step emits, the next step reads as an array, so read every topic you care
about in every step. Timers made before the first scene last for the game; every other timer is its scene's.

`Math.sin`, `Math.atan2`, `Math.pow`, `a ** b` and the other transcendental functions give the same bits in every
browser and in Node: a build replaces them with the kernel's fixed algorithms, which engines would otherwise compute
differently in the last bit. Write them as usual. A seed and the same input then replay the same game on any machine.

Code without a game, such as a pack's pure rules, a level generator or a worker job, makes its own stream with
`createRng(seed)` from `@phaser-ae/kernel`: the same draws as `game.rng`, never `Math.random` or a generator of its own.
`rng.snapshot()` returns four numbers to put in a save, and `rng.restore(state)` repeats the draws from there. Rules
whose state is plain JSON keep the stream inside it: `s.rng = [...createRng(seed).snapshot()]`, then
`createRng(s.rng).int(1, 6)` draws and advances that array in place, so cloning or saving the state saves the stream.

## Curves

```ts
import { createSpline, catmullRom, catmullRom1 } from '@phaser-ae/kernel';
const path = createSpline([[0, 0, 0], [10, 2, 5], [20, 0, 0]]);   // centripetal: never loops on uneven spacing
const [x, y, z] = path.at(0.5);   path.length;   path.tangent(0.5);   path.atDistance(12);   // by arc length
catmullRom(p0, p1, p2, p3, t);   catmullRom1(a, b, c, d, t);   // one span; the scalar form for value curves
```
Points are plain arrays of any length. `closed: true` loops back to the first point; `alpha` 0 is the classic uniform
curve, 0.5 (the default) centripetal. Use these rather than writing a spline.

## Undo, redo and replay

```ts
import { createHistory, createRng } from '@phaser-ae/kernel';
const run = createHistory({
    seed: game.rng.int(0, 0xffffffff),
    create: seed => newBoard(createRng(seed)),           // pure in the seed
    apply: (board, move) => board.legal(move) ? board.play(move) : { ok: false, reason: 'not there' },
});
run.apply(move);   // { ok: true, result } or the refusal; a refused move is not recorded
run.undo(); run.redo(); run.seek(3); run.reset(seed);
save.set('run', run.snapshot());   run.restore(save.get('run'));   // a seed and the moves; a bad save changes nothing
```
A history records the seed and the moves, never the states: undo plays the run again one move shorter. For rules that
are slow to replay, `checkpointEvery: 20` keeps a copy every twenty moves. `merge` folds a move into the one before it,
so two timed `advance` moves undo as one, and `limit` refuses moves past a cap instead of dropping old ones.
`fingerprint` makes `restore` check that a save replays to the state it was saved in. One history per rule set; a
pack's rules should use it rather than keep stacks of past states.

## Scenes, camera, commands

```ts
game.scenes.register({ name: 'play', enter() { ... }, exit() { ... } });  game.scenes.go('play');   // exit() runs while the scene's objects still exist
game.scenes.push('pause');   // THE GAME PAUSE: 'play' freezes beneath — anims, timers, brains, its steps — and keeps rendering; 'pause' runs on top
game.scenes.pop();           // resume. push('hud', { suspend: false }) runs in parallel instead.
game.camera.x; game.camera.zoom; game.camera.bounds = { x, y, w, h };  game.camera.toWorld(sx, sy);
// A 2D world starts the camera at the screen centre (width/2, height/2): world (0, 0) is the screen's top-left corner until the camera moves.
game.commands.pause(); game.commands.resume();   // THE SHELL PAUSE: the whole clock holds — no step, timer or anim runs; frames still draw. For the page around the game, not for Esc
game.commands.mute(); await game.commands.screenshot();
```
Registering a scene name again replaces that scene (the last definition wins), so a scene registered inside another
scene's `enter` survives the outer scene running again. Every `define` in the engine works the same way: defining a
name again replaces the definition, live where the pack can, and an identical definition changes nothing.
Leaving a scene disposes of EVERYTHING it made — objects, timers, steps, collision rules, effectors, joints, gravity and bounds changes, ambient light, camera bounds, the follow target — so `go('play')` is a clean restart and a popped pause menu tidies itself. You never clean up. The screen is never yours:
no `document`, no canvas, no resize handling — the world gives you world units, and `app.resize` tells the packs.

## Debug controls

```ts
game.cheats.add({ name: 'level', does: 'Start at level n, the levels before it cleared', args: 'n: 1-5',
    run: n => { startAt(Number(n)); return `level ${n}`; } });
game.cheats.add({ name: 'infinite-lives', does: 'Lives never run out', run: () => { run.infinite = !run.infinite; }, on: () => run.infinite });
game.cheats.add({ name: 'win', does: 'Clear this level now, the way the game clears it', run: () => clearLevel() });
game.cheats.list();  game.cheats.run('level', '4');   // what a tool or the panel calls
```
Every game has debug controls: the ways into it that playing would take minutes to reach. Jump to a level, a wave or
a screen; give a power-up, lives or money; switch on infinite lives; win or lose now. `bake play` runs them (`cheat`
lists them, `cheat level 4` runs one), so whoever checks a build reaches any part of it in one command; a person opens
a panel of them with the backquote key (`), or with `?cheats` in the address, which adds a button for a phone.
- **Add them once, at boot** (in `main.ts`, before the first scene), not in a scene: they are the game's, and work
  from any screen. A name is lowercase words joined by `-`. `run` gets the words typed after the name as strings.
  Adding a name again replaces that control, so one added in a scene's `enter` still works when the scene runs again.
- **A jump starts the game as a player would find it there:** the earlier levels' progress in place, the lives and
  score a player would have. **An outcome goes through the game's own path:** `win` calls what clearing a level
  calls, so the end screen, the score and the sounds are the real ones. Otherwise what is checked is not what a
  player gets.
- **Keep the run's state in one object** (level, lives, score, power-ups) that a control can set, rather than spread
  across scenes and loose variables: a jump is then a few lines. **Register it once** with `game.inspect.state(() =>
  run)`, beside the debug controls: every inspection then reports it, so a reviewer's note says "level 14, 1 life,
  score 8400" from the game itself.
- **Before the game is ready** (`game.ready`) `cheats.run` queues the control and answers "queued until the game is
  ready"; it runs the moment the game is.
- **Few and general:** `level n` rather than a control per level, `give <item>` rather than one per power-up.
- A switch has `on()`, so the panel shows it; `run` flips it. Packs add theirs the same way.

## Holding, advancing and inspecting: for tools, not game code

```ts
game.clock.hold();                 // off the wall clock: nothing runs until advance
await game.advance(2);             // 2 s of game time now, as fast as the machine can: the same 120 fixed steps
await game.advance(0.5, { fps: 30 });   // draw 30 frames a game-second on the way (default 10); files loading hold time still
game.clock.release();              // back on the wall clock, with no burst for the time held
game.inspect();                    // the game as plain data: clock, scenes, input, loads, every object, each pack's state
game.inspect('frog');              // an id or prefix · a tag · a layer · an asset key ('frog-hop') · a pack ('sound') · { x, y } in world units
await game.ready;                  // the moment the game can be played; game.isReady after it
game.inspect().ready;              // false while it loads, with assets.progress 0..1: what a host shows as loading
game.inspect().state;              // the run's state, as game.inspect.state registered it
```
A held game stamps input with its own time, so a press held across `advance(0.1)` lasts 0.1 s. `inspect` reports
each object's centre, drawn size, picture (`frog-hop[2]`: the strip and frame), visibility, animation and `data`,
plus what packs know: a text's words and box, a widget's kind, label and state, the music playing and the sounds
asked for lately, and whether audio is still locked waiting for the first tap. A pack adds to it by registering an
`InspectorDef` under the registry kind `'inspect'`. `bake play` drives a game this way; a game never needs to.
`window.game` is the composed game from `createGame` on, while it still loads; `window.PhaserGameReady()` is called
at the ready moment, and `window.PhaserGamePlaying()` once, when a scene named `play` first enters.

## Stop, restart and release

`stop()` is idempotent and resumable: it stops ticking and removes the input and page listeners, keeping the canvas, the packs and every object. A later `start()` reattaches them without repeating the boot hooks. Time spent stopped is not simulated. `destroy()` stops, terminates the workers, exits every scene, runs the global owned disposers, calls each pack's `detach()` in reverse order, emits `app.dispose` and removes the canvas. Further starts are no-ops.

`scenes.go(name)` replaces the **whole stack**, exiting top to bottom; `push`/`pop` manage overlays. After `pop` the scene beneath is current again, so what is spawned, scheduled or stepped from then on belongs to it and lives until it exits. Suspended scenes do not run their `game.frame` callbacks. A scene already on the stack cannot be pushed again.

## Pack workers

For pack authors. The bakery bundles each composed pack's `workers` jobs (`pack.json`: `{ "solve": "src/solve.ts" }`, a module whose default export is `run(input)`) as separate module workers. A pack calls `k.workers.run({ kind: '<pack>/<job>', input, transfer, signal })` and never hands a Worker to game code. The pool is lazy and bounded (two threads and 64 waiting jobs by default); it rejects an unknown job or a full queue, passes on worker errors and cancellation, and settles finished jobs in submission order at frame boundaries. That fixes the order results arrive in, not the frame: a slower machine may deliver a frame later. Destroy terminates the threads and rejects pending jobs. Results settle only while the game is ticking, so a pack whose API awaits a job should check `k.running` rather than hang before `game.start()`.
