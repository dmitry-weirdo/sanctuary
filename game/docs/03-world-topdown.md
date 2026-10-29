# Top-down world

A 2D top-down world. Within a layer, objects draw **back to front by their feet**
(`y + height/2`), so whatever is lower on screen is in front and a character
walks behind a tree without any code sorting anything. You never sort; you set
`layer`. It installs the 2D camera, publishes `toWorld` / `toScreen`, and can
wrap the whole world into a torus.

## When to use it

Games seen from above: Zelda-likes, twin-stick shooters, farming, dungeon
crawlers, a maze. Choose `world-side` instead when depth should be declared with
`z` rather than derived from where a sprite stands (a platformer, a shooter).
Pairs with `rig-follow` for the camera, `controls-2d` for input, `world-screen` for a HUD,
`collision` for overlaps, `grid-move` for tile-locked movement. 2D only; one
2D world per game.

## Requires

Nothing. It is the world; a backend (`render-webgpu` or `render-webgl2`, usually through `render-auto`) draws what it sorts.

## API

### Spawning into it

```ts
game.spawn({ id: 'tree', x, y, layer: 'world', width: 32, height: 48 });
game.spawn({ id: 'shadow', x, y, layer: 'floor' });      // always under 'world'
const w = game.camera.toWorld(pointer.x, pointer.y);     // screen → world
```

- Layers (back to front): `floor`, `world`, `fx` unless the manifest says otherwise. An unknown layer is an error.
- `world-screen`'s `underlay` (frames, highlights, panels behind the pieces, in screen pixels) draws straight after the first layer and before the second; its `underlayAbove` option moves it after another.
- The camera record is `game.camera` (`x`, `y` centre, `zoom`, `bounds`). A rig drives it; you may too.
- Nudge ordering within the same feet with `z`: a layer sorts by `y + height/2 + z`. A sheet the size of the screen (a floor, a backdrop of tiles) has its feet at the bottom of the screen, so it sorts AFTER everything else in its layer and covers it; give it a large negative `z`, or a layer of its own below.
- A layer for fog of war or a darkness overlay goes last; with `lighting-2d`, name the layer below it in `unlitAbove` so the lights do not shine through it (see the `fog` and `lighting-2d` docs).

### `game.world`

- `kind` — `'topdown'`.
- `layers` — the layer names, back to front.
- `toWorld(sx, sy)` — screen (logical pixels) to world.
- `toScreen(wx, wy)` — world to screen.
- `wrap` — the wrap size `{ w, h }`, or null. Read it for spawning at the edges; never wrap a coordinate yourself.
- `view` — what the camera is looking at now, in world units: `x`, `y` (the top-left corner), `w`, `h` and the centre `cx`, `cy`. Worked out at every read from the camera's position and zoom, so it is never a frame behind.
- `vw(f)` — the world x a fraction `f` across the view: 0 the left edge, 1 the right, so `vw(0.5)` is always the middle of the screen.
- `vh(f)` — the world y a fraction `f` down the view: 0 the top, 1 the bottom.

```ts
const edge = game.world.wrap ? game.world.wrap.w : 640;
const s = game.world.toScreen(hero.x, hero.y);
const v = game.world.view;                                  // { x, y, w, h, cx, cy } in world units
const onScreen = hero.x >= v.x && hero.x <= v.x + v.w && hero.y >= v.y && hero.y <= v.y + v.h;
game.spawn({ id: 'bat', x: game.world.vw(0.5), y: game.world.vh(0) - 24, layer: 'fx' });   // just above the view's top centre
```

## Options

- `layers` — draw layers, back to front. Default `['floor', 'world', 'fx']`.
- `wrap` — `{ w, h }` in world units: a toroidal world. Default none.

## Wrapping

If the manifest sets `wrap: { w, h }` the world is a torus: positions wrap,
everything draws at its nearest image to the camera, the camera follows across
the seam, and `near`/`inRect`/collision see across it. **Never wrap a
coordinate in game code** — the engine does it after every step. `game.world.wrap`
tells you the size (e.g. to spawn along an edge).

## Limits

- Feet sorting uses the sprite's bottom edge scaled by `sy`; a tall sprite whose feet are not at its bottom edge needs `z` to correct it.
- A layer name not in the list throws at spawn.
- Wrapping is all or nothing: a world cannot wrap on one axis only.
- The camera has no rotation in 2D (`rot` is ignored by the projection).
