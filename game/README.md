# The game

A Phaser AE v3 game. `import { game } from './engine.js'` is the whole engine; `engine.ts` is generated, so
never edit it. The manifest composes `core-2d`, everything a 2D game uses, and **`docs/make-a-2d-game.md` is the
manual: read it first**. The rest of `docs/` is reference. To add a pack (physics, tile maps, a genre's rules),
list it in the manifest and bake again: its page appears in `docs/`.
The game pauses while its page is hidden (the manifest's `backgroundPolicy`); set it to `continue` for one that
should keep running.

## What is here

- `art.ts` paints the game's pictures by name (`game.paint`, `game.pixels`), once, before the first scene. A
  sprite shows one with `texture: 'name'`, at its size.
- `main.ts` paints the art, loads the `title` pack under the loading screen, registers the scenes and starts the title, then
  loads the `game` pack quietly while the title is up. The loading screen is a bar and the percentage on the game's
  background colour (`screen.background`). The game is ready (`game.ready`) once all of that has landed and the
  loading screen has gone; debug controls run before then wait for it.
- The menus wear one UI skin. The manifest composes `ui-skins` and `ui-skin-candy` after the core, and `main.ts`
  chooses it (`game.ui.theme = 'candy'`) before the first load, so its font loads under the loading screen
  (docs/ui-skins.md). Style every widget with the skin's styles, never with style data of your own: `style: 'good'`
  for the way into play, `'warn'`, `'bad'`, `'flat'` or a colour name (`'orange'`) for the others, `'icon'` for a
  round icon button and `'heading'` for a title. Never give a button a width: it fits its icon and caption. Recolour
  the skin with its pack's options in the manifest (`{ "id": "ui-skin-candy", "options": { "color": "pink" } }`), or
  put another skin pack in its place (`ui-skin-jelly`, `-glossy`, `-bubble`, `-block`, `-cartoon`, `-wood`, `-timber`,
  `-metal`, `-bezel` or `-candystripe`) and choose its name. Keep to one: a game carries every skin it composes.
- `assets.json` lists the files the game loads. `baseURL` is set once, and each item gives a `kind`, a `key`
  and a `url`. The url is a file name under the base, or a full `https://` address for a file from anywhere
  else. Use a file by its key: `texture: 'player'` for a picture, `game.sound.sample('jump')` for a sound and
  `game.sound.music('theme')` for music.
- The files sit in named packs. `title` holds what the title screen shows (its art, the logo, its music, the
  buttons), and `game` holds everything else. Move a file between them as the screens need. A game too big to
  load in one go can split `game` into packs of its own, like `level-1` and `level-2`, and load each one before
  the level that uses it: `await game.assets.load(assets, { pack: 'level-2' })`. A pack only loads once, so asking
  for it again just waits for it.
- A `sprite` item gives a `file` without its size, and loads at the pack's `spriteSize`. Set that to 128 to
  load every sprite smaller, or give one sprite its own `size`. Pick the smallest that stays sharp at the size
  the sprite is drawn.
- Keys are read straight from `game.input` in a step: `keyDown('ArrowLeft')` while held, `keyPressed('Space')`
  the step it goes down. `input.ts` adds taps and swipes for a phone: `tapped()` for a tap or click in world units
  and `swiped()` for a swipe. A scene calls `listen()` in its `enter()` and stops listening in its `exit()`.
- `debug.ts` holds the game's debug controls (`game.cheats.add`), added at boot by `main.ts`: a jump to any
  screen is there already, and the game adds its own (a level, a power-up, win now). It also registers the run's
  state for inspection (`game.inspect.state(() => run)`) once the game keeps one.
- `scenes/` has one file per screen: `Title.ts`, `Play.ts`, `Pause.ts` and `GameOver.ts`, each saying what belongs in
  it. A title screen designed on phaser.io comes as `title-screen` in the `title` pack: with the `title-screen`
  pack in the manifest, `Title.ts` plays it as designed, Start included; without one it shows the game's name
  (`NAME`) as a heading and a Play button over a gradient. The way between them is already there: Play, Space or
  Enter starts from the title, and Play again, Space or Enter plays again from game over (Title goes back), and `Play.ts` reads taps and swipes each step. `Play.ts` puts the pause and sound buttons top right (`game.ui.pauseButton()`, `game.ui.muteButton()`, in
  the engine's icons), and the pause button, P or Escape opens `Pause.ts`, the pause menu, over play: Resume,
  Restart, Title and the sound. Use the engine's icons on buttons (`icon: 'restart'`, docs/ui.md), or the
  design's own art by name, never letters standing in for a symbol. Delete a screen the game
  doesn't need. Add one (`Settings.ts`, `LevelSelect.ts`) the same way, and register it in `main.ts`.

## Laying out the code

Use the shape most game projects have:

- `entities/` holds one file per kind of thing in the game: `Player.ts`, `Enemy.ts`, `Coin.ts`. Each file owns
  its thing: the spawn template, the data type, a `spawnPlayer()`-style function and its per-step behavior.
- `ui/` holds pieces of the interface: `Score.ts`, `Lives.ts`, `Button.ts`.
- Rules that belong to the whole game, such as levels, waves or scoring, get a file each: `levels.ts`, `waves.ts`.
- Constants go at the top of the file that uses them, in UPPER_CASE: `const JUMP_SPEED = 620;`. A value two
  files need lives in the file that owns the idea, and the other imports it.
- Keep one idea per file, keep files small, and give everything a name that says what it is.
