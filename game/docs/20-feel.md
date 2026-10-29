# Game feel

The screen-level juice every action game wants at the moment something hits, on `game.feel`: a camera shake that
falls away (any axis or one direction, buzz or rumble), a trauma meter that turns repeated knocks into a growing
shake, a full-screen colour flash, a hit-stop that freezes the simulation for a few frames, a slow-motion beat, and a
zoom punch that kicks in and eases back. Shake, trauma and punch touch only the camera's rendered offsets, so the
simulation never moves and a replay is unchanged.

```ts
game.feel.shake(8, 0.4);                          // world units, seconds; falls away linearly
game.feel.shake(12, 0.25, { angle: Math.PI / 2 }); // a knock straight down the screen
game.feel.addTrauma(0.4);                          // knocks add up; trauma drains by itself
game.feel.flash('#ffffff', 0.2);                   // full-screen wash; needs world-screen
game.feel.hitstop(0.08);                           // the sim freezes for 80 ms of wall time
game.feel.slowMotion(0.3, 0.6);                    // 30% speed for 0.6 s, then eases back
game.feel.zoomPunch(0.12, 0.3);                    // 12% in, eased back
```

## When to use it

Compose it in any game with impacts: a hit landing, taking damage, an explosion, a pickup, a death, a boss stomp.
Call the verbs from collision callbacks and `fsm` state `enter` hooks. Use `shake` for one event of a known size and
`addTrauma` when events pile up (machine-gun hits, a chain of explosions), since trauma accumulates where a shake only
replaces.

It works in 2D and 3D: a 2D world adds the shake to its rendered camera offset and the punch to its zoom; `world-3d`
turns the same shake into a small yaw and pitch of the look and the punch into a narrower field of view, because
nudging a 3D eye sideways would slide the whole scene instead of reading as a knock.

Use `tween` for motion that belongs to an object, `effects-2d`'s `flash` to flash one sprite (`game.feel.flash` washes the whole
screen), `transition` for scene fades and `post-*` packs for a persistent screen look; `feel` is for a moment.

## Requires

Nothing. Shake, trauma and zoom punch write the kernel camera, which every world reads. `flash` alone is a
screen-space object, so it needs `world-screen` composed; without one it does nothing and warns once, because a
silent flash is indistinguishable from an explosion that did not fire. A rotational shake (`roll`, `traumaRoll`) needs
`post`: it turns the finished world image, so without `post` it throws in development (and warns once, doing nothing,
in a build). The pack's step runs after `physics-2d` when that pack is present.

## API

### Shake and trauma

- `shake(power = 6, duration = 0.3, options?)`: a random offset of up to `power` world units (pixels in a 1:1 2D
  game) that falls away over `duration` seconds. A new shake replaces the running one unless the running one is still
  stronger now, after its decay. `options` (`ShakeOptions`):
  - `axis`: `'both'` (default), `'x'` or `'y'`.
  - `angle`: shake along one direction only, in radians (0 is +x, π/2 is down the screen in 2D): a recoil or a knock
    from a hit. Overrides `axis`.
  - `decay`: `'linear'` (default, or the pack's `shakeDecay`), `'quadratic'` (strong, then a long tail) or `'none'`
    (full strength until it stops).
  - `frequency`: new random offsets per second, eased between, 0 to 120. 0 (default) picks a new offset every
    simulation step, the classic buzz; 6 to 15 is a heavy rumble.
  - `roll`: also turn the view by up to this many degrees (0 to 30), jittered and decaying as the offset does: a
    rotational shake. The world image turns about the screen centre, zoomed just enough to keep its corners covered,
    and the HUD stays level. It is a `post` effect (`feel-roll`), added to the chain while the roll runs and removed
    after, so it works in a 3D world as well as a 2D one.

  ```ts
  game.feel.shake(8, 0.4, { roll: 3 });           // a heavy landing that tips the view
  ```
- `addTrauma(amount = 0.3)`: add to the trauma, clamped to 0..1. Trauma shakes the camera by
  `traumaPower × trauma^traumaExponent` in both axes and drains at `traumaDecay` a second (pack options). It adds to
  any `shake` running. Another pack that requires `feel` adds trauma through the kernel registry, without `game.feel`:
  `k.registry.get<FeelTrauma>('feel', 'trauma')?.add(amount)` (`title-screen` does, for a slam).
- `trauma`: the current trauma, 0 to 1. `shaking`: true while a shake runs or trauma is above zero.

```ts
onHit(enemy, bullet) {
    game.feel.shake(5, 0.15, { angle: Math.atan2(bullet.vy, bullet.vx) });   // a push in the bullet's direction
}
onExplosion(size) {
    game.feel.addTrauma(size > 2 ? 0.6 : 0.25);                              // overlapping blasts build up
}
```

### Flash, hit-stop, slow motion and zoom punch

- `flash(color = '#ffffff', duration = 0.25, alpha = 1)`: one screen-sized object on the `overlay` layer, tinted
  `color` (it draws the atlas's white square, frame 0), fading from `alpha` to 0 over `duration` seconds, then killed.
  A new flash replaces the old one; it follows a resized screen.
- `hitstop(seconds = 0.08)`: set `clock.timeScale` to 0, count `seconds` of wall time on `frame.start`, then restore
  the scale in force before. Overlapping calls take the longer remaining time.
- `slowMotion(scale = 0.3, seconds = 0.5, rampOut = 0.25)`: run the clock at `scale` (0 to 1) of the scale in force
  for `seconds` of wall time, then ease back over `rampOut` seconds. A new call replaces a running one; a hit-stop
  during it freezes on top, and slow motion resumes when the hit-stop ends.
- `zoomPunch(amount = 0.1, duration = 0.25)`: set `camera.zoomPunch` to `1 + amount`, easing back to 1
  quadratically over `duration` seconds. A new punch replaces the current one.

```ts
onBossDefeated() {
    game.feel.hitstop(0.1);
    game.feel.slowMotion(0.25, 0.8, 0.4);
    game.feel.flash('#fff4d0', 0.3, 0.8);
    game.feel.zoomPunch(0.15, 0.5);
}
```

### Types

- `FeelApi`: the object on `game.feel`. `ShakeOptions` and `ShakeDecay`: the shake's options. `FeelOptions`: the
  manifest options.

## Options

```json
{ "id": "feel", "options": { "traumaPower": 24, "traumaDecay": 1.5, "traumaFrequency": 10 } }
```

- `shakeDecay`: the decay curve of a `shake` that names none, `'linear'` (default), `'quadratic'` or `'none'`.
- `traumaPower`: offset in world units at full trauma; default 18.
- `traumaDecay`: trauma lost per second, 0.05 to 20; default 2.5 (full trauma dies away in 0.4 s).
- `traumaExponent`: the shake follows trauma to this power, 1 to 4; default 2, so small knocks stay small.
- `traumaFrequency`: new random trauma offsets per second, eased between, 0 to 120; default 0 (every step).
- `traumaRoll`: degrees the view turns at full trauma, 0 to 30, following trauma^`traumaExponent`; default 0 (none).
  Needs `post`, as `roll` does.

A value out of range throws when the pack is created.

## Limits

- The jitter comes from `rng.fork('feel')`, so it is the same on every replay. It is a random offset, not noise with
  a spectrum. The rotational shake turns the finished world image rather than the camera (the 2D camera has no roll
  of its own), which for a flat view is the same picture; its corners are covered by a slight zoom that grows with the
  angle (about 6% at 2° on a 16:9 screen).
- `shake` replaces rather than adds (use `addTrauma` to accumulate); `hitstop` takes the longer time rather than
  adding.
- Hit-stop and slow motion count wall time and set `clock.timeScale`. If game code changes the time scale while one
  runs, the scale saved when it started is restored at the end.
- Everything resets on `scene.exit`: shake, trauma and punch go to zero, a running hit-stop or slow motion restores the
  clock, and the flash object is forgotten (the scene kills it).
- While it is not shaking, the pack leaves `camera.shakeX` and `shakeY` alone, so another pack can write them; two
  packs shaking at once overwrite each other.
