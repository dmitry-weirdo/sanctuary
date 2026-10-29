# Conventions

The units and rules every Phaser AE API shares. Each pack documents any exception to them on its own page, and
converts at its own boundary.

## Build and check a game

`node --import tsx engine/bakery/src/cli.ts build <workspace> [output]` is the checked standalone build: the manifest
and pack options, strict TypeScript and the game gate must all pass before anything is written. A failure names the
file, line, rule and the correction. `build.json` records source hashes, a source identity and which checks ran; a
bundle alone never claims it was played or opened in a browser.

`node --import tsx engine/bakery/src/cli.ts smoke <workspace>` builds the same way, then plays the game headless for
30 simulated seconds with random taps, swipes and keys. It prints PASS or FAIL with the scenes reached, each error
with its line in the game's own files, and the assets that failed. It fails on any error or when the game never
leaves its first scene. It cannot judge how the game looks, sounds or feels.

## Units

| | |
|---|---|
| **Space** | World units, not pixels. **y down** in 2D. **y up, right-handed** in 3D. A world pack owns the mapping; nothing else does. |
| **Angles** | Radians, unless a pack's page says degrees (CPU particle spin and angles, some path styles); the caller converts, never the kernel. `0` points `+x`; positive rotates clockwise on screen in y-down 2D. |
| **Origin** | Every object's position is its **centre**. Anchors are an explicit, rare override. |
| **Time** | Seconds, as floats. Never milliseconds in a gameplay API. All time comes from the game clock: no `setTimeout`, `Date.now` or `performance.now` in the simulation. |
| **Chance** | All randomness comes from `game.rng` (a pack's `k.rng`), so a seed replays the game. Code without a game (pure rules, generators, workers) uses `createRng(seed)` from `@phaser-ae/kernel`. The game gate flags `Math.random` in game code. |
| **Undo and replay** | `createHistory` from `@phaser-ae/kernel` records a seed and moves: undo, redo, seek, saves. Never keep stacks of past states. |
| **Maths** | Every build replaces `Math.sin`, `Math.pow`, `a ** b` and the other transcendental functions with the kernel's deterministic ones, which give the same bits on every machine. Write them as usual; never reach for `globalThis.Math`, which is the browser's own. |
| **Colour** | CSS strings at the API boundary; packed `rgba8` inside. One parser, in the kernel. |
| **Size** | `width`/`height` in world units on every visible object, by default its picture's size; `sx`/`sy` (or `scale`) scale on top, default `1`. |
| **Names** | Verbs are imperative (`rotate`, `tint`). Queries are nouns (`roster.at`). Handles are nouns. Options objects past two parameters. A pack's API lives under **one named key**. |
| **Ids** | Human-legible, kernel-suffixed (`enemy-crab-7`), never reused. |
| **Definitions** | Defining a name again (a style, a shader, a mesh, a scene, a debug control) replaces it, live where the pack can; an identical definition changes nothing. A scene's `enter` runs every time the scene does, so what it defines must never fail the second time. Two packs claiming one name as they compose is the conflict that throws. |
| **Failure** | Non-finite numbers, out-of-domain values and writes to a killed handle are **errors in dev, no-ops in production**. |

## 3D controls — never roll your own

**Compose a control pack. Do not write a camera or object controller by hand.**

Getting a drag the wrong way round is the most common defect in a generated 3D game,
and it is invisible to every check there is: it type-checks, it runs, it renders, the
tests pass and a screenshot looks correct. Only a person with a hand on the mouse can
see it, and by then it is in front of a player.

| you want | compose |
|---|---|
| a camera circling a subject, or chasing one | `rig-orbit` |
| first person — walk and look | `rig-fps` |
| first person with a block-game touch layout | `rig-minecraft` |
| a 2D camera following something | `rig-follow` |
| 2D move and aim axes and named intents, from keys, pads and touch | `controls-2d` |
| an OBJECT the player spins — model viewer, character select | `turntable` |
| an object that FACES the cursor — character, turret, twin-stick, click-to-move | `aim-3d` |
| on-screen buttons and a thumb stick | `controls-touch` |
| per-object click, drag, hover | `pointer` |

### Relative or absolute — get this one right first

The last two rows above are the same gesture and **opposite controls**, and picking
the wrong one produces a game that feels broken in a way playtesters cannot name.

| | the facing comes from | drag/move right does |
|---|---|---|
| **relative** — `turntable`, `rig-orbit`, `rig-fps` | how far the pointer **moved** | turn right, always |
| **absolute** — `aim-3d` | where the pointer **is**, as a point in the world | face whatever is now under the cursor |

A relative control turning a **character** reads correctly while the character faces
away from the camera and **inverted** the moment it faces the camera: dragging left
swings its nose right, because "left" is a direction on the screen while the nose is
pointing back out of it. There is no fix inside a relative control — it was never
being asked to face anything, only to turn by an amount.

**If the object should point AT something, use `aim-3d`.** It resolves the pointer to
a point in the world and turns through the full 360°, so it works with the cursor in
front, behind or across. `game.world3d.lookAt(h, x, y, z)` is the one-shot version.

**To aim UP as well, it must be `surface: 'view'`.** The default surface is a
horizontal plane through the object, which puts the aim point at the object's own
height — so the object can only ever aim flat, whatever `tilt` says. `'view'` meets
the ray with a sphere around the camera instead, which is the only surface that can
put the point above the object. Give it `up` and `down` limits in radians, both
positive: nothing real elevates through a full 90°.

If none of them fits, take the sign from `dragToOrbit`, `dragToLook` or `dragToSpin`
in the kernel rather than deciding it again. They are three different conventions and
the difference is real:

| | who moves | drag right |
|---|---|---|
| **orbit** | the camera, *opposite* your hand | the scene rotates right |
| **look** | the camera, *with* your hand | the view turns right |
| **spin** | the object, *with* your hand | the object turns right |

Orbit is three.js `OrbitControls`, Blender and the Unity scene view; look is
`PointerLockControls` and every FPS ever shipped; spin is a turntable. Orbit and spin
produce the same picture by turning different things, which is why they get confused.

## Composition and the page around the game

Packs are composed in `manifest.json`, never constructed in game code. A game may import the helpers a pack lists in
its `pack.json` `helpers` (pure functions and definition registration) and, with `import type`, any type. The game
gate rejects factory and namespace imports, dynamic engine imports, unseeded randomness, `any` that erases a type, and
access to the page's DOM. `game.kernel` gives UI and debugging code the raw services (input, hooks, registry); its
surface, backend and composition methods are off-limits to game code. New functionality belongs in a pack, behind its
API.

A canvas handed to the asset loader is artwork, not the game's surface: it may be made in a draw callback, as an
OffscreenCanvas where available. Page panels, URL settings and wall-clock measurements belong to the page that hosts
the game, outside the simulation.

CPU particle sizes are full dimensions; GPU particle sizes are radii. Keep that difference when porting a recipe from
one to the other: a radius copied as a full size halves the effect.
