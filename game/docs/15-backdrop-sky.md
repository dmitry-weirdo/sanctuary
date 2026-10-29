# Sky gradient

A vertical two-colour gradient that fills the screen behind the world: one
colour at the top, another at the bottom, blended smoothly between them. It is
pinned to the screen, not the world, so it never scrolls. It is the plain
daytime sky for a platformer, the dawn or dusk wash behind a skyline, the deep
blue under a starfield, or a warm room tone behind a card table.

## When to use it

As the bottom of almost any backdrop stack: add it first, then `stars` or
`nebula` over it. Pick the two colours for the time of day and bend the blend
with `curve`. It works behind a 2D world or behind 3D meshes, where it is
`core-3d`'s `game.background.gradient`; for a 3D sky with a time of day, see the
table below. Leave it out if the world's tiles cover the whole screen.

<!-- shared: which-sky -->
### Which sky?

| For | Compose | What it is |
|---|---|---|
| A 2D game's sky | `backdrop-sky` (in every core bundle) | a two-colour gradient pinned to the screen; stack `backdrop-stars` or another backdrop over it |
| Most 3D games: a sky with a time of day, on any device | `sky-3d` | one full-screen pass on WebGPU and WebGL2: a time dial drives the palette, sun, ambient light and fog, with two cloud decks, stars and a moon, baked to an env map that water and PBR materials reflect |
| A physically based atmosphere with volumetric clouds, god rays and cloud shadows, in 3D or behind a 2D game | `skymax` | scattering through lookup tables and a marched cloud volume, with weather and lighting presets. WebGPU only, and far heavier. Compose it or `sky-3d`, never both |
<!-- /shared: which-sky -->

## Requires

`backdrops`, the runtime. Declared in `pack.json`; the bakery enforces it.

## API

```ts
const sky = game.backdrop.add('sky', { curve: 1.4 }, { top: '#1a2a6c', bottom: '#fdbb2d' });
sky.set('curve', 2);                // live
sky.setColor('top', '#000814');     // live — tween colours through the `color` pack for a day cycle
sky.remove();
```

| param | default | range | what it does |
|---|---|---|---|
| `curve` | 1 | above 0 | the power applied to the screen height before blending; 1 is a linear blend, above 1 holds the top colour longer and pushes the transition toward the bottom (a sunset band), below 1 pulls it up; values at or below 0 are treated as 0.01 |

| colour | default | what it is |
|---|---|---|
| `top` | `#1a2a6c` | the colour at the top edge of the screen |
| `bottom` | `#fdbb2d` | the colour at the bottom edge |

Colours are hex strings (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`). `set` and
`setColor` throw on an unknown name; `remove` is safe to call twice.

## Options

None.

## Limits

- One full-screen pass, the cheapest backdrop there is.
- It ignores the camera entirely; a sky that should move with a tall level
  wants a sprite or a custom backdrop that reads `view.y`.
- Two colour stops only. For a three-band dawn, stack a second sky over the
  first with an opaque `top` and a fully transparent `bottom` (`#00000000`): it
  fades from its own top colour into the sky beneath, and `curve` sets how far
  down the band reaches.
- The colours are mixed straight and written as they are, not premultiplied,
  while the stack blends premultiplied. A fade to fully transparent black comes
  out right, but a colour with partial alpha (`#ff880080`) adds its whole colour
  over what is beneath instead of blending, and brightens it.
