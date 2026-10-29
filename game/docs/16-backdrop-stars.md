# Parallax starfield

A field of twinkling stars in three depth layers that scroll with the camera at
three different rates, so near stars slide past faster than far ones and empty
space gains depth. Stars are placed by a hash of their grid cell, so the field
is endless in every direction and identical every run. Each star has its own
size, brightness and twinkle phase.

## When to use it

The background for a space shooter, an asteroid field, a starship bridge, or
the night sky above a platformer. It is transparent between the stars, so add a
`sky` or `nebula` first and the stars blend over it; on its own it is stars on
the clear colour. It works behind a 2D world or behind 3D meshes (`core-3d`'s
`game.background.stars`). Set `drift` for motion on a screen whose camera
never moves (a menu, a fixed-screen shooter).

## Requires

`backdrops`, the runtime. Declared in `pack.json`; the bakery enforces it.

## API

```ts
const stars = game.backdrop.add('stars', { density: 1, twinkle: 1, drift: 0.2 }, { tint: '#cfe6ff' });
stars.set('twinkle', 3);              // live
stars.setColor('tint', '#ffe9c4');    // live
stars.remove();
```

| param | default | range | what it does |
|---|---|---|---|
| `density` | 1 | 0 and up | the fraction of grid cells that hold a star, scaled: 1 fills about 12% of cells, 2 is a busy field, 0.3 is sparse, 0 is empty |
| `twinkle` | 1 | 0 and up | pulse rate and strength; 0 is steady with no glints, 1 preserves the original subtle shimmer, 4 is faster with stronger contrast (strength caps at 4) |
| `drift` | 0 | any | a constant sideways scroll even with the camera still: each unit moves the three layers 8, 16 and 24 CSS pixels per sim second; negative goes the other way |

| colour | default | what it is |
|---|---|---|
| `tint` | `#ffffff` | the star colour; its alpha fades the whole field |

Each layer has its own cell size (26, 19 and 12 CSS pixels), radius (3.64,
4.18 and 3.6 CSS pixels) and parallax rate (0.15, 0.40 and 0.65: the CSS pixels
it moves for each world unit the camera moves). CSS pixels are logical pixels
times `cssScale`, so a star is the same size on the page at any device pixel
ratio and any game resolution. `set` and `setColor` throw on an unknown name; `remove` is
safe to call twice.

## Options

None.

## Limits

- One full-screen pass with three layers, each checking a 3×3 cell neighborhood per
  pixel; cheap, but not free on a phone at high DPR.
- Stars are one per cell; neighboring cells contribute across their boundaries
  so stars remain round rather than being cut in half. High `density` fills
  the grid more evenly rather than clumping.
- Parallax is taken from `view.xy`, so it follows the camera only; a screen
  without a camera move and with `drift` at 0 is a static image. Under a 3D
  world that is the camera's x and y alone: the field slides as the camera
  moves but never turns with its yaw or pitch.
- No colour variation between stars; for warm and cool stars stack two fields
  with different tints and densities.
