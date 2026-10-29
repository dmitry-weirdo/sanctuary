# Progress and status bars

Health, timer, progress, loading, XP, stamina and cooldown bars, and circular meters, from one call and a config object. `game.bars.create({...})` returns a bar; set its `value` and it animates there. Each bar is one quad drawn by a distance-field shader, so it is crisp at any size from a 3 px hairline to a full-screen gauge, at any zoom and pixel ratio. Ten built-in styles take any colour, and every part of the look is data you can change on any bar.

## When to use it

Use it for any meter a game shows: a HUD's health and timer, a loading bar, ammo cells, an XP strip, a boss bar with phase marks, a fighting game's slanted pair, a cooldown ring, a speedometer gauge, or a small health bar riding each enemy. It works on the screen layer (anchored HUDs) and in 2D worlds (bars that follow sprites and zoom with the camera).

Inside a `ui` menu layout (a settings window, a form) use the `ui` pack's `progress` widget, which takes part in that pack's layout and themes. A bar that is pictures of art (a painted frame from the game's sprites) is `nine-slice` with a sprite fill.

## Requires

`typography`, composed before it, for labels. A WebGPU or WebGL2 backend (`render-auto`) and a 2D or screen world.

## API

```ts
// The image's two upright meters: a time bar that empties, and an ammo bar
const time = game.bars.create({
  style: 'glossy', anchor: 'left', x: 24, width: 26, height: 300, direction: 'up',
  fill: { colors: ['#ffb36b', '#ff4b2b'] }, max: 106,
  zones: [{ below: 0.2, fill: '#ff2b2b', pulse: 3 }],
  label: { text: '{time}', position: 'below' },
});
time.to(0, 106, () => gameOver());          // a steady countdown

const hp = game.bars.create({ style: 'fighter', anchor: 'top-left', x: 16, y: 16, width: 360, height: 28, max: 120,
  label: { text: '{value} / {max}', fillColor: '#3a1c00' } });
hp.value -= 12; hp.flash('#ff6a5a');        // eases down; a red ghost chunk holds, then drains

const cooldown = game.bars.create({ shape: 'ring', style: 'neon', x: 600, y: 680, width: 60, thickness: 7, value: 0 });
cooldown.to(1, 4);                           // refills over four seconds

game.bars.create({ follow: enemy, width: 40, height: 6, style: 'flat', ghost: true });   // rides above, dies with it
```

### `game.bars`

- `create(spec?)` — make a bar or ring and return it. Throws on an unknown style or option (naming the nearest real one), a gradient of the wrong size, `max <= min` or a non-finite number.
- `defineStyle(name, look)` — a house style; `base` inherits another: `defineStyle('hp', { base: 'glossy', fill: '#ff4d6d', ghost: true })`. Defining a name again replaces it, live: every bar wearing it (or a style based on it) takes the new look, so styles defined in a scene's `enter` are safe when the scene runs again; an identical definition does nothing. Throws on a built-in name.
- `styles` — every style name. `style(name)` — a style's look with its base chain resolved.
- `all` — live bars. `of(handle)` — the bar drawn as that roster object, or null.

### Where a bar is (`create` fields)

- `x`, `y` — centre (logical px on the screen, world units on a world layer). Default the screen's middle.
- `anchor` — `'top-left'`, `'top'`, … `'bottom-right'`: the bar's same point sits at the screen's, `x y` in from it, inside the safe area, and stays there on resize.
- `follow`, `offsetX`, `offsetY` — ride above an object, sort above it in a y-sorted world, take its layer, and die with it. Default just above its top.
- `width`, `height` — default 200 × 20 (20 × 200 upright; 64 for a ring). `rot` (radians), `layer` (default `hud`), `z`, `visible`.
- `direction` — `'right'` | `'left'` | `'up'` | `'down'` | `'center'` (out from the middle). Default from the shape. A `'left'` bar mirrors its slant.
- `shape: 'ring'` with `thickness` (px; default 18% of the diameter), `start` (radians, default the top), `sweep` (radians up to 2π; `1.5 * Math.PI` is a gauge) and `direction` `'cw'` | `'ccw'`.
- `min`, `max` (default 0..1), `value` (default `max`), `onEmpty(bar)`, `onFull(bar)`.
- `style` and any look field below; `label`.

### A `Bar`

- `value`, `fraction` (0..1), `min`, `max` — set any of them. `shown` — the eased, snapped fraction drawn this frame. `empty`, `full`.
- `set(v, { instant })`, `add(delta)` — `instant` jumps without easing or a ghost.
- `to(target, seconds, done?)` — a steady move (a timer, a loader, a cooldown); `stop()` halts it.
- `flash(color?, seconds?)` — flash the fill for a hit or a pickup.
- `x`, `y`, `width`, `height`, `rot`, `alpha`, `visible`, `anchor`, `follow`, `direction`; a ring's `start`, `sweep`, `thickness` — all live.
- `style` (name), `look` (resolved, read-only), `restyle(fields)` merges look fields on this bar; `restyle(null)` drops them.
- `label` (settings, or null; assign to replace), `text` (template or function), `labelText` (what it says now).
- `handle` — its roster object. `kill()`, `alive`.

### The look

Every field is optional, on a style, on `create`, or through `restyle`. Sizes are px, angles radians, times seconds; colours are CSS. Where a colour is asked for, `'fill'` means the fill's own colour.

| field | what it does |
|---|---|
| `radius`, `corners` | corner radius px or `'pill'`; `'round'` or `'cut'` (chamfered). A ring: `'pill'` is round caps, 0 flat. |
| `skew` | slant the ends (radians), a parallelogram. |
| `edge` | the fill's leading edge: `'round'` follows the corners, `'flat'` is a straight cut. |
| `track`, `trackTo`, `innerShadow` | the empty part, an optional gradient across it, and the depth of its groove (0..1). |
| `border`, `borderColor`, `borderColorTo`, `padding` | the frame and the gap between it and the fill. A thin bar shrinks both so the fill keeps 60% of the thickness. |
| `fill` | a colour, or `{ colors: [2–4], stops?, along? }`. `along: 'across'` (default) shades top to bottom (left to right upright, outer to inner on a ring); `'track'` runs the full length, so filling reveals it; `'fill'` stretches over the filled part. |
| `shade`, `gloss`, `glossHeight`, `bevel`, `tip`, `highlight` | lighting computed from the fill colour, so it works with any colour: automatic shading, a glossy band, lit rims, a glint at the leading edge, and their colour. |
| `glow` | px, or `{ size, strength, color }`: light round the fill. |
| `shine` | seconds between sweeps, or `{ every, duration, width, strength }`. |
| `stripes` | true or `{ width, angle, speed, color }`: scrolling candy stripes. |
| `shadow` | true or `{ x, y, blur, color }`. |
| `ghost` | true or `{ loss, gain, delay, speed }`: a lost chunk holds then drains; a gain shows at once and the fill grows into it. |
| `segments` | a count, or `{ count, style: 'gaps' \| 'lines', gap, radius, snap, color }`: cells, pips, a battery, or dividers. `snap` (default with gaps) fills whole cells. |
| `marks`, `markColor`, `markWidth` | up to four lines at fractions: a target, a boss's phases. |
| `zones`, `zoneBlend` | `[{ below \| above, fill, glow, pulse, pulseColor, labelColor }]`: amber below half, red and pulsing below a quarter; or a heat meter that alarms above 0.8. `zoneBlend` fades between them. |
| `ease` | seconds the shown fill takes to settle (a time constant); 0 jumps. |
| `alpha`, `labelStyle` | the bar's opacity; how labels on this style look. |

Styles: `glossy` (default: a shaded, glossy pill in a groove), `flat`, `minimal` (a hairline), `neon` (glow, a rim in the fill colour, a shine), `candy` (stripes), `blocks` (cells in a frame), `retro` (8-bit), `metal` (an RPG frame), `fighter` (slanted, flat edge, red ghost) and `glass`.

### Labels

`label: true` shows the percentage; a string is a template; settings take `text`, `position`, `gap`, `decimals`, `color`, `fillColor`, `size`, `outline`, `outlineWidth`, `family` and `font` (a face).

- `text` — a template with `{value}`, `{max}`, `{min}`, `{left}` (max − value), `{percent}` and `{time}` (`m:ss`, rounded up, so a countdown reads 0:01 until it ends) — or `bar => string`.
- `position` — `'center'` (default), `'start'`, `'end'` (inside at an end), `'follow'` (rides the fill's edge, inside while it fits), `'before'`, `'after'` (outside the empty and full ends), `'above'`, `'below'`. A ring: the middle, a point on the band, or outside.
- `fillColor` — a second colour where the text lies over the fill; the split falls exactly on the fill's edge.
- Inside labels default to 60% of the thickness, outside ones to 15 px; `family` defaults to `'sans-bold'`.

`formatBarLabel(template, values)` and `formatBarTime(seconds)` are exported for a game's own text.

## Options

The manifest's options for the pack:

- `styles` — house styles by name, the same as `defineStyle` for each: `{ "hp": { "base": "glossy", "fill": "#ff4d6d" } }`.
- `defaultStyle` — the style a bar takes when it names none. Default `'glossy'`.
- `font` — the family labels use when nothing names one. Default `'sans-bold'`.

## Limits

- Four fill colours, four marks and 256 cells per bar: the shader packs a fixed record per bar. Asking for more throws.
- Labels stay upright on a rotated bar, and the two-colour split is for unrotated straight bars that fill one way; elsewhere a label takes `color`. A centred label on an upright bar is horizontal and may be wider than the bar.
- A skewed bar's slant is measured across its thickness, so a skewed upright bar slants its top and bottom.
- `sx`/`sy` on the handle stretch the bar's box; border, padding and effect sizes stay in px. Resize with `width` and `height`.
- A bar placed by `anchor` or `follow` is positioned every frame; move it through `x`/`y` (offsets) rather than its handle. A plain bar's handle moves it, and tweens on it work.
- The ghost and easing run on the fixed step; `to()` moves the value linearly and is never eased behind.
- A bar is drawn by its own drawer, so it sorts with other objects by layer and z but takes no per-object `fx`.
