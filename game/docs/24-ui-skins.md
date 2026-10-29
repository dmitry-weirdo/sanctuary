# Game UI skins core

Make a game's menus look like a mobile game's, not a web page's. A skin is a whole `ui` theme in one material and one
colour: buttons on a 3D lip that press down into it, jelly and candy gloss, glints, a shine that sweeps across, an
outline in the button's own hue, and chunky display-font captions with a thick stroke and an extruded drop — for the
buttons, the round icon buttons, windows and title bars, sliders, toggles, progress bars, checkboxes, radios, text
fields and lists alike. This pack is the core every skin shares; each look is its own `ui-skin-*` pack, so a game carries
the skins it composes and no others.

## When to use it

Any game with menus, a shop, a settings screen, a pause screen or HUD buttons that should look like a game rather than
a form. Compose `ui-skins`, then one or more skin packs after it, and choose one with `game.ui.theme`. For a look of
the game's own (a calm, flat or retro-computer one), define it with `game.ui.defineTheme` or load a
`phaser-ae-ui-theme` file (`ui`'s page); for meters (health, timers, XP) compose `bars`. 2D, screen space.

## Requires

`ui`, composed before it (and so `typography` and a WebGPU or WebGL2 backend). Each skin pack requires this one.

## API

```ts
// manifest: … typography, ui, ui-skins, ui-skin-candy
game.ui.theme = 'candy';                                                         // every widget, one material
game.ui.button({ anchor: 'center', h: 76, text: 'PLAY', style: 'good', icon: 'play', onClick: start });  // sized to fit
game.ui.button({ h: 64, text: 'Shop', style: 'orange', icon: 'cart' });          // any named colour is a style
game.ui.button({ h: 72, icon: 'settings', style: 'icon' });                     // the round icon button
game.ui.label({ anchor: 'top', y: 120, w: 640, h: 140, text: 'My Game', style: 'heading' });  // a title: grows with h
game.ui.pauseButton(); game.ui.muteButton();                                     // they wear `icon` already
game.skins.use({ material: 'candy', color: 'pink', radius: 'pill', name: 'pink' });  // remake it, live
```

**The skins**, one pack each:

| pack | theme | look | colour | font |
|---|---|---|---|---|
| `ui-skin-jelly` | `jelly` | two-tone face cut by a gloss band, dark outline in the hue, lip, glints, debossed caption | green | Lilita One |
| `ui-skin-candy` | `candy` | pill, white rim, jelly highlight, sweeping shine, white caption stroked and extruded | yellow | Luckiest Guy |
| `ui-skin-glossy` | `glossy` | glossy pill, dark outline, inset highlight and glints, white stroked caption | blue | Titan One |
| `ui-skin-bubble` | `bubble` | sphere: dome highlight, bright inner ring, three-stop face; made for round buttons | orange | Baloo 2 |
| `ui-skin-block` | `block` | flat colour on a solid lip, no outline or gloss | teal | Passion One |
| `ui-skin-cartoon` | `cartoon` | comic: thick ink outline, hard offset shadow it jumps onto, cream windows | yellow | Bangers |
| `ui-skin-wood` | `wood` | planks, inner frame, cream caption; colours stain the wood | brown | Lilita One |
| `ui-skin-metal` | `metal` | brushed chrome, banded face, lit bevel, slow glint, engraved caption | grey | Orbitron |
| `ui-skin-bezel` | `bezel` | glossy candy face in a polished chrome bezel (the trim: silver, or gold in yellow), dark line between | pink | Titan One |
| `ui-skin-candystripe` | `candystripe` | pill, light tube outline, jelly highlight; cream windows in a wide candy-striped frame | purple | Chewy |
| `ui-skin-timber` | `timber` | painted wood with real grain (requires `ui-texture-wood`), lighter rim, dark inner line, glossy orange accents | blue | Lilita One |

Each skin pack's manifest options make its theme: `name`, `color`, `surface` (the hue of the default windows, panels,
grooves and boxes; a skin that draws its own keeps them, and its page says which), `accent` (title
bars, slider fills, knobs, dots and selected rows; default the main colour), `trim` (a rim, bezel or frame the material
draws in a colour of its own: candy's white rim, bezel's chrome; materials with none ignore it), `radius`, `depth` (the
lip), `roles` (`good`, `warn`, `bad`, `flat` colours), `colors` (extra named colours) and `designHeight`.
`{ "id": "ui-skin-jelly", "options": { "color": "pink", "radius": "pill", "accent": "yellow" } }`.

**The styles every skin defines.** Buttons: `default` (the main colour), `good` (green), `warn` (orange), `bad` (red),
`flat` (grey), and one per named colour — `green red blue yellow orange purple pink teal grey brown`
(`UI_SKIN_COLORS`). `icon` is the round icon button. Then every other role a widget draws with: `dark` (window body),
`title` (its title bar), `panel`, `label`, `heading` (a title, which grows with the label's height from the
`designHeight` and shrinks to its width), `track fill knob` (slider, toggle, progress), `box tick dot`
(checkbox, radio), `field focus` (text), `row rowSelected scrollTrack scrollThumb` (lists). Each button has a hover, a
pressed look (down into its lip; a lipless one nudges down) and a disabled look (the same button in grey).

**The speech box.** Every skin theme also carries the `dialogue` section the `dialogue` pack reads from the active theme
(`game.ui.themeDef.dialogue`), so `game.dialogue.open({ lines })` with no preset wears the skin, with no `dialogue`
options and nothing to load. It is derived from the material, so it follows `accent` (the main colour unless one is
chosen), and `surface` where the material keeps the default window: the panel is the skin's `dark` window (a cartoon's cream window, a wood's planks, a candy stripe's
frame; its `contentInset`, `textColor` and `font` left off), `ink` is that window's text colour, `accent` is the
accent's face (the title bars' colour) for the nameplate, `nameInk` is white on it, or the accent's ink when the plate is
too light for white to reach 3:1, and `motif` is the plain `cinema` composition (a hairline in the accent; the window
supplies the look). The speech uses the skin's font. To change any of it, spread the theme:

```ts
const def = game.skins.make({ material: 'candy', color: 'pink' });
game.ui.defineTheme({ ...def, dialogue: { ...def.dialogue, motif: 'school', size: 30 } });
```

`validateUiSkin` checks the section too, so a new skin pack's test covers it.

**`game.skins`** — make and switch skins from the composed materials at run time:

- `materials` — the composed materials' names.
- `make(spec)` → a `UiThemeDef` from `{ material, ...options }`; define it with `game.ui.defineTheme`. Throws when the
  material is not composed (naming the pack to add) or a colour does not parse.
- `use(spec)` — make it, define it (replacing a theme of the same name, live) and switch to it; returns its name.
- `style(material, color, overrides?)` → one button `UiStyle`: `game.ui.defineStyle('mint', game.skins.style('candy', '#3df0b0'))`.
- `palette(color)` → `{ face, faceTo, lip, ink, light, text }`.

**Helpers** (pure, importable by a game or a tool):

- `uiSkinPalette(color)` — the shades a colour is worked into. Darks lean warm on yellows and oranges (a yellow
  button's lip is orange and its outline brown); `text` is white, or the ink on a pale face.
- `uiSkinColor(c)` — a colour name or hex as `#rrggbb`; `uiSkinMix(a, b, t)`, `uiSkinAlpha(c, a)`, `uiSkinLighter(c, t?)`.
- `uiSkinFont(shape, scale?)` and `uiSkinPress(shape)` — a material's caption font and pressed look.
- `buildUiSkin(material, options?)` → `UiThemeDef`; `buildUiSkinStyle(material, color, overrides?, options?)` → `UiStyle`.
- `validateUiSkin(material, options?)` → the problems with a material, as sentences; `[]` when sound.
- `registerUiSkin(k, material, options?)` — a skin pack's attach: registers the material and its theme.

**Adding a skin.** A skin is a `UiSkinMaterialDef` — `name`, `look`, default `color` and `surface`, a `font` (a baked
GLB), caption `size`, `radius` and `depth` at the 64 px design height, an optional `iconRadius`, `trim` and `accent`, a
`button(palette, shape)` that returns one button style (the shape carries the resolved `trim`), and an optional
`surfaces(ctx)` that lays roles over the default windows and parts (the context carries the `main` and `accent`
palettes) — in its own `ui-skin-<name>` pack whose attach is `registerUiSkin(k, MATERIAL, options)`.
Its test is `assert.deepEqual(validateUiSkin(MATERIAL), [])` in its own colours and in others. Copy any skin pack. A
skin that draws a texture (`texture: 'wood'`) lists its texture pack in `requires` beside `ui-skins`, so a game that
composes the skin composes the texture: see `ui-skin-timber`. A skin with a wide window frame sets `contentInset` on
`dark` so a window's children stay clear of it: see `ui-skin-candystripe`.

## Options

None. The skins are options of their own packs (above).

## Limits

- A skin's font is 1–3 MB from the CDN, fetched when the skin is first chosen. Choose the skin before the first load
  and it loads under the loading screen, and `game.start()` waits for it; `await game.ui.ready()` waits for it later.
  Until it lands, captions draw in the generic family.
- The display fonts cover Latin, Greek and Cyrillic.
- The caption stroke and extrusion draw the text again behind itself (see `ui`'s Limits): fine for buttons and
  headings, wasteful on a label rewritten every frame.
- `designHeight` scales by height only. A button with a fixed width shrinks a long caption to fit (see `ui`), so a
  row of equal buttons may show captions at different sizes; leave the width off to have each fit its caption.
- A skin pack costs about half a kilobyte compressed; this core about three. Fonts are never bundled; a texture pack
  (for `ui-skin-timber`) generates its picture at startup, a few tens of milliseconds, and downloads nothing.
