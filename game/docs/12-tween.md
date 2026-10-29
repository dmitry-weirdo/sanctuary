# Property tweens

Property animation on the fixed clock, v2's `game.tween`. A tween moves the numeric
properties of any plain object toward target values over a duration with an easing
curve; a string property that is a hex colour (a `tint`) blends in RGB. It runs in
the simulate step, so it freezes with `commands.pause`, replays deterministically,
and dies with the scene that made it. Targets are plain objects: a handle, its `data`
bag, anything with numeric properties.

```ts
game.tween.to(h, { x: 400, rot: Math.PI }, { duration: 0.6, ease: 'easeOutBack' });
game.tween.from(h, { sx: 0, sy: 0 }, { duration: 0.3 });                 // entrance: start values show at once
game.tween.fromTo(h, { tint: '#ffffff' }, { tint: '#ff4040' }, { duration: 0.2, loop: 3, yoyo: true });
const t = game.tween.to(h, { y: 100 }, { delay: 0.5, onComplete: () => kill(h) });
t.pause(); t.resume(); t.seek(0.25); t.stop(true); t.progress; t.isDone;
await t;                                                                   // thenable (never resolves for loop: true)
await game.tween.sequence([() => game.tween.to(h, { x: 0 }), () => game.tween.to(h, { y: 0 })]);
game.tween.group(a, b).pause();
game.tween.interpolate('#000000', '#ffffff', 0.5);                        // a one-off value, no handle
game.tween.pauseAll(); game.tween.stopAll(true); game.tween.count;
```

## When to use it

Compose it for entrances, exits, hit flashes, UI slides, score pops, pulsing
pickups and any motion a brief would otherwise drive by hand every frame. It is
headless and works in 2D and 3D alike: anything with a number on it can be tweened.
Use the `feel` pack for shake, flash and hit-stop (those belong to the screen, not
to an object), and `fsm` for behaviour that branches. Because a tween is owned by
the scene, there is nothing to clean up on scene exit.

## Requires

`maths`, for the easing table (an easing name that works in `maths.ease` works
here), and `color`, for tint blending. Both must appear in the manifest **before**
`tween` — the bakery checks the order and refuses a manifest that composes `tween`
first, rather than quietly reordering it.

## API

### Starting a tween — `game.tween`

- `to(target, props, opts?)` — from the current values to `props`. With a `delay`,
  the start values are captured when the delay ends.
- `from(target, props, opts?)` — from `props` to the current values; the start
  values are written at once, before any delay.
- `fromTo(target, from, to, opts?)` — explicit ends; the `from` values are written
  at once.
- `interpolate(a, b, t, ease?)` — one-off: the value between two numbers or two hex
  colours at `t` (clamped), no handle.
- `pauseAll()`, `resumeAll()` — every live tween.
- `stopAll(jumpToEnd?)` — stop every live tween; `true` writes their end values.
- `count` — live tweens, read-only.
- `isTweening(target?, prop?)` — is anything still moving? See *Has it settled?*.

```ts
game.tween.fromTo(h, { alpha: 0 }, { alpha: 1 }, { duration: 0.4, ease: 'sine' });
```

### Retargeting — a second `to` takes the property over

A new tween **takes** the properties it drives off every older tween on the same
target. There is no separate retarget verb: aim a fresh `to` wherever the thing
should now go, and it picks the property up at whatever value the old tween had
reached and eases on from there.

```ts
game.tween.to(tile, { x: 4, z: 0 }, { duration: 0.13, ease: 'easeOutQuad' });
// … the player turns the board again, mid-slide:
game.tween.to(tile, { x: 0, z: 2 }, { duration: 0.13, ease: 'easeOutQuad' });   // continues from where it IS
```

This is what a sliding board wants every move: the rules resolve the whole move at
once, and the presenter re-aims every tile at its new seat without caring whether it
was moving already. Two live tweens on one property would otherwise both write it
every step and the winner would be whichever the set happened to visit last.

A tween that loses its last property is finished: its `isDone` is true, `onComplete`
fires and it resolves, so anything awaiting it moves on. One that loses only some of
its properties keeps running on the rest.

Ownership follows the order tweens were **created**, not the order they start. A
delayed tween leaves the running one alone until it actually starts — otherwise the
motion would freeze for the length of the delay — and when it does start it will not
stomp a tween created after it.

### Has it settled? — `isTweening`

```ts
if (!game.tween.isTweening()) acceptInput();          // nothing anywhere is still moving
game.tween.isTweening(tile);                          // this object
game.tween.isTweening(tile, 'x');                     // this property
```

A board game holds its input behind this: the rules resolved the move instantly, and
the question is whether the picture has caught up. A tween still serving out its
`delay` counts as live, so a staggered entrance does not read as settled halfway
through. With no arguments it is `count > 0`; with a target it is the query you
cannot write from outside, because the live set is private.

### `TweenHandle`

Returned by `to`, `from` and `fromTo`; also a thenable.

- `pause()`, `resume()` — stop and restart the clock for this tween.
- `stop(jumpToEnd?)` — end it now; `true` snaps to the end values and cancels
  remaining repeats. `onComplete` fires either way.
- `seek(seconds)` — jump to a time from the start of the current run (after delay),
  clamped to the duration; fires `onStart` if it has not.
- `progress` — 0..1 of the current run; 1 when done.
- `isPlaying` — not done and not paused (a tween serving out its `delay` is
  playing). `isDone` — finished, stopped, or superseded by a later tween that took
  its last property.
- `then(...)` — resolves when the tween finishes or is stopped, or when its scene
  exits; never resolves for `loop: true`.

```ts
const pop = game.tween.to(h, { sx: 1.5, sy: 1.5 }, { duration: 0.1, yoyo: true, loop: 1 });
await pop;
```

### Sequences and groups — `TweenGroup`

- `sequence(steps)` — run steps one after another; each is a function returning a
  handle (or any promise). Returns a group over the handles started so far.
- `group(...handles)` — one control over several running tweens.
- `TweenGroup.pause()`, `resume()`, `stop(jumpToEnd?)` — forwarded to every member.
- `TweenGroup.isDone` — true when every member is done. `then(...)` — resolves when
  all have finished.

```ts
await game.tween.sequence([
    () => game.tween.to(title, { y: 120 }, { ease: 'bounce' }),
    () => game.after(0.5),
    () => game.tween.to(title, { alpha: 0 }),
]);
```

### Types

- `Easing` — an `EaseName`, an `EaseFn`, or a bezier tuple `[x1, y1, x2, y2]`.
- `Props` — `Record<string, number | string>`: the properties to tween.
- `TweenOptions`, `TweenApi` — below and above.

## Options

`TweenOptions`, passed to `to`, `from` and `fromTo`:

| option | default | meaning |
|---|---|---|
| `duration` | `0.5` | Seconds for one run. |
| `ease` | `'easeInOutQuad'` | Any `Easing`. |
| `delay` | `0` | Seconds before the first run. |
| `loop` | `0` | `true` = forever; a number = that many extra repeats. |
| `yoyo` | `false` | Reverse direction on each repeat. |
| `onStart()` | — | After the delay, once. |
| `onUpdate(progress)` | — | Every simulate step, with 0..1 of the current run. |
| `onComplete()` | — | When it finishes or is stopped. |

The pack itself takes no manifest options.

## Limits

Tweening an object-valued property is a loud error: tween its numbers. The end
values are written exactly, so a tween that should land on `1` lands on `1`, not
`0.9999`. A tween on a handle that dies ends with it (and resolves) without
`onComplete`; a tween cut short by scene exit resolves without `onComplete` too.
Without `yoyo`, each repeat snaps back to the start value. Conflicts are resolved
per property and per target, not per handle: two tweens driving the same property of
the same object cannot coexist, but the same property of two different objects is
never a conflict. A tween does not advance
while the clock is paused, and runs at `clock.timeScale`. There is no relative
(`'+=10'`) syntax and no stagger; build those with `sequence` and a loop.
