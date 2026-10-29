# Typography

Every word a game draws: score and HUD labels, menu captions, titles with outlines, shadows and gold gradients, and
rich paragraphs that shape any script, mix fonts and styles, wrap, justify and flow round shapes. Text renders
natively on WebGPU and WebGL2 in screen, 2D and 3D worlds, as retained objects that move, fade and belong to their
scene like sprites.

## When to use it

Whenever a game shows text. Which call to reach for:

| You want | Use |
|---|---|
| A score, a timer, a caption, a label over a thing | `core-2d`'s `game.text(...)` if the game is on a core (a thin wrapper over a label), else `game.typography.label(...)` |
| A label that changes every frame (a counter) | `label(...)`, then set `.text` |
| A paragraph: story text, rules, credits, mixed fonts, wrapping, columns, a drop cap | `game.typography.write(...)` |
| A title with an outline, a shadow or a gradient | `write(...)` with `style.outline`, `style.shadow`, `style.gradient` (MTSDF fonts) |
| Text that bursts into pixels | `snapshot(...)` then `trippatron` |
| Glowing line-art text in a vector game | `vector-font` |
| Words painted into a picture once | `render-texture`'s canvas text (lower fidelity) |

Choose the format when you load a font:

| Format | For | Supports |
|---|---|---|
| `msdf` (default) | almost everything: UI, HUD, titles | any size, outlines and hard shadows, gradients |
| `vector` | extreme zoom, perspective, huge titles | exact outlines evaluated per pixel; no outline or shadow |
| `bitmap` | a fixed set of physical sizes, pixel-exact | strikes at chosen ppem; no outline or shadow |

## Requires

A rendering backend and a screen, 2D or 3D world; 3D text also needs `render-3d`. Compose `typography` before `ui`,
`flow`, `controls-touch`, `dialogue` and `rpg`, which draw their text through it.

## API

### Fonts

```ts
await game.typography.prepare(['sans-bold', 'mono']);       // before the first screen: load exactly these
const hud = game.typography.face({ family: 'mono', size: 18 });   // a reusable, measured face
const title = await game.typography.load('https://cdn.phaser.games/gameblocks/fonts/titan-one-234e70f3b5fda95b9294.glb', 'msdf');
const story = game.typography.stack(lora, notoArabic);          // fallback: the first font with the character wins
game.typography.registerFamily('title', title);                 // a name ui styles and face({ family }) can use
```

- Six UI fonts are pre-baked on the Phaser AE CDN: `sans`, `serif`, `mono`, and each in bold (`sans-bold`,
  `serif-bold`, `mono-bold`). Each is 2.6 to 5.4 MB, so one loads only when a face in it is first asked for; text
  in it appears when it arrives (a face's `loaded` is false and `measure()` returns 0 until then; `await face.ready`
  waits).
- `prepare(names)` loads exactly the fonts named (a UI family, a registered family, or a CSS font such as
  `'bold 24px serif'`) and resolves when they have arrived; the loading screen counts them. Name only the fonts the
  first screen draws with. `prepare()` with nothing named loads nothing: it waits for shaping and for fonts already
  asked for. `ready(wasm?)` starts the shaping engine (`prepare` and `load` do it for you).
- `face({ family, size })` or `face({ font: 'bold 18px monospace' })` is a face: a font and an em size, with
  `measure(text, scale?, spacing?)`, `lineHeight`, `loaded` and `ready`. Make faces once and reuse them.
- `load(url | ArrayBuffer, format)` loads a baked GLB font: copy the exact versioned URL from the font catalogue
  (Options, below), never guess a file name. Pass `{ format: 'bitmap', strikes: [12, 24, 48] }`,
  `{ format: 'msdf', emSize: 64, pixelRange: 8 }` or `{ format: 'vector', cubicSubdivisions: 4 }` for settings; the
  baked asset must contain the format asked for. Load each font once.
- `stack(primary, ...fallback)` is an ordered fallback selection, for scripts one font lacks; a baked subset may lack
  characters its source font has (check `measure().missingGlyphCount`).

### Labels

```ts
const score = game.typography.label({ x: 24, y: 24, text: 'Score 0', font: hud, tint: '#ffffff',
  outline: { color: '#000000', width: 1.5 }, shadow: { color: '#00000088', x: 2, y: 2 } });
score.text = 'Score 1200'; score.alpha = 0.8; score.scale = 1.2;
const caption = game.typography.label({ x: W / 2, y: H - 40, text: 'Press Space', align: 'center', valign: 'middle', layer: 'hud' });
```

| option | default | meaning |
|---|---|---|
| `text` | (required) | the words; `''` shows nothing |
| `x`, `y` | (required) | the anchor point, in the layer's units |
| `font` | sans at 14 | a face |
| `align` | `'left'` | which edge sits at `x`: `'left'`, `'center'`, `'right'`, kept as the text changes |
| `valign` | `'top'` | which edge sits at `y`: `'top'`, `'middle'`, `'bottom'` |
| `tint`, `alpha`, `scale` | white, 1, 1 | colour, opacity, size multiplier |
| `outline` | none | `{ color, width }`, width in font units |
| `shadow` | none | `{ color, x, y }`, a hard shadow offset in font units (a paragraph's is `{ color, offset: [x, y] }`) |
| `spacing` | 0 | extra letter spacing in font units |
| `layer`, `z` | the screen layer | where it draws |

A label is live: `text`, `x`, `y`, `tint` (or `color`), `outline`, `shadow`, `alpha`, `scale`, `visible`, with
measured `width` and `height`, `alive`, and `kill()` (or `destroy()`). `paragraph` is the retained paragraph under it
and `object` its roster handle.

### Paragraphs

```ts
const font = await game.typography.load(LORA_URL, 'msdf');
const page = game.typography.write({
  font, text: 'Chapter One\nThe lamp guttered…', x: 40, y: 40,
  style: { fontSize: 22, lineHeight: 1.4, color: '#f4f7ff' },
  spans: [{ start: 0, end: 11, style: { fontSize: 36, color: '#ffd166' } }],
  constraints: { width: { mode: 'at-most', size: 600 } },
  layout: { wrap: 'word', align: 'justify', dropCap: { lines: 3 } },
});
page.set({ text: 'A new paragraph' });      // edit content or layout; reshapes
page.object.rot = 0.1;                      // move, turn, fade: no reshaping
```

`write(spec)` makes a retained paragraph: `font`, `text`, `x`, `y`, and

- `style` (the whole paragraph) and `spans` (`{ start, end, font?, style? }`, UTF-16 offsets on cluster boundaries):

  | style | meaning |
  |---|---|
  | `fontSize`, `lineHeight` (a multiple), `letterSpacing`, `wordSpacing` | size and spacing, in paragraph units |
  | `color` (CSS or a linear RGBA tuple), `opacity` | the fill and an independent alpha |
  | `outline` | `{ color, width }`, MTSDF only |
  | `shadow` | `{ color, offset: [x, y] }`, a hard shadow, MTSDF only |
  | `decoration` | `{ underline?, overline?, lineThrough?, color?, thickness?, offset? }`; solid lines from the font's metrics |
  | `gradient` | a fill of two to four colours (below); the paragraph's style only, not a span's |
  | `language`, `direction` (`'auto' \| 'ltr' \| 'rtl'`), `features` | shaping: OpenType features such as ligatures |

- `constraints`: `width` and `height`, each `{ mode: 'exact' | 'at-most', size }` or `{ mode: 'unconstrained' }`.
- `layout`:

  | layout | meaning |
  |---|---|
  | `wrap` | `'none'`, `'word'`, `'character'` |
  | `align` | `'start'`, `'center'`, `'end'`, `'justify'`; `lastLine: 'justify'` justifies the last line too; `justify` bounds the word and letter stretch |
  | `maxLines`, `overflow` | a line limit; `'visible'`, `'clip'` or `'ellipsis'` past it |
  | `firstLineIndent`, `spaceBefore`, `spaceAfter` | indents and paragraph spacing |
  | `columns` | `{ count, gap? }`: sequential columns inside an exact width (not balanced) |
  | `dropCap` | `{ lines, align?, side?, marginInline?, marginBlock?, contour? }` |

- `flow`: `{ regions: [{ key, shape, clip?, exclusions? }] }`, text flowing through ordered regions round exclusions.
  A shape is `{ kind: 'rectangle', bounds: [x0, y0, x1, y1] }` or `{ kind: 'polygon', vertices: [[x, y], …] }`; an
  exclusion is `{ key, shape, wrapSide?, marginInline?, marginBlock? }`. Coordinates are paragraph-local, top-left,
  y down.
- `clip`: a local `[left, top, right, bottom]` rectangle; changing only the clip or the position does not reshape.
- `rasterPixelRatio`: the physical-to-logical pixel ratio, to choose a bitmap strike on dense displays.

A paragraph's `object` is a roster handle (position, rotation, scale, alpha, visibility, layer). `measure()` gives
its size, ink bounds, intrinsic widths, baselines, overflow and missing characters (use ink for visual alignment,
advance for flow). `glyphs()` gives every glyph's position, advance, cluster, direction, line and stable identity;
`placements()` adds caret, line and word queries. `detach(indices?)` copies chosen shapes into an object of their own
for animation (`detachDecorations()` the rules); a copy keeps its look after the source changes. `dispose()` frees
it; leaving the scene does that too. `flush()` publishes pending changes at once (rendering does it each frame).

### Gradient fills

`style.gradient` fills the letters with two to four colours at an angle instead of the solid `color`: gold and chrome
titles, neon subtitles, a score that warms from white to orange. It works in every format, on both backends, and in
`snapshot()`; a `detach()`ed copy keeps the gradient it was made with.

```ts
const gold = { colors: ['#fff6c4', '#ffd23f', '#a85a08'], stops: [0, 0.45, 1] };   // top to bottom
const title = game.typography.write({ font, text: 'GOLDRUSH', x: 40, y: 40,
  style: { fontSize: 96, outline: { color: '#3a1a02', width: 3 }, gradient: gold } });
const chrome = { colors: ['#f4f7ff', '#9aa6c0', '#2a3350', '#e3e9f7'], stops: [0, 0.48, 0.52, 1] };
const neon = { colors: ['#ff3df2', '#3dd6ff', '#7bff8a'], angle: 0 };                // left to right
subtitle.set({ style: { fontSize: 32, gradient: { ...gold, box: 'line' } } });        // the same gold on every line
```

| field | default | meaning |
|---|---|---|
| `colors` | (required) | two to four CSS colours (`#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `hsl()`, a name), first to last; each colour's alpha scales the glyph's |
| `stops` | evenly spaced | where each colour sits, 0..1, one per colour, ascending; two equal stops make a hard band (chrome's horizon) |
| `angle` | `90` | the direction the colours run, degrees on screen: 90 top to bottom, 0 left to right, 180 right to left, 45 corner to corner |
| `box` | `'ink'` | what the gradient spans: `'ink'` is the paragraph's ink, the top of its tallest letter to the bottom of its lowest, so the end colours sit on the letters; `'line'` is every line from the font's ascent to its descent, so each line, and each word or letter drawn on its own in the same font and size, gets the same colour at the same height |

The colours are mixed in sRGB, as in CSS and a canvas gradient, and the box's corners meet the end colours whatever
the angle. The gradient replaces the fill colour only: outlines, shadows and decorations keep their own colours, and
`opacity` still applies. A wrong gradient (one colour or five, stops out of order or outside 0..1, a colour that does
not parse) throws a `RangeError` from `write` or `set`.

### In 3D

Text lies on its object's local XY plane, paragraph y down mapped to negative local y, and depth-tests against meshes.
`billboard: true` faces the camera; otherwise turn it with the object's yaw, pitch and roll.
`projectFlow({ key, text, object, flowBounds, bounds?, silhouette?, projectionError?, marginInline?, marginBlock? })`
projects a 3D object's bounds (a unit cube by default) or silhouette into a paragraph exclusion through the rendered
camera; apply it with `set({ flow })` (see `type-projected-flow`). Objects behind the camera or off screen give none.

### Frozen pixels

`snapshot(paragraph, { key, scale: 1, padding: 2 })` renders the paragraph into an atlas frame, colours, gradient and
decorations included, and returns `frame`, local `x`/`y` and logical `width`/`height`. Roster transforms and opacity
are not baked. Cache each distinct string: snapshots keep their atlas space for the game's life. Headless runs
register blank frames of the same size. For a Trippatron burst, pass the frame and size to `trip.burst`, centred on
the paragraph object's position plus the snapshot offset and half its size, and kill the paragraph as it starts;
`pixelArt: true` breaks the real text pixels and `fragmentSize` groups them.

### Performance

Compatible neighbouring paragraphs share instanced draws without changing their paint order; unchanged glyph
geometry stays on the GPU and only transforms upload. `game.typography.stats` counts draw calls, instances and bytes
uploaded this frame (`type-stress` draws 400 animated labels in one call). A device loss rebuilds from retained data.

## Options

`assets`: the shaping Wasm's directory with a trailing slash, for development builds (default `/typography/`).
Standalone games embed the Wasm in `game.js` and ignore it.

### Choosing a font

The font catalogue lists 38 baked fonts with their look, good uses, exact
CDN GLB URL and licence (the bakery copies it into a game's `docs/font-catalog.md`); the
preview sheets and the `type-catalog` gallery show them. Choose by
the feel of the game and the size of the text, one display face for titles and one readable face for the rest:

| Look | Titles | Menus, HUD and text |
|---|---|---|
| Casual, puzzle, kids | Baloo 2, Titan One, Grandstander | Nunito, DM Sans |
| Cartoon and comic | Bangers, Luckiest Guy, Chewy, Lilita One | Nunito |
| Ancient or epic fantasy | Cinzel, Cormorant Garamond | Libre Baskerville, Lora |
| Medieval, gothic or pirate | Uncial Antiqua, MedievalSharp, Pirata One | Lora |
| Futuristic, cyberpunk | Orbitron, Audiowide | Rajdhani |
| Pixel or terminal retro | Press Start 2P (short, at integer sizes) | VT323 |
| Military or action | Black Ops One, Anton | Rajdhani, Roboto Condensed |
| Sports and racing | Oswald, Anton | Barlow Condensed, Roboto Condensed |
| Noir, detective, notes | Special Elite, Permanent Marker | Caveat (short notes), IBM Plex Mono |
| Neutral or tools | Inter | Inter, Work Sans, Roboto |
| Numbers that must not jiggle | | JetBrains Mono, IBM Plex Mono |

A font a game needs that the catalogue lacks is baked once and published under the game's own CDN path:
`yarn fonts:project:publish <game-id> <input.ttf> <family> [license.txt] [coverage]`, then load the URL it returns.
`node --import tsx tools/scripts/bake-typography-fonts.mts input.ttf output.glb [unicode-ranges]` is the offline
baker. Standalone games never load TTF or OTF sources. Keep each font's licence with it.

## Limits

- The baked fonts cover Latin, Greek, Cyrillic and punctuation; other scripts need a font baked for them.
- Bitmap and vector text take no outline or shadow. An MTSDF outline reaches at most `(pixelRange / 2 - 0.5) / emSize`
  em past the glyph, less half a pixel of antialiasing: about 1/18 of the font size for the default 64/8 bake and
  1/21 for the 32/4 UI fonts; a wider one is drawn at that width. Bake with a larger `pixelRange` for thicker ones.
- One gradient a paragraph, across its ink or its lines: spans cannot take their own, a paragraph flowed through
  several regions shares one, and under `box: 'line'` a paragraph with lines of different heights folds by its first two.
- Columns fill in order without balancing. Solid decorations only. Horizontal CJK is supported; vertical writing,
  colour emoji and dictionary hyphenation are not.
- Span offsets are UTF-16 and must fall on cluster boundaries; detached shape indices are in shaped visual order, so
  ligatures, combining marks and bidirectional runs make the two index spaces differ.
- Detached copies and snapshots are fixed: they do not follow later edits.
