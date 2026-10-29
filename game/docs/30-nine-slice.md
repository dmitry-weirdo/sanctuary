# Nine-slice and three-slice artwork

Render scalable illustrated UI with retained native sprite pieces. Load named TexturePacker atlas frames or code-defined image regions, preserve corners and end caps, and resize panels without repainting textures.

## When to use it

Use illustrated resizable panels, buttons, dialogue frames and progress tracks while preserving their corner or cap details.

## Requires

Compose `nine-slice` with a native sprite renderer and a world pack (`world-screen` for UI). It creates retained sprite pieces; no HTML overlay or repaint on resize. Every piece is scene-owned and released together by `dispose()` or scene exit. Atlas textures remain cached for the game lifetime.

## API

### JSON atlas loading

```ts
const atlas = await game.nineSlice.loadAtlas('/assets/nine-slice.json');
const blue = await atlas.load('blue-box', { slices: [12, 35, 12, 12] });
const panel = game.nineSlice.create({ texture: blue, x: 240, y: 200,
  width: 320, height: 180, layer: 'hud' });
panel.set({ width: 480, height: 260 });
```

Supports TexturePacker `textures[]` (the supplied sample), plus `frames` arrays or hashes with `meta.image` and `meta.size`. Image paths resolve relative to the JSON URL, including CDN URLs. Slice margins are **not present in the supplied JSON**: select named frame rectangles from the JSON and author margins in code. Rotated or trimmed frames reject explicitly; export untrimmed frames. Frame names must be unique across pages. The loader loads only the selected frames into the engine atlas, and identical source/options share cached tiles. Browser image dimensions must match the metadata.

### Code-defined sources

```ts
const frame = await game.nineSlice.load({
  url: '/assets/dialogue/gilded-salon-frame-v1.png', width: 2103, height: 748,
  mode: 'nine', slices: [860, 360, 403, 338], fill: false, resolution: .75,
});
const box = game.nineSlice.create({ texture: frame, x: 480, y: 460,
  width: 880, height: 280, borderScale: .36, layer: 'overlay' });
box.set({ width: 940 });
```

## Options

`mode` is `nine` (default), `horizontal` or `vertical`. Margins always mean **left, top, right, bottom in source pixels**, relative to the selected frame, not the whole atlas. Unused three-slice margins must be zero. An optional `frame: { x, y, width, height }` crops a plain source image without JSON. `resolution` in `(0,1]` controls atlas raster resolution independently of source geometry. `fill: false` omits the centre of a nine-slice frame.

`create()` takes centre coordinates `x/y`, `width/height`, optional `borderScale` (nine-slice, default 1), `layer`, `z`, `alpha`, `tint`, `visible` and `id`. `set()` changes these properties without texture uploads. `pieces` exposes retained sprite handles; use the group API for layout/disposal. `disposed` reports lifecycle state. A texture belongs to the game which prepared it; cross-game use rejects.

Nine-slice preserves corner sizes at `borderScale`; only edge centres and the centre stretch. Horizontal three-slice scales end caps with height, stretching only the middle horizontally; vertical does the reverse. If the target is smaller than the cap/margin sum, protected margins compress to fit and zero-sized middle pieces hide. Avoid that size range when precise ornament proportions matter. Three-slice is appropriate when width varies and the full-height end ornaments should remain intact; use nine-slice for independently varying height and width.

## Limits

`sliceLayout()` is the shared pure geometry helper used by both the service and dialogue. Its output rectangles use top-left coordinates. JSON parsing and layout are headless-testable. Headless image preparation registers frames without pixels; visual fidelity must be checked in a browser.

## Examples

- `nine-slice-panels`: supplied JSON frames at different panel sizes.
- `nine-slice-buttons`: horizontal three-slice buttons and a vertical three-slice strip.
- `nine-slice-resize`: interactive dimensions and border scale, including targets smaller than the cap sum.
- `dialogue-gilded-salon`: code-defined nine-slice artwork with a narrow vertical stretch band over native shaped text.
