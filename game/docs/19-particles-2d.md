# Particles

The 2D particle system: fire, smoke, sparks, rain, snow, magic, debris, confetti and dust. An emitter is a roster object like any sprite (a position, a layer and a depth, a `follow`, a scene to die with) and its particles draw in its sorted place, batched with their neighbours: a thruster behind the ship, sparks in front, snow at the back. Every value in a config is an *op*: a constant, a random range, a value eased over life, a keyed curve, a step per emission, or a callback. Effects are several emitters on a timeline, registered as data by the `vfx-*` packs or by the game.

## When to use it

Anything that is many small things with a life, in 2D. Compose a `vfx-*` pack for ready effects (`vfx-explosion`, `vfx-fire`, `vfx-smoke`, `vfx-sparks`, `vfx-magic`, `vfx-weather`, `vfx-party`) and call `emitter()` for a game's own. Pair it with `particle-textures` for the `particle:*` frames (soft, disc, star, spark, smoke, pixel and more) that need no asset.

When not:

- **Past about twenty thousand live particles**, or a field that is always on (a galaxy, a snowstorm across the screen): `particles-gpu`, simulated on the GPU, with its own config vocabulary.
- **3D**: `particles-3d` for event effects, `particles-gpu-3d` for standing fields.
- **A continuous stroke behind a moving object**: `game.particles.trail()` here (below), not an emitter. `vfx-magic`'s `swoosh` lays a sparkling streak of particles instead. Other trail systems are `trails-3d` (3D), `vector-fx` (vector games) and `trippatron` (psychedelic raster trails).

<!-- shared: which-particles -->
### Which particles?

| For | Compose | What it is |
|---|---|---|
| 2D effects: fire, smoke, sparks, confetti, debris, trails | `particles-2d` (in `core-2d`), effects from the `vfx-*` packs | emitters as roster objects on the CPU, deterministic and headless, every value an op, with sub-emitters, collision and callbacks |
| 3D effects: blasts, flames, magic, a puff of dust | `particles-3d` (in `core-3d`), effects from the `vfx3d-*` packs | the same op vocabulary as camera-facing quads in the 3D world, lit by the scene |
| A 2D field past about twenty thousand particles: a snowstorm, a nova, a dense background | `particles-gpu` | a GPU-simulated pool of up to two million, drawn in its emitter's place; a subset of the options, no callbacks, not headless |
| A 3D field of tens of thousands to a million: rain, snow, ash, blossom, stars around the camera | `particles-gpu-3d` | a GPU-simulated field that wraps around its emitter, so a bounded pool reads as weather over an unlimited world |
| A ribbon behind something moving in 3D: a sword swipe, a comet tail, a light trail | `trails-3d`, looks from `vfx3d-trails` | shader-drawn ribbons with turbulence, erosion, a hot core and shed sparks |
<!-- /shared: which-particles -->

## Requires

A 2D world (`world:2d`) and `color` (the colour ramps). It uses the `maths` eases and the `geometry` zone shapes as library imports. `particle-textures` supplies the `particle:*` frames; any frame works instead, on any atlas page or in a picture's own texture.

## API

### `game.particles`

| call | what it does |
|---|---|
| `emitter(config)` | spawn an emitter object (owner `particles-2d`, tag `particle-emitter`); throws on a bad op, an unknown frame (naming `particle-textures` or the file) or an unknown effect in `on` |
| `burst(spec)` | a one-shot burst at a point on a pooled emitter kept per recipe (see One-shot bursts); returns that emitter |
| `effect(name, opts?)` | spawn a registered effect: an invisible anchor plus its emitters as children, in list order; when complete it is kept to play again (see Effects) or removed, or loops. Throws naming the effects that are composed |
| `trail(config?)` | a ribbon that follows an object (see Ribbons) |
| `available` | every registered effect name |
| `count` | live particles across every emitter |
| `emitters` / `trails` | live emitters, live ribbons |

```ts
const flame = game.particles.emitter({
    follow: ship, offset: { x: -18, y: 0 }, layer: 'world', z: 5,
    frame: 'particle:soft', blend: 'add',
    rate: 120, lifespan: [0.3, 0.6], speed: [60, 120], angle: [160, 200],
    scale: { start: 0.5, end: 0, ease: 'easeOutQuad' },
    color: ['#fff7e0', '#ff8c00', '#5c0a00'],
});
flame.emitter.explode(40);           // a burst on top of the flow
flame.emitter.rate = 0;              // the live keys are plain properties
flame.emitter.set('lifespan', 0.2);  // any other key: set() recompiles it
flame.emitter.stop();                // drains, then 'particles.complete'
```

### One-shot bursts

```ts
// on every hit: debris thrown back along the shot, in a 70° cone
game.particles.burst({ x: hit.x, y: hit.y, count: 16, angle: shotAngle + 180, spread: 70,
    frame: 'particle:spark', lifespan: [0.3, 0.7], speed: [80, 200], gravityY: 300, color: { random: ['#ffd27a', '#7a2a10'] } });
```

`burst(spec)` throws `count` particles (default 12) from a point, each in a direction drawn from the cone `spread`
degrees wide around `angle` (defaults 360 and 0: all round). Every other key is the recipe, in the emitter config's
own keys (`speed`, `lifespan`, `size`, `scale`, `alpha`, `color`, `frame`, `blend`, `gravityY`, `drag`, `forces`,
`layer`, `z`, `max` …), with burst defaults: the `particle:disc` frame (the white pixel without `particle-textures`),
speed 60 to 160, lifespan 0.4 to 0.9 s, size 4 to 10, shrinking and fading out.

Bursts with the same recipe share one emitter, kept for the scene that made it, so a burst on every hit makes no new
object and particles already flying keep the direction they were born with. The recipe is keyed by its values; name
it with `recipe: 'debris'` when an op is a function (then the first burst under the name sets it). A scene keeps up to
64 recipes; past that the least recently used is let go once its particles have died. Vary only `x`, `y`, `count`,
`angle` and `spread` per call: a recipe made new each time (a random colour baked into it) makes an emitter each time.

An emitter of your own does the same with `explode(count, x, y, { min, max })`: the angle range, degrees, aims that
burst alone in place of the `angle` op.

### `h.emitter`

| member | what it does |
|---|---|
| `start({ advance?, duration? })` | begin emitting; `advance` fast-forwards seconds, `duration` limits |
| `stop(kill?)` | stop emitting; living particles finish unless `kill` |
| `explode(count?, x?, y?, angle?)` | a burst now, at the emitter or a world point (count default: one `quantity`); `angle` `{ min, max }`, degrees, aims this burst alone |
| `flow(rate, quantity?, stopAfter?)` | continuous emission |
| `emit(count, x?, y?)` | the primitive: `count` particles at a world point |
| `fastForward(seconds)` / `killAll()` | run the sim ahead / kill every particle |
| `alive`, `dead`, `complete`, `elapsed` | live particles, free slots under `max`, drained after emission ended, seconds since start |
| `rate quantity duration loop stopAfter maxAlive emitting timeScale rotation space rateOverDistance` | live properties |
| `set(key, value)` | replace any config key; its ops recompile |
| `config` | the live config: mutate `forces` and `bursts` in place; assigning any other key needs `set` to take effect |

### Ops

```ts
type Op = number | [min, max] | { min, max, int? } | { random: [...] }
        | { start, end, ease?, random? }            // over life
        | { values: [...], ease?, interpolation? }  // keyed over life: 'linear' | 'catmull' | 'stepped'
        | { steps, start, end, yoyo? }              // per emission
        | { onEmit(p, key, v) } | { onEmit?, onUpdate(p, key, t, v) };
type ColorOp = css | css[] | { random: css[] } | { values: css[], ease? } | { min: css, max: css };
```

Colours are any CSS colour (`'#ff8c00'`, `'orange'`, `'rgb(255 140 0)'`). A list is a ramp over life; `{ min, max }` blends between two per particle.

Emit-only keys, read once at birth: `quantity lifespan hold particleDelay speed speedX speedY angle spin size moveToX moveToY`. Life keys, which also take the over-life forms: `px py accelerationX accelerationY maxVelocity scaleX scaleY alpha rotate`. `scale` is both axes at once, one value per particle (a random scale stays round): it is the curve of each axis without a `scaleX`/`scaleY` of its own, so `scale: { start: 0.5, end: 2 }` grows from half to twice the size, and on an axis that has one it multiplies it, read at birth. `px`/`py` are a birth offset, and over life they slide the particle by their change. Eases are the `maths` names; the default is linear.

### The config

Every number is an op unless it says otherwise. Angles in **degrees** (0 right, 90 down), distances in world units, times in seconds.

| group | keys |
|---|---|
| placement | `x y layer z follow offset space rotation` |
| emission | `rate frequency quantity rateOverDistance bursts duration loop delay stopAfter max maxAlive prewarm emitting timeScale seed` |
| birth | `lifespan hold particleDelay px py` |
| motion | `speed speedX speedY angle radial accelerationX accelerationY gravityX gravityY turnGravity drag maxVelocity moveToX moveToY inheritVelocity` |
| look | `size scale scaleX scaleY alpha rotate spin alignToVelocity stretch color tint hue frame anim blend order` |
| zones | `emitZone` (`random` in a shape, or `edge` along it with `quantity stepRate yoyo seamless`), `deathZone` (`enter`/`leave`), `bounds` (`collide bounce kill`) |
| collision | `solid`: a point test over any geometry (`at bounce friction kill`) |
| forces | `well attract vortex orbit wind noise drag`, see `Force`; each turns with `rotation` unless `world: true` |
| children | `on: { birth, death, interval }`: a child config or an effect name, `count`, `inherit`, `probability`, `every` |
| code | `onEmit onDeath` |

The defaults that matter: `lifespan` 1, `angle` [0, 360], `speed` 0, `quantity` 1, `rate` 0 (bursts only), `max` 1000, `blend` `'normal'`, `space` `'world'`, `frame` the white pixel. `frequency` is milliseconds between emissions and overrides `rate`. `size` is world units of the particle's longer side (0 keeps the frame's own size); `scale`, `scaleX` and `scaleY` multiply it. `stretch` multiplies the frame's length by `1 + speed × stretch / 100` and turns it along its motion. `hue` jitters each particle's hue by ± degrees. `order`: `index`, `oldest-front`, `youngest-front`, `y`. `seed` replays one emitter exactly; without it each emitter forks the game's rng.

**Rotation** (an emitter's `rotation`, an effect's `angle`) turns offsets, zones, launch directions and forces, wind included; a force with `world: true` keeps the world's axes. Gravity and `accelerationX`/`accelerationY` keep the world's down, so a grinder aimed up still rains its sparks down, unless `turnGravity: true` turns them too, as a picture turned would.

Shapes are the `geometry` pack's (`point line circle ring arc sector ellipse rect triangle polygon quadratic cubic spline path`), relative to the emitter, and a `rect` here is centred on its `x y` (add `inner` for a frame). Shorthands: `circle` with `inner` (a ring) or `arc: [a, b]` (a sector), and `cone` with `r angle spread`. `random` picks uniformly inside an area or along a curve; `edge` walks the outline in order (`quantity` points, or one every `stepRate` units, `yoyo` to bounce). Frames: one key, a list (random per particle), `{ frames, cycle, quantity }`, or `anim: { frames, fps, loop }` / `{ frames, over: 'life' }`.

```ts
game.particles.emitter({
    x: 240, y: 40, rate: 80, lifespan: [1.5, 2.5], frame: 'particle:disc', size: [2, 4],
    emitZone: { type: 'random', shape: { kind: 'rect', w: 480, h: 4 } },   // snow along the top
    forces: [{ kind: 'wind', x: 20, y: 40, gust: 0.6 }, { kind: 'noise', strength: 30 }],
    deathZone: { shape: { kind: 'rect', y: 300, w: 480, h: 40 }, type: 'enter' },
    alpha: { values: [0, 1, 1, 0] },
});
```

### Effects

An effect is a `VfxDef`: `{ name, description?, duration?, loop?, emitters: [{ name, delay?, duration?, ...config }] }`, emitters in draw order (later in front).

```ts
const boom = game.particles.effect('explosion', { x, y, layer: 'fx', scale: 1.5, angle: 0 });
boom.emitters['sparks']!.emitter.rate = 0;   // each emitter by name
boom.anchor.x += 10;                          // move the anchor to move the whole effect
boom.kill();                                  // or let it remove itself when complete
```

`effect(name, { x, y, layer, z, follow, offset, scale, angle })`: `scale` multiplies every distance, speed and size (zones and forces included), and `angle` rotates the whole effect in degrees (gravity aside, as **Rotation** above says). The handle has `anchor`, `emitters` (a record by name), `name`, `complete` and `kill()`.

A finished effect is kept to play again: the next `effect()` of the same name, `scale` and `layer` in the same scene reuses its anchor and emitters, rewound to how they were made, so an explosion on every kill makes no new objects after the first few. Up to `effectPool` (default 4) are kept a kind; the rest are removed. Once a handle says `complete`, let go of its `anchor` and `emitters`: they may be playing a later effect (its `kill()` does nothing by then, so it cannot stop one). An effect cut short (`kill()`, or what it followed died) is not kept. `effectPool: 0` removes every effect when it finishes.

An effect given `follow` stops emitting when what it follows dies, a looping one too, and its particles live out their lives where they were (a missile's smoke trail stays in the air), as a ribbon from `trail()` does; the effect is complete once they have.

A game registers its own with the `registerVfx` helper. To retune a composed effect, read its def back, copy it with changes and register the copy under a new name. Registering a name again replaces its definition, so a scene that registers its effects each time it enters is safe:

```ts
import { registerVfx, type VfxDef } from '@phaser-ae/particles-2d';
registerVfx(game.kernel, { name: 'pop', emitters: [{ name: 'puff', bursts: [{ at: 0, count: 8 }], lifespan: 0.3, speed: [40, 90], frame: 'particle:soft' }] });
const base = game.kernel.registry.get<VfxDef>('vfx', 'explosion')!;
registerVfx(game.kernel, { ...base, name: 'big-boom', emitters: base.emitters.map(e => ({ ...e, lifespan: 1.2 })) });
```

Other packs reach the particles through the registry: `k.registry.get('particles', 'particles')` is this API (the `title-screen` pack makes its particle layers and bursts that way).

### Ribbons

An emitter is a spray that LEAVES an object; a ribbon is a stroke that FOLLOWS it.

```ts
const trail = game.particles.trail({ follow: rocket, width: 10, life: 0.6,
    colors: ['#fff7e0', '#ff8c00', '#5c0a00'], add: true });
// When the rocket dies the ribbon is released, not killed: the smoke stays behind.
trail.trail.release();   // or let it go by hand
```

`TrailConfig`: `width` (8, at the head), `life` (0.5 s a point), `colors` (head to tail, any CSS colours, default white), `add` (additive), `taper` (true), `alpha` (0.8 at the head), `spacing` (3 units between points), `layer`, `z`, `follow`, `offset`. The handle's `trail` has `feed(x, y)`, `release()`, `clear()`, `points`, and live `width` and `alpha`. It is a point history drawn as tapered, colour-graded quads: one roster object a ribbon, one aggregate instance a segment, so it sorts, culls and batches like an emitter.

Three details make it read as a stroke rather than a string of beads. Each segment is drawn with the atlas's **solid** frame, never a soft particle blob, because a blob fades at its own edges and butt-joined segments would fade where they meet. **`spacing`** drops points laid closer than it, so a slow object does not pile overlapping quads at the head. And the taper and the gradient run along **age**, not along the list, so a ribbon fed irregularly still fades evenly.

### Colliding with the world

`bounds` is a rectangle: right for a jar or a playfield, wrong for a floor with steps in it, where sparks pile up on one invisible line. `solid` takes a **point test**, so the geometry can be anything:

```ts
game.particles.emitter({
    // …
    solid: { at: (x, y) => { const { c, r } = map.cell(x, y); return map.solid(c, r); }, bounce: 0.34, friction: 0.06 },
});
```

Contact is resolved **per axis**. A particle stopped on the way down keeps its sideways motion and slides along the tread; one stopped sideways keeps falling down the riser. `bounce` is the speed kept on the blocked axis (default 0.4), `friction` what is scrubbed off the sliding one (default 0.1), and `kill` takes the particle off instead.

### Signals (per step)

`particles.start`, `particles.stop`, `particles.complete` (with `effect` set when a whole effect finished), `particles.death` (`id x y why`, `why` one of `age zone bounds solid`, at most 256 a step).

## Options

| option | meaning | default |
|---|---|---|
| `maxTotal` | a ceiling on live particles across every emitter: a particle that would pass it is simply not born (nothing throws), and emission resumes as particles die | `50000` |
| `effectPool` | finished effects kept to play again, per effect name, scale and layer in each scene; 0 removes each effect when it finishes | `4` |

## Limits

- **CPU simulation in the fixed step**: comfortable to about twenty thousand live particles a scene; `particles-gpu` is the answer past that.
- **Memory**: about 170 bytes a slot. A pool starts at 32 slots and doubles as it fills, up to `max` (default 1000), so an emitter costs what its biggest moment needs; set `max` near the real peak for a burst emitter.
- **Collision is a point test**, not a swept trace: a particle moving further in one step than the geometry is thick can pass through it.
- `space: 'world'` particles stay put when the emitter moves; `'local'` ones move with it; there is no in-between.
- **One blend mode per emitter**: a per-particle blend would break the batch.
- **Callback ops are the slow path**: they fill a view object per particle per update; use them for the rare effect that is not data.
- **Assigning `config.angle` (or any key but the lists) does nothing** until `set` recompiles it.
- **Angles are degrees here** (the CPU particle exception in the engine conventions), and CPU particle sizes are full sizes where the GPU packs take radii.
