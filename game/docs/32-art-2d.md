# Procedural placeholder art

A hundred and five ready-made generators (tiles, characters, items, vehicles, scenery, fruit, gems, space objects, fantasy props, street furniture, creatures) that each draw into a canvas the kernel's atlas takes directly. Zero art files: a prototype gets a tileset and a cast without one asset request, and swapping in real art later changes the frame a sprite points at and nothing else.

## When to use it

- **A prototype, a jam entry, a test or a demo** that has no art yet, or a game whose art is meant to stay simple.
- **Art that should vary**: a seeded tile per level, a recoloured enemy per wave (every generator takes its colours as options).

When not:

- **One specific picture of your own** (a cake, a logo, a ship of a particular shape): draw it with the kernel's `game.paint(key, w, h, ctx => { … })`, which registers a named picture (several frames with `{ frames }`) at the screen's density. **Pixel art from rows of characters** is `game.pixels(key, rows, palette)`. Both come with every game; art-2d is for when a ready-made picture will do.
- **Line art on the vector layer**: `vector-art`. **Soft, star and spark particle sprites**: `particle-textures`. **Tileable noise textures** (terrain, clouds): `procgen`. **Wood, paper and stone UI panels**: `ui-texture-wood`, `ui-texture-paper`, `ui-texture-stone`.

2D, and any 3D object that wears a texture.

## Requires

Nothing. It touches no DOM and needs no backend: every generator returns an `OffscreenCanvas`, so it runs in a worker, a build step or a page alike.

## API

Composing the pack puts every generator on `game.art2d`. Each one is also a documented helper, so a game may import it by name; both forms are the same function:

```ts
import { grassTile, stoneTile, waterTile, personSheet, tileset } from '@phaser-ae/art-2d';
// …or, without the import: game.art2d.grassTile({ size: 16 })
```

### Tiles into a tilemap

Every tile is a square canvas that repeats seamlessly (except `plankTile`, below). `tileset(canvases)` packs a list into one strip, and `game.assets.addStrip` registers it, frame `first + i` being tile `i`:

```ts
const strip = tileset([grassTile({ size: 16 }), stoneTile({ size: 16, seed: 4 }), waterTile({ size: 16 })]);
const first = game.assets.addStrip('tiles', strip, 16, 16);
// Data value n draws frame first + n - 1 (0 is empty); grass 1, stone 2, water 3.
game.tiles.map({ tile: 16, layers: [{ layer: 'world', data: LEVEL, firstFrame: first }] });
```

`tileset` sizes every cell by the **first** tile, so give all the tiles one size. An empty list gives a 1×1 clear canvas.

### Sheets into animations

Four generators return a horizontal strip of `size × size` frames; everything else returns one `size × size` frame.

| sheet | frames | layout |
|---|---|---|
| `characterSheet(opts)` | 4 | a round-headed figure walking, facing right (`flip.x` turns it left); takes `body`, `outline`, `leg` instead of the sprite colours |
| `personSheet(opts)` | 6 | 0 idle, 1–4 run cycle, 5 jump; `color` is the shirt and cap, `accent` the skin, `detail` the trousers |
| `coinSheet(opts)` | 4 | a coin spinning face, turning, edge-on, turning |
| `torchSheet(opts)` | 3 | a wall torch's flame swaying left, centre, right |

`addStrip` without a count registers every frame the strip holds:

```ts
const hero = game.assets.addStrip('hero', personSheet({ size: 16 }), 16, 16); // six frames
const player = game.spawn({
    x: 40, y: 200, width: 16, height: 16, frame: hero,
    anims: {
        idle: { frames: [hero], fps: 1 },
        run: { frames: [hero + 1, hero + 2, hero + 3, hero + 4], fps: 10 },
        jump: { frames: [hero + 5], fps: 1 },
    },
    play: 'idle',
});
game.assets.addStrip('coin', coinSheet({ size: 12 }), 12, 12);
game.spawn({ x: 120, y: 180, width: 12, height: 12, anims: { spin: { strip: 'coin', fps: 8 } }, play: 'spin' });
```

### Single pictures

```ts
const ruby = game.assets.addStrip('ruby', game.art2d.ruby({ size: 24 }), 24, 24);
game.assets.addStrip('blue-slime', game.art2d.slime({ size: 24, color: '#4aa8ff', accent: '#bfe4ff' }), 24, 24);
game.spawn({ x: 100, y: 100, width: 24, height: 24, frame: ruby });
```

### The catalogue

A generator marked **seed** has a random element and reads `seed`; the rest draw the same picture every time.

**Tiles** — `TileOptions` (`size`, `base`, `detail`, `accent`, `seed`):

| tile | draws |
|---|---|
| `checkerTile` | two-tone checkerboard (`base` and `detail` are the squares): the retro scrolling floor |
| `brickTile` | offset brick courses with mortar joints |
| `grassTile` | green with dark flecks and bright blades · **seed** |
| `stoneTile` | grey stone block, bevelled, speckle cracks · **seed** |
| `dirtTile` | brown earth with darker and lighter clods · **seed** |
| `waterTile` | blue with seamless ripple rows |
| `sandTile` | beige grains and faint dune lines · **seed** |
| `metalTile` | sci-fi panel: bevel, inset recess, corner bolts |
| `plankTile` | a thin one-way-platform plank: the surface fills the top ~30 % of the cell, the rest is clear |
| `crateTile` | wooden crate with a diagonal brace |
| `lavaTile` | dark crust, glowing crack veins, embers · **seed** |
| `iceTile` | pale blue with a sheen and hairline cracks · **seed** |
| `snowTile` | near-white with blue-grey flecks · **seed** |
| `woodTile` | horizontal planks with grain · **seed** |
| `cobbleTile` | four rounded cobbles over mortar |
| `gravelTile` | grey with light and dark grains · **seed** |
| `hedgeTile` | dense leafy clumps (maze walls) · **seed** |
| `roadTile` | dark asphalt with grit · **seed** |
| `circuitTile` | PCB with green traces and a solder pad |
| `mudTile` | wet earth with puddles · **seed** |
| `marbleTile` | pale stone with two wrapping veins |

**Sprites** — `SpriteOptions` (`size`, `color` for the body, `accent` for the highlight, `detail` for the shadow or outline, `seed`):

| group | generators |
|---|---|
| Pickups and items | `star`, `heart`, `key`, `bomb`, `gem` (green, faceted), `diamond`, `sword`, `shield`, `coinSheet` (4 frames) |
| Characters | `characterSheet` (4 frames), `personSheet` (6 frames), `wizard`, `robot`, `alien`, `ghost`, `slime`, `claude` (the Claude mascot, a sunburst disc with a face) |
| Creatures | `bat`, `frog`, `snail`, `eyeball`, `pumpkin` (carved), `nose` (a face part, for a face builder) |
| Vehicles | `car` and `truck` (side view), `spaceship` (top-down, nose up), `rocket` (nose up) |
| Fruit | `apple`, `cherry`, `orange`, `lemon`, `grapes`, `banana`, `strawberry`, `pear`, `watermelon`, `peach`, `plum` |
| Gems and treasure | `ruby`, `emerald`, `sapphire`, `amethyst`, `pearl`, `goldBar`, `ring`, `crown` |
| Fantasy | `potion`, `scroll`, `axe`, `staff`, `chest`, `skull` |
| Space | `planet`, `ringedPlanet`, `moon`, `asteroid` (**seed**: its outline), `satellite`, `ufo` |
| Shoot-'em-up enemies | `crabAlien` and `squidAlien` (invaders), `interceptor` (nose down), `bomber`, `mine` |
| Street | `house`, `building` (**seed**: which windows are lit), `trafficLight`, `signpost` (points right), `lamppost`, `hydrant` |
| Scenery and plants | `tree`, `pineTree`, `bush`, `rock`, `cactus`, `flower`, `tulip`, `sunflower`, `mushroom`, `cloud`, `sun` (with a face), `torchSheet` (3 frames) |

**Maps** — square, default 64 pixels, seeded:

| map | options | draws |
|---|---|---|
| `envMap` | `EnvMapOptions`: `size`, `sky` (`'#7ec8ff'`), `horizon` (`'#f5e9d0'`), `ground` (`'#4a3b2a'`), `sun` (`'#ffffff'`, `null` for none), `seed` (`7`) | a chrome-ball reflection: sky, horizon band, ground, sun hotspot, streaks |
| `noiseNormalMap` | `NormalMapOptions`: `size`, `scale` (bump cells per edge, `5`), `strength` (`1`; `2` is heavy relief, `0` flat), `seed` (`7`) | tileable bumpy-surface normals, packed `(n + 1) / 2` in RGB |
| `brickNormalMap` | `NormalMapOptions` without `scale` | brick-relief normals that line up with `brickTile` |

**Guards**: `clampCanvasDim(n)` turns any number into a safe canvas dimension (a finite integer in `[1, MAX_CANVAS_DIM]`, NaN and infinity becoming 1), and `MAX_CANVAS_DIM` is `4096`. Every generator clamps its canvas through it.

## Options

None for the pack. Each generator takes its own options bag, every field optional:

| option | meaning |
|---|---|
| `size` | the frame's edge in pixels, default `16` (`64` for the maps); square always |
| `color` / `accent` / `detail` | a sprite's body, highlight and shadow or outline colours, CSS strings; each sprite has its own default palette and ignores a colour it has no use for |
| `base` / `detail` / `accent` | a tile's main fill, its shadow, mortar or grain, and its highlight |
| `body` / `outline` / `leg` | `characterSheet`'s colours (default `'#ffd166'`, `'#26233a'`, `'#c98aab'`) |
| `seed` | an integer for the generators marked **seed** above; each has its own default, so the same call always draws the same picture, and the other generators ignore it |

## Limits

- **Placeholder art, and it looks it**: clear at small sizes, never finished-looking. Shapes, poses and frame counts are fixed; only size, colours and (for some) the seed vary. To change a shape, draw your own with `game.paint`.
- **Square frames only.** There is no width and height pair, and `tileset` assumes every tile matches the first one's size (a larger tile spills into the next cell).
- **Clamped, never thrown**: every canvas side is clamped to `[1, 4096]`, because a zero throws on some browsers and iOS Safari runs out of memory past about 4096². A whole strip is clamped too, so a sheet's frames past 4096 pixels are cut off (`personSheet` above size 682, the 4-frame sheets above 1024).
- **`size` is pixels, not world units**: a generator draws at native pixels, and the sprite's `width` and `height` set how big it shows. Draw small and show it larger for a chunky pixel look (with the screen's `pixelArt` on); draw at the size you show it for a crisp one.
- **The maps have no consumer yet**: no v3 material sphere-maps `envMap` or samples a normal map, so on an object they show as an ordinary colour texture. They are correct maps for your own renderer or an exporter.
- **Node has no `OffscreenCanvas`**, so a generator called from a plain node script throws. The engine's headless runs supply a stand-in canvas; the pixels themselves are checked in the browser by the `art2d-test` probe, which draws every generator and counts the ones that painted.
- Randomness is the kernel's seeded stream (`createRng`), not `Math.random`, so a seed gives the same picture everywhere.
