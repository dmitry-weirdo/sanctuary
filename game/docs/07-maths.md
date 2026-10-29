# Game maths

Pure functions on `game.maths`: the easing curves, vector operations, angle helpers,
range helpers and geometry tests a game reaches for every frame and every brief
re-derives badly. Nothing here touches the roster, the clock or the renderer; every
function takes plain numbers or `{ x, y }` objects and returns a new value, so it is
safe to call anywhere, any number of times, from any step.

```ts
const { ease, EASE, vec, geom, lerp, clamp, mapRange, approach, wrapAngle, turnToward, hashCode } = game.maths;
ease('easeOutBack')(0.5);
vec.normalize({ x: 3, y: 4 });
turnToward(h.rot, vec.angleOf(d), 0.1);
approach(v, target, 8, dt);
geom.pointInPolygon(x, y, poly);
hashCode('level-3');
```

## When to use it

Compose it whenever a game needs an easing curve, a normalised direction, a
shortest-arc turn, a clamp or a hit test and you do not want that arithmetic written
by hand in the game file. It has no dimension: it serves 2D and 3D games alike,
though `vec` and `geom` are 2D. The `tween` pack requires it and takes its easing
table from here, so an easing name that works in `tween` works in `ease()` and vice
versa. `hashCode` pairs with `game.rng.fork` to turn a level code into a seed. You do
not need it for a game that only moves things by `x += vx * dt`.

## Requires

Nothing. It has no columns, no steps and no hooks; `attach` returns the same frozen
`mathsApi` object every time.

## API

### Easing

`t` is 0..1 in, 0..1 out. Back and Elastic overshoot on purpose; Bounce lands hard.

- `ease(e)` — resolve an easing from a name, a function, a bezier tuple
  `[x1, y1, x2, y2]`, or `undefined` (→ `easeInOutQuad`). An unknown name throws.
- `bezier(x1, y1, x2, y2)` — a cubic bezier easing from its two control points,
  the CSS `cubic-bezier` form.
- `EASE` — the table of named curves, ten families in three shapes each:
  `linear`, `swing`; `easeInQuad`, `easeOutQuad`, `easeInOutQuad`; `easeInCubic`,
  `easeOutCubic`, `easeInOutCubic`; `easeInQuart`, `easeOutQuart`, `easeInOutQuart`;
  `easeInQuint`, `easeOutQuint`, `easeInOutQuint`; `easeInSine`, `easeOutSine`,
  `easeInOutSine`; `easeInExpo`, `easeOutExpo`, `easeInOutExpo`; `easeInCirc`,
  `easeOutCirc`, `easeInOutCirc`; `easeInBack`, `easeOutBack`, `easeInOutBack`;
  `easeInElastic`, `easeOutElastic`, `easeInOutElastic`; `easeInBounce`,
  `easeOutBounce`, `easeInOutBounce`.
- Short aliases in the same table, the family's natural curve: `quad`, `cubic`,
  `quart`, `quint`, `sine`, `expo`, `circ` are the `inOut` form; `back`, `bounce`,
  `elastic` are the `out` form.
- `EaseFn` — `(t: number) => number`. `EaseName` — the union of every key above.

```ts
const f = game.maths.ease('elastic');          // same as EASE.easeOutElastic
h.x = lerp(0, 400, f(t));
const snap = game.maths.ease([0.2, 1.4, 0.4, 1]);   // bezier with overshoot
```

### Vectors — `vec`

Over plain `{ x, y }`; every function returns a new object and never mutates.

- `add(a, b)`, `sub(a, b)`, `scale(a, s)` — component arithmetic.
- `dot(a, b)`, `cross(a, b)` — scalar dot and 2D cross (z of the 3D cross).
- `len(a)`, `len2(a)` — length and squared length.
- `dist(a, b)`, `dist2(a, b)` — distance and squared distance.
- `normalize(a)` — unit vector; `{ 0, 0 }` for a zero-length input.
- `clampLen(a, max)` — the vector shortened to `max` if it is longer.
- `fromAngle(rad, mag = 1)`, `angleOf(a)` — polar in, polar out (radians).
- `rotate(a, rad)` — rotate about the origin.
- `lerp(a, b, t)` — component lerp, `t` unclamped.
- `stepToward(from, to, maxStep)` — move `from` at most `maxStep` toward `to`,
  landing exactly on `to` when close.
- `perp(a)` — the left-hand perpendicular `{ -y, x }`.
- `reflect(v, n)` — reflect `v` about unit normal `n`.

```ts
const dir = vec.normalize(vec.sub(target, h));
h.x += dir.x * speed * dt; h.y += dir.y * speed * dt;
const bounce = vec.reflect({ x: h.vx, y: h.vy }, { x: 0, y: -1 });
```

### Angles

Radians everywhere; `TAU` is 2π.

- `TAU` — 2π.
- `toRad(deg)`, `toDeg(rad)` — convert.
- `wrapAngle(rad)` — wrap to (−π, π].
- `signedAngle(from, to)` — the shortest signed turn from one angle to another.
- `turnToward(from, to, maxStep)` — turn at most `maxStep` radians along the
  shortest arc, landing exactly on `to` when close.

```ts
h.rot = turnToward(h.rot, vec.angleOf(vec.sub(player, h)), 3 * dt);
```

### Scalars and ranges

- `lerp(a, b, t)` — linear blend, `t` unclamped.
- `clamp(v, min, max)` — clamp.
- `mapRange(v, inMin, inMax, outMin, outMax, clampOut = false)` — remap one range
  onto another; a zero-width input range maps as if it were width 1.
- `roundTo(v, precision = 0)` — round to `precision` decimal places.
- `smoothstep(a, b, t)` — Hermite 0..1 between two edges.
- `approach(v, target, rate, dt)` — exponential approach,
  `v + (target − v) · (1 − e^(−rate·dt))`: frame-rate-independent smoothing.
- `hashCode(s)` — FNV-1a: a string to a uint32, for `rng.fork`.

```ts
cam.zoom = approach(cam.zoom, wanted, 6, dt);
const hp = mapRange(h.data.hp, 0, 100, 0, barWidth, true);
```

### Geometry — `geom`

- `distance(ax, ay, bx, by)`, `angleTo(ax, ay, bx, by)` — between two points.
- `pointInRect(px, py, x, y, w, h)` — inclusive edges; `x, y` is the top-left.
- `pointInCircle(px, py, cx, cy, r)` — inclusive.
- `pointInPolygon(px, py, poly)` — even-odd test over a `Vec2[]` ring.
- `segmentIntersection(a, b, c, d)` — the intersection point of AB and CD, or
  `null` if they do not cross or are parallel.
- `segmentHitsCircle(a, b, c, r)` — does AB pass within `r` of C.
- `lineOfSight(a, b, blockers)` — is AB clear of every circle in `blockers` (`{ x, y, r }`): line of sight past cover.
- `closestOnSegment(a, b, p)` — the closest point on AB to P.
- `polygonArea(poly)` — signed shoelace area (negative when clockwise in y-down).
- `polygonCentroid(poly)` — area-weighted centroid; `{ 0, 0 }` for a degenerate ring.
- `convexHull(pts)` — Andrew's monotone chain, counter-clockwise, collinear points dropped.
- `predictPath(x, y, vx, vy, gx, gy, time, steps = 32)` — `steps + 1` points
  along a ballistic arc, for a trajectory preview.

```ts
if (geom.segmentHitsCircle(muzzle, muzzleEnd, enemy, enemy.width / 2)) hit(enemy);
const arc = geom.predictPath(h.x, h.y, vx, vy, 0, 900, 1.5);
```

### Types

- `Vec2` — `{ x: number; y: number }`.
- `MathsApi` — the object on `game.maths`; `mathsApi` is the single instance.

## Options

None.

## Limits

Vectors and geometry are 2D only. `vec` allocates a fresh object per call; in a
hot loop over thousands of objects, inline the arithmetic. `pointInPolygon` is
undefined on the boundary; `polygonCentroid` of a self-intersecting ring is not
meaningful. `ease` throws on an unknown name rather than falling back, so a typo
shows on the first call. `hashCode` is a 32-bit hash: collisions are possible, and
it is not a cryptographic one.
