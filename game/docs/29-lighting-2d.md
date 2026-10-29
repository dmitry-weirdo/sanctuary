# 2D lights and shadows

Additive colored light for top-down and side-on games: point lights and spot
cones with a falloff exponent, candle flicker, hard or soft shadows thrown by
the level's walls, an over/under layer per light, and an ambient color the
scene is multiplied down to so unlit places go dim rather than black. Lights
are roster objects with a `light` sub-object; move them like anything else or
pin one to an object with `follow`. World layers above `unlitAbove` are drawn
after the lighting, untouched by it: fog of war stays black under a torch.
`modulate()` swaps the additive glow for lamp light: the lights multiply the
scene, so a lit floor shows its own color and texture instead of a haze.

## When to use it

Torches in a dungeon, a lamp in the rain, a glow under the ball, a searchlight
sweeping a yard, a guard's lantern in a stealth game with fog of war. Set a dark
ambient first or the lights have nothing to add.
Shadows are opt-in per light: a plain glow costs two triangles and thousands
are fine; a shadowed light costs a visibility fan per frame (twelve of them
when soft), so keep shadow-casters to dozens. 2D only.

## Requires

A 2D world (`world:2d`) and a WebGPU or WebGL2 backend. It uses `visibility-2d`'s class
for the occluder set (a library import, not a composed pack).

## API

### `game.lights`

```ts
game.lights.ambient('#1a1a2a');                                      // scene-scoped: the previous ambient returns on exit
game.lights.modulate(0.3);                                           // lamp light, the lights' color at 0.3; scene-scoped too
const torch = game.lights.point({ follow: player, radius: 220, color: '#ffb060', intensity: 1.2, flicker: 0.35, shadows: true, softness: 8 });
const lamp = game.lights.spot({ x: 90, y: 60, radius: 380, dir: 0.8, cone: 0.7, color: '#7ab0ff', shadows: true, softness: 0 });
game.lights.point({ follow: ball, radius: 90, color: '#ff6a3d', layer: 'under', falloff: 1.2 });   // lights the floor beneath the sprites
game.lights.occluders.addRect(x - 16, y - 16, 32, 32);             // walls that cast shadows (a Visibility2d)
torch.light.intensity = 0; torch.light.on = 0;                     // dim it, or skip it
game.lights.count; game.lights.visible; game.lights.visibleShadow;  // live, drawn last frame, of those shadowed
game.lights.unlitAbove;                                             // the manifest's option, or null
game.lights.modulating;                                             // the tint while modulating, or null
```

- `point(o?)` / `spot(o?)` — spawn a light (owner `lighting-2d`, tag `light`,
  invisible) and return its handle. Options: `x`, `y`, `radius` (point 240, spot
  360), `color`, `intensity` (1), `falloff` (2), `flicker` (0), `flickerSpeed`
  (1), `phase` (0), `layer` ('over'), `shadows` (false), `softness` (6),
  `follow`; spot adds `dir` (0) and `cone` (0.9 rad, full angle).
- `ambient(hex)` — the multiply-down color; `#ffffff` is none. Scene-scoped.
- `modulate(tint?)` — lamp light instead of the additive glow (below); `tint`
  0..1, default 0.3. `modulate(false)` returns to the glow. Scene-scoped.
  Both are: when a scene exits, the value from before it returns, however
  many times the scene changed it (a key that toggles the mode is fine).
- `occluders` — the `Visibility2d` shadowed lights cast against; its bounds
  are set to the view each frame.
- `count`, `visible`, `visibleShadow` — numbers for the HUD and the profiler.
- `unlitAbove` — the last world layer lighting touches, or null (all of them).
- `floor` — the last world layer under lights light, or null (the backdrop only).
- `modulating` — the tint while modulating, or null for the glow.

### The `light` sub-object

`type` (0 point, 1 spot), `radius`, `color`, `intensity`, `falloff`, `dir`,
`cone`, `flicker`, `flickerSpeed`, `phase`, `layer` (0 over, 1 under),
`shadows` (0/1), `softness`, `on` (0/1). All live; all in world units or
radians.

`layer` is when the light is drawn, not which layers it lights. An `over` light
is added after the lit world layers, so it brightens every pixel under it,
sprite or floor. An `under` light lights the backdrop beneath every sprite:
opaque sprites hide it, translucent ones show it through by their
transparency, and the ambient does not dim it, so a glow under the ball reads
in a dark room. A floor made of sprites (tiles, flagstones) hides it like any
other sprite unless its last layer is named in `floor`: then the under lights
light those layers too, and only the sprites above them hide them. Neither keeps an overlay dark in the glow: a
light adds its color even to black, so a fog sprite in a lit layer glows under
a torch. Put the overlay above `unlitAbove`, or use lamp light, where black
stays black.

### How it draws

Each light is a fan of triangles carrying its parameters: its visibility
polygon from `occluders` when it casts shadows (a disc of twelve sample points
when soft, each at a twelfth of the intensity — the union is the penumbra), or
a quad over its reach when it does not. The fragment stage does the per-pixel
falloff (`(1 - d/r)^falloff`, the spot's cone as a smoothstep) and adds,
premultiplied, so overlapping colors mix. Passes: `lighting-under` (after
`backdrops`, before `sprites`) clears the target's alpha when there is an under
light in view, so the sprites leave their coverage in it; `lighting` (after
`sprites`, before `sprites-over`, `post` and `screen`) multiplies the scene by
the ambient (or does lamp light's multiply and tint), adds the under lights ×
(1 − coverage), sets alpha back to 1, and adds the over lights; the renderer's
`sprites-over` then draws the world layers above `unlitAbove`, if it is set. A HUD is never lit;
`world-screen`'s `underlay`, drawn inside the world under its pieces, is lit
with it unless it sits above `unlitAbove`. Flicker is two layered sines on the
sim clock, so it pauses and replays. The same passes run on WebGPU and WebGL2.

### Lamp light: `modulate`

By default the over lights are a glow: the scene is multiplied down to the
ambient and each light adds its color on top. Over a dark ambient that reads
as a colored haze laid over a black room, because the light's color stands in
for the floor's. `modulate(tint)` lights the way a lamp lights a room instead:

```
light     = the over lights' summed brightness, capped at 1
lit world = scene × (ambient + (1 − ambient) × light)
          + the over lights' summed color × tint
```

The surface's own color times the light reaching it: what a light falls on
shows its own color and texture, exactly its own under a full light, and what
it misses sinks to the ambient as before. The tint (0..1, default 0.3) adds the
lights' own color on top for warmth; 0 adds none, so a white floor under an
orange torch stays white and black stays black. The light's `intensity`,
`falloff`, flicker, cone and shadows shape its brightness exactly as they do
the glow's; since the sum is capped at 1, an intensity above 1 widens the fully
lit pool rather than over-brightening it.

```json
{ "id": "lighting-2d", "options": { "ambient": "#0c0c14", "modulate": 0.3, "unlitAbove": "world" } }
```

```ts
game.scenes.register({ name: 'keep', enter() {
    game.lights.ambient('#0c0c14');
    game.lights.modulate(0.55);                  // stone stays stone under the torches; the warmth is on top
} });
game.scenes.register({ name: 'title', enter() { game.lights.modulate(false); } });   // a glowing title card
```

It applies to the over lights and the lit world layers only. Under lights stay
a glow on the bare floor, and the world layers above `unlitAbove` are drawn
after it, unlit, in either mode. With no over light in view it is the plain
ambient multiply.

How it draws, on both renderers: the over lights are summed into a light map of
their own (RGBA8, the size of the target: the eight bits cap the sum at 1, and
a soft light's twelve twelfths still add up to one light), then two fullscreen
passes read it pixel for pixel: one multiplies the scene by the factor above,
one adds the tint. Neither writes the target's alpha, so a transparent
background stays transparent. That is one texture the size of the screen, the
over lights drawn into it instead of onto the scene, and two fullscreen
triangles a frame.

### Fog of war and other overlays the light must not touch

Give the world a layer for the overlay above the lit ones and name the last lit
layer in `unlitAbove`. Everything up to it is dimmed and lit; the layers above
it are drawn afterwards exactly as authored, and post effects still apply.

```json
{ "id": "world-topdown", "options": { "layers": ["floor", "world", "fog"] } },
{ "id": "lighting-2d", "options": { "ambient": "#0c0c14", "unlitAbove": "world" } }
```

```ts
const fog = game.fog.create({ cols, rows, memory: true });                         // the fog pack decides what is seen
// each cell a black tile in the 'fog' layer: alpha 1 unseen, 0.6 explored, 0 in view
tile.alpha = fog.state(c, r) === 'visible' ? 0 : fog.state(c, r) === 'explored' ? 0.6 : 1;
game.lights.point({ follow: guard, radius: 160, color: '#ffcc66' });             // lights the floor and the guard, never the fog
```

The `fog` pack draws nothing itself; it supplies the state, and the game puts
its tiles in the unlit layer. The cut is one place in the stack: a layer can
only be unlit if every layer above it is too. A name that is not a layer of a
2D world is an error in dev (and, in production, logged once while every layer
stays lit); so is a renderer too old to have the `sprites-over` pass.

## Options

- `ambient` — the starting multiply-down color. Default `#ffffff` (none).
- `modulate` — start in lamp light at this tint (0..1), as `modulate(tint)`.
  Default none: the additive glow.
- `unlitAbove` — the last 2D world layer lighting touches; the world layers
  above it are drawn after the lighting, unlit. Default none: every world layer
  is lit, as before. Needs render-webgpu 3.0.0-2 or render-webgl2 3.0.0-3.
- `floor` — the last 2D world layer that is floor to the under lights: they
  light it and the layers below it, and the sprites above it hide them. Default
  none: only the backdrop is floor. At or below `unlitAbove`. The renderer draws
  those layers first in its `sprites` pass, then lets lighting-2d clear the
  coverage, then draws the rest (its `world-floor` hook). Needs render-webgpu
  3.0.0-3 or render-webgl2 3.0.0-5; an older renderer is reported, and every
  sprite then hides the under lights.

```json
{ "id": "world-topdown", "options": { "layers": ["floor", "world", "fog"] } },
{ "id": "lighting-2d", "options": { "ambient": "#16161f", "floor": "floor", "unlitAbove": "world" } }
```

## Limits

- Under lights read the sprites' coverage from the target's alpha, so anything
  translucent over them shows them through and opaque sprites hide them, which
  is the point; a sprite drawn additively counts as covering by its alpha. That
  needs an opaque background (the screen's `background` without alpha below
  1): on a transparent one they are drawn before the sprites and the ambient
  dims them.
- In the glow, lights add their color to whatever is beneath them, black
  included: a dark overlay in a lit layer is lit. Use `unlitAbove`, or lamp
  light with a tint of 0. With a tint above 0 lamp light adds that much color
  to black too.
- Lamp light's sum is capped at 1 by its eight-bit light map, so overlapping
  lights never over-brighten a surface past its own color.
- `vector-2d`'s world vectors are drawn after the lighting (never lit) and after
  the `unlitAbove` layers, so they show over a sprite fog layer.
- Soft shadows cost twelve visibility fans per light per frame; `softness: 0`
  costs one. Plain glows cost nothing of the sort.
- The occluder set is one for the pack; a light cannot have its own walls.
- Lights are culled by their reach circle against the view; a light just off
  screen still draws if its circle touches it.
- The ambient is a multiply, not a color: it cannot add light. Use an under
  light or a backdrop for a lit floor. Modulating, it is the floor of the
  multiply: an ambient of `#ffffff` leaves the scene as it is.
- Lights do not cast shadows from sprites, only from segments the game adds.
