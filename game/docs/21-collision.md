# Tag collision rules

Overlap rules by tag, with no dynamics. Every world object carries a shape — a
box the size of its sprite by default, a circle on request — and a rule names
two tags and what happens when one of each overlap. Rules run every fixed step
after simulation; callbacks fire inside the step. It is what pickups, bullets,
triggers and simple wall sliding need, and what physics builds on.

```ts
game.collide.on('bullet', 'enemy', (b, e) => { kill(b); e.fsm.go('dying'); });
game.collide.on('player', 'coin', (_, c) => { kill(c); score += 5; });
game.collide.solid('player', 'wall');                    // positional separation, no physics
game.collide.solid('enemy', 'enemy', { push: 'both' });
game.spawn({ ..., collide: { shape: 0, radius: 11 } });  // 0 circle, 1 box; radius 0 = from size
const hit = game.collide.raycast(x, y, dx, dy, 400, 'wall');   // nearest, or null
```

## When to use it

Compose it whenever two kinds of thing must notice each other: shooters,
top-down games, arcade games, anything with pickups or triggers. Use `solid()`
for walls in a game that has no physics — a top-down hero sliding along a
wall, enemies that do not overlap each other. Do not reach for `physics-2d`
when this is enough: a pickup never pays for mass and gravity. 2D only.

`physics-2d` requires it and runs before it, so `on()` rules see bodies at
their settled positions; `solid()` must not be used on bodies. `tiles-2d`
spawns its collision as tagged boxes (`'wall'` by default) that these rules
see. `grid-move` asks the game, not this pack, what a wall is.

## Requires

`world:2d` — shapes are sized from `width`, `height`, `sx`, `sy`, and pairs are
found through the world's spatial `near()` query. The world's `wrap` option is
honoured: a pair straddling the seam measures as neighbours.

## API

### Spawn: the `collide` columns

Every object has them; set them on spawn or later through `h.collide`.

- `shape` — `0` circle, `1` box. Default `1` (`SHAPE.circle`, `SHAPE.box`).
- `radius` — the circle's radius in world units; `0` (default) uses half the larger of width and height.

```ts
import { SHAPE } from '@phaser-ae/collision';
game.spawn({ id: 'ball', x, y, width: 22, height: 22, collide: { shape: SHAPE.circle } });
h.collide.radius = 8;   // a smaller hit circle than the sprite
```

### `game.collide`

- `on(tagA, tagB, cb)` — call `cb(a, b)` for every overlapping (a, b) pair each fixed step. Scene-scoped.
- `solid(tagA, tagB, { push?, cb? })` — keep A out of B by moving `'a'` (default), `'b'` or `'both'`; positional only, no velocity. `cb` fires as with `on`. Scene-scoped.
- `overlaps(h, tag?)` → `Handle[]` — everything overlapping `h` right now, optionally only things with `tag`.
- `raycast(x, y, dx, dy, maxDist, tag?)` → `{ handle, x, y, dist } | null` — the nearest hit along the ray, against each object's bounding box.
- `test(a, b)` → boolean — do these two overlap?
- `continuous` — test the PATH an object travelled since the last step, not just where it ended up. Off by default, live. A bullet at 3000 units/s moves 50 units a step and a 10-unit wall is not there for any of them; with this on the broadphase covers the sweep and the pair is sampled along it, so the hit lands where it should have. It costs nothing for anything that moved less than the smaller of the two shapes, which is everything at walking speed.

```ts
for (const c of game.collide.overlaps(bomb, 'enemy')) c.fsm.go('dying');
if (game.collide.test(hero, door)) openDoor();
const wall = game.collide.raycast(hero.x, hero.y, 1, 0, 200, 'wall');   // what is to the right, within 200
```

### Signals

- `collision.hit` — `{ a, b, rule }` per overlapping pair per step, ids not handles; `rule` is `"a×b"` for `on` and `"a⊥b"` for `solid`. Capacity 256 per frame; more are counted and dropped.

```ts
for (const hit of signals.read('collision.hit')) if (hit.rule === 'player×coin') sfx('ding');
```

## Options

None.

### Which side, and how deep

```ts
game.collide.solid('player', 'ground', { cb: (p, _g, c) => { if (c.side === 'bottom') p.data.grounded = true; } });
const c = game.collide.contact(ball, brick);      // { side, overlap } or null
```

`contact` reports the axis of **minimum penetration** and its depth — which is what a
platformer's "am I standing on it" and a breakout's "which face did the ball hit" both
actually ask. The side is the side **of `a`** that `b` is against, so a push upward means
`b` is against `a`'s bottom: the sign every grounded check gets backwards at least once.

A rule callback is handed the contact **before** the separation runs, or it would see a
pair that no longer overlaps and a depth of nothing.

## Limits

- `continuous` samples the path in steps no longer than the smaller half-extent of the pair, up to 256 of them: past that a mover fast enough can still step over something small enough. The sample is a position test, so the callback fires for the first sampled overlap, not for the exact time of impact.
- No velocity, no mass, no bounce: `solid()` only moves positions. For a push that carries momentum, compose `physics-2d`.
- `raycast` tests bounding boxes; a circle is its square. Good enough for a sightline, not for a billiards shot.
- A callback may kill either object; the rule moves on to the next pair. A callback that spawns an object does not see it overlap until the next step.
- Box separation comes back out the way it went in (the last step's clear axis), so a deep shove into a wall does not pop out of the nearest face — but a spawn already inside a wall has no history and is pushed along the shallow axis.
- The broadphase asks `near()` with a radius that reaches a box's corners; objects larger than the world's cell size may be missed in the corner case of a very thin, very long box.
- Rotation is ignored: a box is always axis-aligned, whatever `rot` says.
