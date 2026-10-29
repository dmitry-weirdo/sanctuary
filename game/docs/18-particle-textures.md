# Particle textures

Ten classic particle shapes painted into the atlas at start, white with alpha,
so an effect pack needs no image file and any emitter can tint them. They are
the frames the `vfx-*` packs draw with.

## When to use it

Whenever `particles-2d` is composed and an effect names a `particle:*` frame —
every `vfx-*` pack requires it. For a photographic bubble, petal or snowflake,
load the PNG from the assets folder with `assets.loadImage` and name that key
instead. 2D.

## Requires

Nothing. It writes into the kernel atlas; headless it registers the keys with
no pixels so a replay runs.

## API

| key | shape | made for |
|---|---|---|
| `particle:disc` | solid circle | hard round particles, original v2 untextured particles |
| `particle:soft` | radial glow, hot centre | fire, magic, glows, snow |
| `particle:flare` | glow with a four-point streak | glints, welding glare |
| `particle:ring` | a soft halo band | shockwaves, bubbles |
| `particle:star` | five-point star in a glow | sparkles, pickups |
| `particle:spark` | a thin horizontal streak | sparks, rain (align to velocity) |
| `particle:petal` | a petal with a notched tip | leaves, sakura |
| `particle:square` | a solid square with a margin | confetti, coins, debris |
| `particle:pixel` | a solid 4×4 pixel | embers, dust, pixel effects (the default frame when `size` is set) |
| `particle:smoke` | a puff with eaten-out edges | smoke, dust, clouds |

```ts
game.particles.emitter({ frame: 'particle:star', color: '#ffd166', size: 8, rate: 20 });
game.particles.emitter({ frame: ['particle:soft', 'particle:star'], rate: 20 });   // random per particle
```

`PARTICLE_TEX_KINDS` exports the list.

## Options

- `size` — texture size in pixels, square. Default 64. The pixel is always 4×4.

## Limits

- Ten shapes, all symmetric and white; an effect that needs a specific look
  loads art.
- They take ten cells of the atlas, once.
- Painted with Canvas 2D gradients: in a browser without `OffscreenCanvas`
  (none shipping) the keys exist and draw the white pixel.
