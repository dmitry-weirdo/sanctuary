# Colour toolkit

Colour as data on `game.color`. Hex strings in, hex
strings out, which is the form a handle's `tint` takes, so any result can be assigned
straight to an object. It builds colours from hue, saturation and value, blends and
shifts them, and generates whole palettes as rainbows, ramps and gradients; a
malformed hex is a loud error, so a typo cannot hide behind a silent white.

```ts
const { hsv, rainbow, ramp, gradient, lerp, shift, withAlpha, brighten, sample, parse, pack } = game.color;
h.tint = hsv(200, 0.8, 1);                  // hue degrees, saturation, value
rainbow(8);                                 // 8 hues that loop seamlessly
ramp(0, 60, 5);                             // a hue slice, red → yellow
gradient('#102040', '#ffd166', 16);         // RGB blend, 16 stops
sample(['#000', '#f00', '#fff'], t);        // a multi-stop gradient at t
shift('#ff0000', 120);                      // rotate hue, keep S/V
withAlpha('#ffffff', 0.5);                  // '#ffffff80' — tint carries alpha
parse('#f80');                              // [r, g, b, a] in 0..1; garbage is a loud error
```

## When to use it

Compose it when a game needs a palette, a team colour, a damage flash, a rainbow
trail, a depth fade or any tint it would otherwise hand-compute. It has no
dimension and no state: 2D and 3D games use it alike. The `tween` pack requires it
so a `tint` can tween in RGB; the `lighting-2d` and backdrop packs take the same
hex strings. Skip it when the game's colours are a handful of literals.

## Requires

Nothing. No columns, no steps, no hooks; `attach` returns the same frozen
`colorApi` every time.

## API

### Parse and pack

- `parse(hex)` — `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` → `[r, g, b, a]` in
  0..1 (alpha 1 when absent). Throws on anything else.
- `rgb(r, g, b, a?)` — components in 0..1 (clamped) → `#rrggbb`, or `#rrggbbaa`
  when `a` is given.
- `pack(hex)` — the roster's `0xRRGGBBAA` unsigned integer.

```ts
const [r, g, b] = parse(h.tint);
h.tint = rgb(r * 0.5, g * 0.5, b * 0.5);
```

### HSV

- `hsv(h, s = 1, v = 1)` — hue in degrees (wraps), saturation and value in 0..1
  (clamped) → `#rrggbb`.
- `toHsv(hex)` — `{ h, s, v }` with `h` in 0..360.
- `shift(hex, degrees)` — rotate the hue, keep saturation and value.
- `brighten(hex, amount)` — add `amount` to value (negative darkens), clamped.
- `withAlpha(hex, alpha)` — the same colour with an alpha byte, 0..1.

```ts
h.tint = shift(base, 180);           // the complementary colour
h.tint = brighten(base, -0.3);       // a shadow
```

### Blend

- `lerp(a, b, t)` — RGB blend, `t` clamped to 0..1; alpha is dropped.
- `sample(stops, t)` — a multi-stop gradient at `t`; one stop returns itself.

```ts
h.tint = lerp('#ffffff', '#ff4040', hurt);
const sky = sample(['#0a0a2a', '#ff8040', '#ffe080'], timeOfDay);
```

### Palettes

- `wheel(opts?)` — a `Wheel` at fixed saturation and value.
- `Wheel.hue(deg)` — the colour at a hue. `Wheel.at(t)` — at `t` in 0..1 around
  the wheel. `Wheel.colors(count, t0 = 0, t1 = 1)` — `count` colours spread
  inclusively from `t0` to `t1`.
- `rainbow(count, opts?)` — `count` evenly spaced hues that loop seamlessly (the
  last is one step short of the first).
- `ramp(fromHue, toHue, count, opts?)` — `count` hues inclusive from one hue to
  another.
- `gradient(from, to, count)` — `count` RGB stops inclusive between two hexes.
- `ColorOptions` — `{ saturation?, value? }` for the three above; both default 1.

```ts
const team = rainbow(4, { saturation: 0.7 });
const fire = gradient('#ffffc0', '#ff2000', 12);
```

### Named life ramps

Eight ready-made colour ramps for something that fades as it ages: a particle, a trail, a beam, a light that cools.
Each is a list of hex stops from birth to death.

- `RAMPS` — the eight by name: `fire`, `spark`, `ember`, `smoke`, `ice`, `magic` and `toxic` run bright to dark;
  `rainbow` runs red, orange, yellow, green and blue to purple.
- `lifeRamp(ramp)` — a named ramp's stops, or a list of your own passed straight through, so code can take either.
  An unknown name throws.
- `rampAt(table, t, out, o)` and `SAMPLES` (64) are exported for the particle packs, which bake a ramp into a table of
  `SAMPLES + 1` RGB entries and read it with `rampAt`, so a 2D effect and its 3D twin colour alike. They are not on
  `game.color`.

```ts
const { RAMPS, lifeRamp, sample } = game.color;
h.tint = sample(lifeRamp('ember'), age / life);   // bright to dark as it ages
const trail = RAMPS.ice;                           // ['#ffffff', '#b3ecff', '#33a1ff', '#0a2a66']
```

### Legibility

- `luminance(hex)` — WCAG relative luminance, 0..1. Not HSV's `v` and not the mean
  of the channels: the channels are gamma-decoded and weighted the way an eye
  weights them, so `#00ff00` reads far brighter than `#0000ff`.
- `contrast(a, b)` — the WCAG ratio, 1 (identical) to 21 (black on white). Order
  does not matter; alpha is ignored.
- `readableOn(background, inks?)` — the candidate that contrasts with the background
  most. `inks` defaults to `['#000000', '#ffffff']`.

```ts
const ink = readableOn(tile.tint);                            // black or white
const ink = readableOn(tile.tint, ['#776e65', '#fffaf2']);    // a warm pair, still chosen for you
```

Use it for any label written **on** a colour — a value on a tile, a count on a
badge, a name on a team chip, a figure on a bar. Choosing that by eye is how a
palette ships with one unreadable entry in it, and the failure only ever appears on
the value nobody screenshotted.

It will sometimes disagree with a palette you know. 2048 writes white on its golden
128–2048 tiles, but those tints are light enough that dark ink contrasts more than
twice as well (3.28 against 1.47 on `#edcf72`). That is a style decision, and a
legitimate one — but make it knowingly, by passing the ink you want, rather than by
guessing a crossover. WCAG asks 4.5 for body text and 3 for large or bold text; a
best-of-two below 3 means the background needs to change, not the ink.

### Types

- `Hex` — a string in one of the four hex forms.
- `RampName` — `'fire' | 'spark' | 'ember' | 'smoke' | 'ice' | 'magic' | 'toxic' | 'rainbow'`.
- `ColorApi` — the object on `game.color`; `colorApi` is the single instance.

## Options

None.

## Limits

Every function parses its inputs, so a colour computed per object per frame costs
a regex and some arithmetic; cache palettes. `lerp` and `gradient` blend in RGB, not
in a perceptual space, so a mid-grey appears between complementary colours. `lerp`
drops alpha; use `withAlpha` on the result. `contrast` and `readableOn` judge the
colour as given: a translucent ink over a background is not what they are shown, so
blend it first. `readableOn` returns the best of the candidates it is handed, which
may still be unreadable — check `contrast` against 3 or 4.5 when it matters. Named CSS colours (`red`) are not
accepted. `hsv` wraps hue but clamps `s` and `v` silently.
