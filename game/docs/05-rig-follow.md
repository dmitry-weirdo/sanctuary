# Follow camera

A 2D camera that follows. Hand it the player and it keeps them inside a
deadzone around the screen centre, closing a fraction of the gap each step.
An offset frames a point beside the player, look-ahead leads in the direction
of travel, and with several targets it frames the middle of them and zooms so
all of them fit. It clamps to bounds, measures through a wrapping world's
seam, and cuts rather than sweeps when a target teleports.

## When to use it

Any 2D game whose world is bigger than the screen: a platformer, a top-down
adventure, a scrolling shooter, a two-player game sharing one screen. A
single-screen game does not need it. Pairs with `world-topdown` or
`world-side`, with `tiles-2d` for `bounds()`, with `controls-2d` for input and
with `feel` for shake on top. 2D only; for 3D use `rig-orbit` or `rig-fps`.

## Requires

A 2D world (`world-topdown` or `world-side`), for the camera it drives.

## API

### `game.rig`

- `follow(h)` — track this object, or an array of them (the camera frames their middle); `null` stops. Scene-scoped:
  cleared when the scene exits. A dead object drops out of the set.
- `target` — the first followed object, or null. `targets` — all of them.
- `deadzone` — the box around the screen centre the target may roam in before the camera moves: a number is a square
  half-size, `{ w, h }` a full rectangle. World units.
- `smoothing` — 0 locked, 1 instant; the fraction of the gap closed per step. Zoom-to-fit eases at the same rate.
- `offset` — `{ x, y }` world units from the target to the framed point.
- `lookAhead` — seconds of the target's motion the camera leads by. 0 is none.
- `snapDistance` — a one-step jump bigger than this, world units, is a teleport: the camera cuts. 0 never cuts.
- `fit` — `{ padding, minZoom, maxZoom }` zooms so every followed object stays in view, or null to leave the zoom alone.
- `bounds(rect)` — the view never leaves this rect (a tilemap's `bounds()`); `null` clears. Scene-scoped. A rect
  smaller than the view centres on it.

Every property can be changed while the game runs: widen the deadzone in a boss room, turn look-ahead off on a ladder.

```ts
game.rig.follow(player);                     // camera tracks it: deadzone, smoothing, bounds
game.rig.deadzone = { w: 160, h: 90 };       // the box the player may roam in before the camera moves (a number = a square half-size)
game.rig.smoothing = 0.08;                   // per step: speeds up after a moving target, eases to a stop behind one that stopped
game.rig.offset = { x: 0, y: -40 };          // a platformer: more sky above the hero than ground below
game.rig.lookAhead = 0.4;                    // look where the player is going: 0.4 s of their motion ahead
game.rig.bounds(map.bounds());               // the view never leaves the tilemap (scene-scoped)
```

Two players on one screen:

```ts
game.rig.fit = { padding: 64, minZoom: 0.5, maxZoom: 1 };
game.rig.follow([p1, p2]);                   // frames the middle, zooms out as they part, never past 0.5
```

## Options

- `deadzone` — number or `{ w, h }`, world units. Default 0 (the camera always centres).
- `smoothing` — 0..1 per step. Default 0.15.
- `offset` — `{ x, y }`, world units. Default `{ x: 0, y: 0 }`.
- `lookAhead` — seconds. Default 0.
- `snapDistance` — world units. Default 256.
- `fit` — `{ padding, minZoom, maxZoom }`: padding default 48 world units, zoom between 0.25 and 1 by default. Default
  off.

## Limits

- One camera. Split screen, with a camera per player, needs its own rig.
- Motion is measured from where the camera last saw the target, so look-ahead lags game code that moves the target
  after the camera's step by one step. Move the player in a step ordered `before: 'rig-follow.camera'` (or with
  `physics-2d`, which already runs first) for none.
- Zoom-to-fit acts only with two or more live targets; with one, the zoom is the game's.
- A target joining or leaving the set moves the framed point without counting as motion: no look-ahead, no cut.
