# Shader backdrops

The background runtime. It draws full-screen shader backgrounds as the very first
thing in the frame, under every tile, sprite and 3D mesh, and stacks them in the order
you add them, each blended over the last. Every backdrop is camera-aware: each
frame it receives the visible world rectangle, so a starfield can parallax with
the camera and a gradient can stay pinned to the screen, and it runs on the sim
clock so it pauses and replays with the game. This pack owns the pass and the
shader template; it owns **no backgrounds**. Each look is its own pack
(`backdrop-sky`, `backdrop-stars`, `backdrop-nebula`) that registers a WGSL
snippet here, so a game carries only the backgrounds it uses.

## When to use it

Compose it when the world needs something behind it that is not a flat clear
colour or a big scrolling image: a sky, deep space, fog, a texture that goes on
forever. A backdrop is cheaper and lighter than a tiled background sprite and it
never runs out at the edge. Leave it out of a game whose whole screen is tiles.
It works under a 2D or a 3D world: it draws into the `backdrops` pass, after
`begin` and before both `meshes3d` and `sprites`, so in 3D it is the background
behind every mesh (`core-3d`'s `game.background` is built on it).
The usual stack is `sky` first, then `stars` or `nebula` over it.

## Requires

Nothing beyond a world (2D or 3D) and a WebGPU or WebGL2 backend (`render-auto`,
`render-webgpu` or `render-webgl2`). Each backdrop pack declares
`requires: ["backdrops"]`, so the bakery refuses `backdrop-stars` on its own.

## API

```json
{ "id": "backdrops" }, { "id": "backdrop-sky" }, { "id": "backdrop-stars" }
```
```ts
game.backdrop.add('sky', { curve: 1.3 }, { top: '#0b1a3a', bottom: '#2a4a8a' });
const stars = game.backdrop.add('stars', { density: 1.2, drift: 0.1 });   // params and colours override the pack's defaults
stars.set('twinkle', 2);              // one param, live
stars.setColor('tint', '#ffe9c4');    // one colour, as a hex string: #rgb, #rgba, #rrggbb or #rrggbbaa
stars.set({ params: { twinkle: 2, drift: 0.2 }, colors: { tint: '#ffe9c4' } });   // several at once
await stars.tween({ drift: 0.6 }, { duration: 3, ease: 'easeInOutSine' });         // eased on the sim clock
stars.params;                         // { density: 1.2, drift: 0.6, … } — the values now
stars.name;                           // 'stars'
stars.remove();                       // out of the stack; safe to call twice

const rain = game.backdrop.add('rain');   // an overlay that comes and goes
rain.hide({ duration: 0 });               // start hidden
await rain.show({ duration: 2, ease: 'cubicOut' });   // fade in
rain.hide({ duration: 4 });               // fade out; hidden, it is not drawn at all
rain.fade;                                // 0..1, how much of it is drawn now
rain.time = 0;                            // its snippet's clock, from here (a tool's scrub)
game.backdrop.background('title-art', 'cover');   // a loaded image drawn opaque under the stack; 'cover' | 'contain' | 'stretch'; null clears; scene-scoped
game.backdrop.backgroundKey;                      // 'title-art' or null
game.backdrop.stack;       // ['sky'] — names in draw order, bottom first
game.backdrop.available;   // every backdrop a composed pack registered
game.backdrop.clear();     // empty the stack
```

- `add(name, params?, colors?)` — pushes a backdrop and returns a handle. Throws
  if no composed pack registered `name` (the message lists what is available
  and names the pack to add), if a param or colour key is not one the backdrop
  declares, or if the definition exceeds sixteen params or four colours.
  Scene-scoped: the scene's teardown removes it.
- `handle.set(param, value)` — sets one number; throws on an unknown name or a
  number that is not finite.
- `handle.set({ params?, colors? })` — sets params and colours together. Every
  name and value is checked first, so a bad one throws and changes nothing.
- `handle.setColor(name, hex)` — sets one colour; throws on an unknown name. A
  missing alpha is taken as opaque.
- `handle.tween(params, { duration?, ease? })` — eases params from where they
  are to these values over `duration` seconds (default 0.5) of SIM time: it
  pauses with the game and replays exactly. A param already tweening is taken
  over from where it is; a `set` of it ends its tween. Resolves on arrival, or
  when it is taken over, set over or its backdrop removed (never rejects).
  `ease` is a name from the `maths` pack's `EASE` table (`'easeOutCubic'`,
  `'linear'`, `'sine'`), the title screen file's spelling of the same curves
  (`'cubicOut'`, `'sineInOut'`), or a function of 0..1; default
  `'easeInOutQuad'`, the `tween` pack's. An unknown name throws.
  `backdropEase(e)` (exported) resolves one.
- `handle.show({ duration?, ease? })` / `handle.hide({ duration?, ease? })` —
  fade the backdrop in to fully shown or out to nothing, the same way (default
  0.5 s). The fade multiplies its premultiplied output, so an overlay eases in
  and out over whatever is beneath, on both backends. A hidden backdrop (fade
  0) stays in the stack but is not drawn at all. `hide({ duration: 0 })` right
  after `add` starts it hidden.
- `handle.fade` — 0..1, how much of it is drawn now.
- `handle.params` — its params' values now, by name (a fresh object).
- `handle.time` — the seconds its snippet's `time` reads: the sim clock plus
  its own offset (0 at `add`). Set it to jump (a tool's scrub, a restart from
  0); it runs on with the clock from there.
- `handle.remove()` — removes this instance; its tweens end.
- `stack` — names in draw order, a fresh array each read.
- `available` — names registered by composed packs, plus any this game defined.
- Inside the snippet every param is in scope **by name** as well as by position, so it reads `sunSize` rather than `p2` — the same name the API sets. `time`, `res`, `px`, `uv`, `view`, `bg`, `c0`..`c3` and `TAU` are the template's own, and a param may not take one of those names. The positional `p0`..`p15` are bound as locals too, so the SNIPPET must not declare its own `let p0` either — that one is not caught at registration, only by the shader compiler, and the message (`redeclaration of 'p0'`) is the only clue you get.
- `define(def)` — define a backdrop **this game owns**, then `add` it by name. A pack is how a backdrop is SHARED; this is how a game writes one for itself — a title screen's own sky, an effect that lives in one scene. Defining one of the game's names again replaces it, live: the copies on the stack take the new definition and keep their values by param name (a new param starts at its default). An identical definition changes nothing, so a scene's `enter` can define its sky every time it runs. Taking a name a composed pack already owns is a loud error.
- `clear()` — removes everything; existing handles become inert.
- `failure(name)` — why the backdrop `name` does not draw on this device: its
  compile error (WGSL on WebGPU, GLSL on WebGL2), or null. A backdrop that does
  not compile is said once in the console, with its name, and then skipped: it
  is never drawn, and on WebGL2 it no longer stops the frame. The error arrives
  a frame or two after it is first drawn. For tools that show a shader's errors.
- `pointer` (vec4) is in every snippet's scope: x and y are the pointer's position in `uv`, eased over a quarter of a
  second so a sky that follows it glides; z is 1 while it is pressed; w is the seconds since it last moved. It rests at
  the centre until a pointer arrives (and headless).
- `validateBackdrop(def)` (exported) checks a definition the way the runtime takes it, with no GPU: the name, the
  limits, reserved and redeclared names, `while`/`loop` (refused: a loop needs a constant bound) and the WebGL2
  translation. It returns the problem in one sentence, or null. Content a tool or a model writes goes through it
  before `define`: a snippet the translator refuses is skipped on WebGL2, which is what a build's screenshots and
  every player without WebGPU see.
- Other packs reach the stack through the registry: `k.registry.get('backdrops', 'backdrops')` is this API (the
  `title-screen` pack defines and stacks its skies that way).

Backdrops are drawn bottom-up with premultiplied alpha blending, so a backdrop
whose result has alpha below 1 shows the one beneath it. A fully opaque backdrop
hides everything under it.

Every backdrop's output, and the background picture, takes a still dither of
half a level (±0.5/255, interleaved gradient noise on the pixel), so a smooth
dark gradient does not show 8-bit bands. It depends on the pixel alone, never
on time, so a sky with nothing moving stands perfectly still; it is scaled by
the output's alpha, so a transparent pixel stays exactly 0 and a premultiplied
overlay stays premultiplied. `backdropWGSL(code, keys)` (exported) is the whole
WGSL a snippet runs in, for a tool or a test.

## Writing a backdrop pack

A backdrop pack is one `registerBackdrop` call in its `attach`:

```ts
import { registerBackdrop } from '@phaser-ae/backdrops';
export function backdropBands(): Pack<{}> {
    return { id: 'backdrop-bands', requires: ['backdrops'], attach(k) {
        registerBackdrop(k, { name: 'bands', description: 'horizontal colour bands', params: { count: 8 }, colors: { a: '#102030', b: '#ffd166' },
            code: `let band = floor(uv.y * p0) / max(p0 - 1.0, 1.0); color = mix(c0, c1, band);` });
        return {};
    } };
}
```

`code` is the body of the fragment shader, in WGSL. In scope:

| symbol | type | meaning |
|---|---|---|
| `uv` | `vec2<f32>` | this pixel, 0..1 across the screen, y down |
| `px` | `vec2<f32>` | this pixel in logical screen pixels (uv times the logical size) |
| `view` | `vec4<f32>` | the camera's visible world rectangle: x, y of the top-left corner, then width and height, in world units; `view.xy` is what to offset by for parallax |
| `time` | `f32` | sim seconds, interpolated; pauses with the game; plus the backdrop's own offset when `handle.time` was set |
| `p0` … `p15` | `f32` | the params in declared order, up to sixteen |
| `c0`..`c3` | `vec4<f32>` | the colours in declared order, straight (not premultiplied) RGBA 0..1, up to four (an undeclared one is transparent black) |
| `hash21(p)` | `fn(vec2<f32>) -> f32` | a stable 0..1 hash of a 2D point |
| `noise2(p)` | `fn(vec2<f32>) -> f32` | smooth value noise, 0..1 |
| `fbm2(p)` | `fn(vec2<f32>) -> f32` | four octaves of `noise2`, roughly 0..1 |
| `TAU` | `f32` | a full turn, 6.28318530718 — what a hash-phased `sin` is multiplied by |
| `color` | `var vec4<f32>` | starts transparent black; leave the result in it, **premultiplied** |

`params` and `colors` are the default tables; key order is the `p0..p15` and
`c0..c3` order. `description` is the planner's menu line. One backdrop per pack.

Every declared param is ALSO in scope under its own name — `count` as well as `p0` — because the template
writes `let count = p0;` for you. So do not write that line yourself: it is a WGSL redeclaration, the
backdrop never compiles, and `registerBackdrop` refuses it by name to save you finding that out from a
driver message. Anything else the shader refuses is reported with the backdrop's name and the WGSL line.

In a snippet the background is `bg` (the vec4 at this pixel, transparent black
when none is set or outside a `contain` fit) and `bgAt(uv)` (sample elsewhere:
a displacement or a warp reads the art through itself). `res` is the logical
width and height.

## Options

None. Everything is per `add()` call.

## Limits

- Each backdrop is a full-screen pass, and the noise helpers are not free: one
  `fbm2` is four `noise2` lookups. `nebula` calls it twice a pixel, and `clouds`,
  by far the heaviest, twenty-five times. Two or three backdrops is the sensible
  ceiling.
- Sixteen `f32` params and four colours per backdrop.
- The snippet runs in a block of its own (`{ … }`) inside the template, before
  the fade and the dither; a `return` in it skips both.
- Tweens and fades step with the simulation (60 a second by default), not with
  the display: on a 120 Hz screen a value moves every other frame.
- Colours are set, not tweened.
- `view` is the follow-camera's rectangle; a backdrop cannot read the world,
  sprites or lights, only the camera and the clock. Under a 3D world `view`
  carries only the camera's x and y, so a backdrop is a flat layer that never
  turns with the camera's yaw or pitch; for a sky that does, compose `sky-3d`.
- Output must be premultiplied, or stacking blends wrongly; multiply `rgb` by
  the alpha you set.
- The snippet is compiled once per backdrop name per device; a compile error
  shows up in the browser console and in `failure(name)`, not at `add()` time,
  and that backdrop is skipped.
- WebGPU and WebGL2 are supported. WebGL2 translates the supported WGSL snippet subset and throws on unsupported constructs.
- `background()` takes any loaded image's key: an atlas frame, a render
  texture, or a big picture loaded whole with `assets.load` — a title painting
  at its full size has a texture of its own, and this draws from it.

### Noise field compatibility

`fbm2` uses four octaves, initial amplitude 0.5, amplitude halved each octave, and `q = q * 2.03 + vec2(17.0, 9.0)`. These values are fixed. Changing the octave count or domain offset changes cloud silhouettes and every other procedural composition even if its snippet and parameters are unchanged. `hash21` and `noise2` also preserve the original field.

`physicalPx` is the fragment position in framebuffer pixels. Use it for effects
whose authored size should retain physical-pixel scale at high DPR; `px` and
`res` retain their existing logical-pixel meaning.

### Coordinate spaces

Custom backdrop code retains logical `px` and physical framebuffer `physicalPx`. `cssScale.xy` converts logical pixels to CSS pixels (`px * cssScale.xy`), independently of backing-store DPR. The stars pack uses this for its authored point sizes and density.
