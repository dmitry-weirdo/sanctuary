# Post-process chain

The full-screen effect runtime. Once the world and its lighting are drawn, `post`
copies the frame into a texture and runs each effect you added as one fragment
pass over it, each reading the previous result, the last one writing the screen.
The HUD (`world-screen`) is drawn after the chain, so score text stays crisp
while the playfield blooms, curves or pixelates. This pack owns the pass, the
ping-pong targets and the shader template; it owns **no effects**. Every look is
registered here as a WGSL snippet by a pack: `post-looks` (crt, scanlines,
chroma, grayscale, pixelate, posterize, vignette, wave), `post-bloom`,
`post-grade`, `post-grain`, or the game's own.

## When to use it

Compose it whenever you want a whole-screen look: neon glow, an arcade tube, a
damage flash, an underwater wobble, a fade to grey. Leave it out of a game that
wants none of these; an empty chain costs nothing but the pack still does not
belong in the manifest. It works under a 2D world and a 3D one alike: it runs
over whatever the world drew, before the `screen` pass. Pair it with the `tween`
pack to animate a param (a hit that pushes `chroma.shift` up and back), and with
`feel` for shake, which is a camera transform and not a post effect.

When not:

- **A look on one sprite** (a glowing pickup, a dissolving enemy): `effects-2d`,
  whose built-in effects draw in the sprite's sorted place.
- **Anything that needs the scene's depth** (god rays, lens flares, an
  underwater fog, ambient occlusion): `god-rays-3d`, `flare-3d`,
  `underwater-3d` and `ssao-3d` run their own passes with the depth buffer;
  an effect here sees colour only.
- **A transition between scenes**: `transition`, which draws its own passes
  after `screen`.
- **Psychedelic arcade distortion** (Trip-a-Tron style): `post-trippatron`.
  It needs only `trippatron`, not this pack: it draws a pass of its own, which
  runs before this chain, and reacts to `trippatron` impacts and audio.

## Requires

A world (2D or 3D) and a WebGPU or WebGL2 backend (`render-auto`, `render-webgpu`
or `render-webgl2`); WebGL2 translates each snippet with `wgsl-glsl`. Each effect
pack in turn declares `requires: ["post"]`, so the bakery refuses `post-bloom`
without `post`. Headless the chain is kept and the pass draws nothing.

## API

```json
{ "id": "post" }, { "id": "post-bloom" }, { "id": "post-looks" }
```
```ts
const bloom = game.post.add('bloom', { strength: 1.2 });   // append; params override the pack's defaults
bloom.set('threshold', 0.4);                                // change one param live, any frame
game.post.add('vignette', { color: '#5a0008' });            // a colour param takes a CSS string
game.post.add('grade', { lift: [0, 0.02, 0.05], gain: 1.1 });  // a vector param: an array, or one number for all
bloom.name;                                                 // 'bloom'
bloom.remove();                                             // take it out of the chain; safe to call twice
game.post.chain;       // ['vignette'] — effect names in run order
game.post.available;   // every effect a composed pack registered, e.g. ['bloom', 'vignette']
game.post.clear();     // empty the chain
```

- `add(name, params?)` — appends an effect and returns a handle. Throws if no
  composed pack registered `name` (the message lists what is available and
  names the pack to add), if a param key is not one the effect declares or its
  value is the wrong kind, or if the effect needs more than sixteen param slots.
  Scene-scoped: the scene's teardown removes it.
- `handle.set(param, value)` — sets one param; throws on an unknown name, on the
  wrong kind of value and on a colour that does not parse.
- `handle.remove()` — removes this instance from the chain.
- `chain` — names in run order, a fresh array each read.
- `available` — names registered by composed packs.
- `clear()` — removes everything; existing handles become inert.

Effects run in add order. Each reads the previous effect's output, so
`pixelate` then `bloom` glows the blocks, and `bloom` then `pixelate` pixelates
the glow. A CRT belongs last.

A param is a number, a colour or a vector, and its default in the effect decides which. A colour param takes
any CSS colour the kernel parses (`'#ff8800'`, `'rgb(255, 136, 0)'`, `'hsl(32, 100%, 50%)'`, `'orange'`); its
alpha is ignored. A vector param takes an array of its own length, or one number for every component. A colour
where a number belongs, or the reverse, throws, so a typo never turns silently black.

Other packs reach the chain through the registry: `k.registry.get('post-chain', 'post')` is this API (the kind `post`
holds the effect definitions, so the chain is `post-chain`). The `title-screen` pack adds its bloom and vignette that
way.

## Writing an effect

A game can register an effect of its own with the `registerPostEffect` helper,
on `game.kernel`, and add it like any other (the gallery `post` demo does this):

```ts
import { registerPostEffect } from '@phaser-ae/post';
registerPostEffect(game.kernel, { name: 'sepia', description: 'old photograph', params: { amount: 0.8 },
    code: `let g = dot(color.rgb, vec3(0.299, 0.587, 0.114)); color = vec4(mix(color.rgb, vec3(g * 1.07, g * 0.74, g * 0.43), p0), color.a);` });
game.post.add('sepia');
```

`registerPostEffect` checks the definition first and throws, saying what is wrong, before anything is drawn (see
**Checking an effect** below). Registering a name again replaces the effect: the copies in the chain take the new
definition on the next frame, keeping their values by param name, and an identical definition changes nothing, so a
scene's `enter` can register its effect every time it runs. Two packs registering one name as they compose throws. An
effect pack is the same call in its `attach`:

```ts
import { registerPostEffect } from '@phaser-ae/post';
export function postSepia(): Pack<{}> {
    return { id: 'post-sepia', requires: ['post'], attach(k) {
        registerPostEffect(k, { name: 'sepia', description: 'an old photograph', params: { amount: 1 },
            code: `let g = dot(color.rgb, vec3(0.299, 0.587, 0.114)); color = vec4(mix(color.rgb, vec3(g * 1.07, g * 0.87, g * 0.62), p0), color.a);` });
        return {};
    } };
}
```

`code` is the body of the fragment shader, in WGSL. In scope:

| symbol | type | meaning |
|---|---|---|
| `uv` | `vec2<f32>` | this pixel, 0..1 across the screen, y down |
| `time` | `f32` | sim seconds, interpolated by the clock's alpha; pauses with the game |
| `texel` | `vec2<f32>` | one display pixel in uv units (`dpr / framebuffer width`, `dpr / framebuffer height`) |
| `tex(p)` | `fn(vec2<f32>) -> vec4<f32>` | sample the previous result at `p`, bilinear, clamped at the edges |
| `p0` … `p15` | `f32` | the params' slots in declared order, up to sixteen |
| `color` | `var vec4<f32>` | starts as `tex(uv)`; leave the result in it |

`params` is the table of defaults, and its key order is the slot order. A number takes one slot, a CSS colour
string three (red, green, blue, 0..1, so `vec3(p2, p3, p4)` in the snippet), and an array of 2 to 4 numbers that
many; sixteen slots in all. `post-looks`' `vignette` declares `{ strength: 0.45, radius: 0.75, color: '#000000' }`: strength
is `p0`, radius `p1` and the colour `p2..p4`.

`description` is the one line the planner's menu shows. One effect per pack,
or one family that shares a mechanism (a CRT is curve + scanlines + vignette
because a tube is all three).

### Checking an effect

```ts
import { checkPostEffect } from '@phaser-ae/post';
checkPostEffect({ name: 'tint', params: { strength: 1 }, code: 'color = vec4(color.rgb * strength, color.a);' });
// → '"tint" would not draw: unknown identifier 'strength' … (params are read by slot: "strength" is p0)'
```

`checkPostEffect(def)` returns the definition's problem in one sentence, or null; it needs no GPU, so a tool or a test
can check an effect as the engine will. It checks the name (a letter, then letters, digits, `-` or `_`), each param's
default (a finite number, a CSS colour the kernel parses, or 2 to 4 finite numbers) and the sixteen slots they share;
that the code sets `color`, uses no `while` or `loop` (a loop needs a constant bound, or it can hang the GPU), calls no
texture function but `tex`, and is under 8000 characters; and it translates the snippet for WebGL2 against exactly the
names in scope, which finds an unknown name (most often a param read by its name instead of its `p` slot), an unknown
function, a syntax error or a construct WebGL2 cannot draw. A param's name is only its key in `add` and `set`, so it
may share a name with the template's (`vignette`'s `color`). `registerPostEffect` throws the same sentence.

The WGSL itself is compiled by the browser when the effect is first drawn on WebGPU. A snippet that translates but does
not compile there (a WGSL type mismatch the translator lets through) is reported once in the console, naming the effect
and the line within the snippet, and skipped on that device so the rest of the chain still draws.

## Options

None. Everything is per `add()` call.

## Limits

- Every effect is a full-screen pass plus one texture copy for the chain, so
  eight stacked effects cost eight passes; on a low-end GPU keep the chain short.
- One pixel of input per pass: an effect sees only the previous result, never
  the original frame or the depth of the scene.
- Sixteen `f32` slots per effect; a colour costs three and a vector its width.
  Colours are RGB only (alpha is dropped) and arrive gamma encoded, as the
  frame does.
- **The check is the translator's, not the browser's WGSL compiler**: a WGSL
  type error the translator lets through is found when the effect is first drawn
  on WebGPU, reported in the console and skipped (see **Checking an effect**).
  Try a new effect on WebGPU once.
- Nothing over the world is affected: the HUD, debug overlay and text on
  `world-screen`'s `hud` and `overlay` draw above the chain, by design. Its
  `underlay` sits inside the world, under the pieces, so the chain reaches it
  like the backdrop under it.
- **Where it runs**: the `post` pass is ordered after `lighting` and before
  `screen`. The 3D packs' own full-screen passes (`godrays3d`, `flare3d`,
  `underwater3d`) are ordered after `sprites` and before `screen` too, so
  between them and the chain the order is not fixed by constraints: ties go to
  the order the packs are composed in, the first composed running first.
  Compose `post` after them to run the chain (a CRT, a grade) over their result,
  and check `game.kernel.frame.order` when it matters.
- **One full-resolution pass an effect, reading the previous result only**: it
  cannot host a multi-resolution bloom chain or a depth-aware effect; those are
  packs with their own passes.
