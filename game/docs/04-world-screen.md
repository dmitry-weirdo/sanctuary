# Screen-space layer

A screen-space world: logical pixels, origin top-left, never scrolls. For HUDs,
menus and overlays, and for the panels and highlights that sit behind the
game's pieces. Its `hud` and `overlay` layers draw over the whole world and
after the lighting pass, so a heart in the corner stays put while the camera
moves and is never lit, fogged or post-processed. Its `underlay` is the other
half of the sandwich: fixed to the screen the same way, but drawn inside the
world's stack, over the world's backdrop and under its pieces.

## When to use it

Any game with a HUD, a score, a title screen, a pause menu, a fade panel. A game
that shows nothing but the world can leave it out. Pairs with `typography` for
labels and `render-texture` for a painted minimap or bar; the `debug` overlay
draws over it. 2D; composes beside one 2D world.

Put a thing on `underlay` when it belongs BEHIND the pieces: a translucent frame
behind a board, a highlight under the tile or card a tutorial points at, a panel
the units stand on. On `hud` the same frame darkens every tile and unit on the
board, and the highlight paints over the very card it points at.

## Requires

Nothing of its own; a 2D world to sit in, and `render-webgpu` to draw.

## API

### Spawning into it

```ts
game.spawn({ id: 'heart', x: 20, y: 20, frame: Art.HEART, layer: 'hud' });   // stays put while the camera moves
game.spawn({ id: 'fade', x: game.screen.width / 2, y: game.screen.height / 2, width: game.screen.width, height: game.screen.height, layer: 'overlay', tint: '#000000', alpha: 0 });
```

Layers (back to front): `underlay`, then `hud`, `overlay` unless the manifest
says otherwise. Within a layer, `z` then spawn order. Positions are an object's
centre, in logical pixels. A spawn that names no layer lands on `hud` in a game
with no other world.

| Layer | Draws | Use it for |
|---|---|---|
| `underlay` | over the 2D world's first layer, under the rest of the world | board frames, tile and card highlights, panels behind pieces |
| `hud` | over the whole world | score, hearts, buttons, cards held in the hand |
| `overlay` | over the HUD | fades, pause panels, dialogs |

A board game, side-on world `["bg", "board", "units"]`, with the default
`world-screen`:

```ts
const W = game.screen.width, H = game.screen.height;
game.spawn({ id: 'backdrop', x: W / 2, y: H / 2, width: W, height: H, frame: Art.SKY, layer: 'bg' });
// behind the board, in screen pixels: it never darkens a tile or a unit
game.spawn({ id: 'frame', x: W / 2, y: H / 2, width: 280, height: 280, layer: 'underlay', tint: '#000000', alpha: 0.5 });
for (const t of tilesToShow) game.spawn({ id: 'hint', x: t.x, y: t.y, width: 32, height: 32, layer: 'underlay', tint: '#ffd84a', alpha: 0.4 });
// the pieces, in the world, on top of the frame and the hints
game.spawn({ id: 'knight', x: 112, y: 144, frame: Art.KNIGHT, layer: 'units' });
// the score, over everything
game.spawn({ id: 'score', x: W - 40, y: 16, layer: 'hud' });
```

To lift the underlay up the world's stack — highlights over the tiles, under the
units — name the layer it sits on: `{ "underlayAbove": "board" }`.

### `game.screen`

- `layers` — the layer names, back to front: `underlay` first.
- `width`, `height` — the logical size, for laying things out.
- `vw(f)`, `vh(f)` — a fraction across or down, so `vw(0.5)` centres whatever the policy resolved to.
- `cssScale` — CSS pixels per LOGICAL pixel, live. 1 headless, and wherever the two coincide.
- `px(n)` — **real display pixels**, in logical units.

```ts
score.x = game.screen.width - 8;
```

### Logical pixels, and how to ask for real ones

A logical pixel is whatever the fit made it. A pixel-art page authored at 270 logical units, filling a 928px
window, has a `cssScale` of 3.44 — so a 10-unit HUD label lands as 34 real pixels.

That is the right default: a HUD that scales with the game looks deliberate on any display, and a pixel-art
HUD wants to be chunky. `px()` is for when it is not — a corner readout that should hold its size as the
window grows, or a label ported from somewhere that measured in real pixels (v2's `drawHud` is CSS pixels
and says so). Dialling the number down by hand is not the same thing: it does not track the window, and it
lands on sizes no font can draw legibly.

```ts
const px = game.screen.px;
game.vector.text('TILE TRACE', px(6), px(12), { size: px(8), style: { width: px(1.3), screen: true } });
```

## Options

- `layers` — the layers drawn OVER the world, back to front. Default `['hud', 'overlay']`. `underlay` is always added under them; listing it first changes nothing, listing it anywhere else is an error.
- `underlayAbove` — the 2D world layer the underlay sits directly above, and so under every world layer after it. Default: the 2D world's first layer, its backdrop (`back` in `world-side`, `floor` in `world-topdown`, `bg` in most custom lists). A name no 2D world declares fails at start.

## Limits

- Coordinates are logical pixels; with `fit: letterbox` the physical size differs and a screen object is scaled with everything else.
- Both WebGPU and WebGL2 draw the tables' `space: 'screen'` correctly, including automatic renderer selection, and both draw `underlay` inside the world's stack.
- `underlay` is drawn with the world, so whatever lights or post-processes the world (`lighting-2d`, `post`) reaches it, as it reaches the backdrop under it. Only the layers over the world escape that.
- With no 2D world (a screen-only game, or a 3D world alone) `underlay` is simply the bottom screen layer: under `hud`, over everything else.
- The pointer's raw position is in screen space already; do not run it through `toWorld` for a screen object.
- No camera of its own: no zoom, no scroll.
