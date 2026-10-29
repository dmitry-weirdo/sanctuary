# Screen looks

Eight full-screen looks for the `post` chain, each one fragment pass over the drawn world and under the HUD: a
curved CRT tube, scanlines, chromatic aberration, grayscale, pixelate, posterize, a vignette and a wave. Compose the
pack once and `game.post.add(name)` any of them, in the order they should apply; each returns a handle whose params
change live, so a hit can flash the vignette red, a pause drain the colour, or a transition crunch the screen into
blocks and back.

## When to use it

For a whole-screen look: the arcade cabinet (`crt`), a monitor without the curve (`scanlines`), a lens or a broken
signal (`chroma`), a pause or a flashback (`grayscale`), a low-fi style or a crunch transition (`pixelate`), a
poster or a limited palette (`posterize`), a mood or a low-health tunnel (`vignette`), water, heat or a dream
(`wave`). They work under a 2D or a 3D world, on WebGPU and WebGL2; the HUD that `world-screen` draws stays crisp
above them.

When not:

- **Bloom, a colour grade, film grain, the trippatron distortions**: `post-bloom`, `post-grade`, `post-grain` and
  `post-trippatron`, which are bigger and stay packs of their own.
- **A look on one sprite** (its own pixelate, wobble, glitch): `effects-2d`.
- **Pixel art drawn crisp from the start**: `screen.pixelArt` in the manifest, which costs nothing.
- **Depth-aware 3D effects**: `god-rays-3d`, `flare-3d`, `underwater-3d`, `ssao-3d`.

## Requires

`post`, the chain runtime, composed before it. Declared in `pack.json`; the bakery enforces it.

## API

```ts
const crt = game.post.add('crt', { curve: 0.2 });   // params at add, any left out take their defaults
crt.set('scan', 0.5);                                // live, any frame: tween it
crt.remove();                                        // out of the chain; safe twice, and the scene's exit does it
game.post.chain;                                     // the names in the chain, in order
```

`add` and `set` throw on a param the look does not have, and on a value of the wrong kind (a number for a colour, a
colour that does not parse). Looks apply in the order they are added: each reads what the one before it left. The
usual order is distortion first (`wave`, `pixelate`), then colour (`grayscale`, `posterize`), then `chroma`, then
`vignette` or `crt` last, so everything else is drawn on the tube. `POST_LOOKS`, a helper, lists each look's name,
description and default params, for a picker.

### `crt`

The picture on an old curved tube: it bulges toward the edges, scanlines run across it, the corners fall into
shadow, and outside the curved picture is the border colour, so the playfield sits in a window like a cabinet
monitor. Add it last, and not with `scanlines` or `vignette`, which it already includes.

```ts
game.post.add('crt');                                                     // the default tube
game.post.add('crt', { curve: 0.25, pitch: 3, mask: 0.35, round: 0.12, border: '#101014' });   // a cabinet monitor
```

| param | default | range | what it does |
|---|---|---|---|
| `curve` | 0.15 | 0..0.5 | how much the picture barrels: 0 flat, 0.15 a gentle tube, 0.4 a fishbowl |
| `scan` | 0.35 | 0..1 | how dark the scanlines are; 0 none |
| `pitch` | 2 | 1 and up, display pixels | the scanline period: 2 is a line every other pixel, larger is coarser (use it at a high pixel ratio) |
| `mask` | 0 | 0..1 | an aperture-grille phosphor mask: each column keeps one of red, green and blue, the others dimmed by this much |
| `vig` | 0.4 | 0..1 | how dark the corners get, falling off with the square of the distance from the centre |
| `round` | 0 | 0..1 | how far the picture's corners round, as a fraction of its half-size; 0 is square |
| `border` | `'#000000'` | any CSS colour | the colour outside the picture (opaque; alpha is ignored) |

The curve crops: at the default a strip of the source at each edge is lost off the picture, so keep HUD elements on
`world-screen` or away from the edges.

### `scanlines`

Dark horizontal lines alternating with untouched rows, an interlaced monitor or a VHS tape, without distorting the
picture. Put it late in the chain so the lines lie over the glow; not with `crt`.

```ts
const lines = game.post.add('scanlines', { strength: 0.3, size: 2 });
```

| param | default | range | what it does |
|---|---|---|---|
| `strength` | 0.3 | 0..1 | how dark the lines are; 0 invisible, 1 black |
| `size` | 2 | 1 and up, display pixels | the band height: `size` bright rows, then `size` dark ones |

The bands have hard edges and only darken; there is no bright bleed between lines.

### `chroma`

Red pulled one way and blue the other: a cheap lens, a worn tape, a glitching signal. A pixel or two is filmic; a
large split reads as damage, a hit or a teleport. Radial by default, with no split at the centre growing toward the
edges; give a `dir` and the whole screen splits along it instead. Add it before `crt` so the fringe curves with the
picture. On pixel art it blurs the art, so use it in bursts there.

```ts
const hit = game.post.add('chroma', { shift: 8 });   // tween shift back to 0 after a hit
game.post.add('chroma', { shift: 3, dir: [1, 0] });  // a straight sideways split, 3 pixels each way
```

| param | default | range | what it does |
|---|---|---|---|
| `shift` | 8 | 0 and up, display pixels | radial: the split at a corner (about five pixels at an edge's midpoint); with `dir`: the split everywhere |
| `dir` | `[0, 0]` | `[x, y]` | a direction for a uniform split (its length does not matter, y is down); `[0, 0]` is radial |

The shifted channels clamp at the screen edges, so a thin fringe of the edge colour shows. Green and alpha are
untouched.

### `grayscale`

Drains the colour, from a slight mute to pure luminance black-and-white, with perceptual weights so greens stay
brighter than blues: the pause, the game over, the flashback. Tween `amount` for a fade to grey. After `bloom` the
glow stays coloured; before it, everything goes grey together.

```ts
game.post.add('grayscale', { amount: 1 });
```

| param | default | range | what it does |
|---|---|---|---|
| `amount` | 1 | 0..1 | 0 leaves the frame as it is, 1 is full grey; values outside are clamped |

Rec. 601 luma (0.299, 0.587, 0.114), with no sepia or tint: for those, `post-grade`.

### `pixelate`

Snaps the screen to square cells so a smooth render reads as low-resolution art; each cell shows a weighted
average of its centre and four corners, so thin features do not vanish on one unlucky sample. Tween `size` for a
crunch transition. Put it early: `pixelate` then `bloom` or `crt` looks intentional, the other way round looks like
a bug.

```ts
const px = game.post.add('pixelate', { size: 6 });
```

| param | default | range | what it does |
|---|---|---|---|
| `size` | 4 | 1 and up, display pixels | the cell size: 1 is invisible, 4 a soft grid, 16 a mosaic |

Cells align to the screen, not the world, so a scrolling camera makes sprites shimmer through the grid; for
pixel-perfect scrolling use `screen.pixelArt`. Five texture reads a pixel, whatever the size.

### `posterize`

Rounds each colour channel to a few steps, so gradients turn into flat bands like a screen print or a 16-colour
palette. With `pixelate` it is a convincing fake 8-bit render; it makes bloom look stepped, so put it after bloom
only on purpose.

```ts
game.post.add('posterize', { levels: 6 });
```

| param | default | range | what it does |
|---|---|---|---|
| `levels` | 6 | 2 and up | steps for each of r, g and b: 2 is stark primaries, 6 a clear poster, 32 nearly invisible |

The result is a cube of `levels`³ colours, not a chosen palette; there is no palette lookup or dithering.

### `vignette`

Darkens the edges and corners and leaves the centre, as an old lens or a spotlight does: it pulls the eye in,
hides a busy edge, and pushed hard and animated it is the low-health tunnel. Given a colour, the edge washes toward
it instead of black: red for a hit, deep blue for night, cream for a dream. Last or near last in the chain.

```ts
const vig = game.post.add('vignette', { strength: 0.45 });
vig.set('color', '#5a0008');                                    // the edge washes toward dark red
game.post.add('vignette', { strength: 0.6, color: '#fff4e0' });  // a white dream vignette
```

| param | default | range | what it does |
|---|---|---|---|
| `strength` | 0.45 | 0..1 | 0 is off; 1 takes the far corners all the way to `color` |
| `radius` | 0.75 | 0.01 and up | the curve's shape: larger keeps the bright centre farther out, smaller spreads the falloff inward |
| `color` | `'#000000'` | any CSS colour | what the edge washes toward; alpha is ignored |

At the default radius and colour a corner keeps `1 - 1.4 × strength` of its brightness (0.35 leaves 51%). The shape is circular about
the centre, so on a wide screen the sides darken more than the top and bottom; a strong coloured vignette reads as
a frame, not a tint (for a tint, `post-grade`).

### `wave`

Sways the whole screen with slow sine waves in both axes, as if seen through water or heat haze: the underwater
level, the drunk or poisoned state, the dream, the warp-in. Tween `amp` up from 0 and back for a transition. Put
it before `bloom` and `crt`.

```ts
const wave = game.post.add('wave', { amp: 4 });   // amp 0 is still
```

| param | default | range | what it does |
|---|---|---|---|
| `amp` | 4 | 0 and up | scales `ampUv`: 4 is the baseline, 8 doubles it |
| `ampUv` | 0.004 | -1, or 0 and up | the amplitude as a fraction of the screen on both axes; -1 makes `amp` a displacement in display pixels instead |
| `freq` | 18 | 0 and up | the ripple frequency; higher is tighter |
| `speed` | 2 | 0 and up | radians per sim second; 0 freezes the pattern |
| `ySpeed` | 1 | 0 and up | the vertical ripple's speed, as a multiple of `speed` |

The vertical ripple runs at `freq * 0.8`. It runs on the sim clock, so it pauses with the game. At a large `amp` the
outermost pixels smear, because sampling clamps at the edge.

## Options

None.

## Limits

- Each look is one full-screen pass; the chain copies the frame once and ping-pongs between two textures, so five
  looks are five passes. `crt`, `scanlines`, `grayscale`, `posterize` and `vignette` read one texel a pixel,
  `chroma` three and `pixelate` five.
- A look applies to everything the world drew, under the HUD; to leave something out of it, draw it on
  `world-screen`.
- The params are numbers, colours and the one direction; a look's shape (the CRT's barrel, the vignette's circle,
  the wave's sines) is fixed. A look of your own is `registerPostEffect` in `post`.
- The names are taken: a game that registers its own `crt` with this pack composed is refused.
