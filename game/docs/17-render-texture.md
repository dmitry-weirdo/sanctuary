# Render texture

The draw verbs, on one object. A render texture is a sprite whose frame is a
canvas you paint, and what you paint shows from the next frame: before each
frame the pack pushes every texture painted since the last one to the GPU, and
only that texture re-uploads. It has an id, a layer, a depth, bounds in the
overlay — it is a thing in the roster, never a pixel on the screen: the draw
verbs of a graphics object, behind one object the roster can see, sort and list.

## When to use it

For anything drawn from data rather than from art: a minimap, a radar, a health
bar, a chart, a procedural panel, a trail. Do not use it for text you could set
with `typography`, or for a static shape you could paint once into an atlas frame —
a texture you never repaint is an atlas frame with extra steps. Pairs with
`world-screen` for HUD panels and `tween` to animate the handle. 2D only.

## Requires

A 2D world (`world-topdown` or `world-side`); `world-screen` if the texture
should sit in a HUD layer.

## API

### `game.texture.create(spec)` → `TextureHandle`

Spawns the object and returns the painter. `spec`: `width`, `height` (pixels,
rounded, minimum 1; each defaults to the screen's size), optional `id` (default
`'texture'`), `x`, `y` (default 0, or the screen's centre when `width` and
`height` are both left out), `layer`, `tags` (default `['texture']`), `visible`,
and `clear` (default true: start transparent). Throws where `OffscreenCanvas` is
unavailable.

```ts
const map = game.texture.create({ id: 'minimap', width: 128, height: 96, x: 560, y: 60, layer: 'hud' });
map.handle.alpha = 0.8;                         // it is a handle: move it, tint it, tween it
```

### The handle

- `handle` — the roster `Handle` of the sprite.
- `width`, `height` — the texture size in pixels.
- `flushes` — how many times the texture has been pushed to the GPU, by `flush()` or before a frame.
- `destroy()` — remove the object, the same as `handle.kill()`. Its region is kept for the next texture of the same size.

### The verbs (each returns the handle, so they chain)

- `clear(color?)` — wipe to transparent, or fill with a CSS colour.
- `rect(x, y, w, h, color, alpha?, rot?)` — a filled rectangle; `rot` in radians about its centre.
- `line(x0, y0, x1, y1, width, color, alpha?)` — a round-capped stroke.
- `poly(points, width, color, alpha?, closed?)` — a stroked polyline; fewer than two points draws nothing.
- `fill(points, color, alpha?)` — a filled polygon; fewer than three points draws nothing.
- `circle(cx, cy, r, color, alpha?)` — a filled disc.
- `ring(cx, cy, r, thickness, color, alpha?)` — a stroked circle.
- `text(str, x, y, { font, color, align, baseline, alpha })` — canvas text; default `16px sans-serif`, white, left, top.
- `sprite(frame, x, y, w?, h?, { rot, alpha, tint })` — a frame, on any atlas page or a picture's own texture, centred at x,y; `tint` multiplies it.
- `draw(fn)` — the escape hatch: `fn(ctx)` gets the 2D context, saved and restored around it.
- `flush()` — push the paint to the GPU now. Not needed: before each frame the pack pushes every texture painted since the last one.

```ts
map.clear('#00000080').rect(4, 4, 120, 88, '#102030').circle(64, 48, 3, '#ff4040').ring(64, 48, 20, 1, '#ffffff40');
game.step('minimap', () => { map.clear('#00000080'); for (const e of game.roster.tagged('enemy')) map.circle(e.x / 10, e.y / 10, 2, '#ff4040'); });
map.text('LEVEL 3', 64, 80, { font: 'bold 12px monospace', align: 'center' });
map.sprite(Art.HERO, 64, 48, 16, 16, { rot: hero.rot });    // an atlas frame into the texture
map.draw(ctx => { /* anything the 2D context does */ });
```

## Options

None.

## Limits

- A small texture lives in the atlas, so its size counts against it (2048² unless the manifest sets `atlas`). A big one gets a texture of its own: wider or taller than 1024 pixels, or larger than a quarter of the atlas's area. A 1280×720 screen-sized texture is big; it re-uploads whole each frame it is repainted.
- Killing a texture's object frees its region for the next texture of the same size, so replacing a label with a new one of the same size costs nothing. Textures of new sizes still take new regions: to change what a label says, repaint it (`clear()`, then draw) rather than creating another.
- Each push is an upload. The pack's own push runs at most once a frame per texture, however many verbs painted it; calling `flush()` after every verb adds an upload each time.
- Coordinates are texture pixels, origin top-left; the object's `x`, `y` place its centre in the world or on the screen like any sprite.
- `sprite()` paints a copy of the frame's pixels, from whichever atlas page or picture's own texture holds them: an animated frame does not stay live in the texture.
- `alpha` on a verb sets the canvas's global alpha for that verb only; `handle.alpha` fades the whole object.
