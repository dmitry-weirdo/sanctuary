# Metal UI skin

Brushed chrome: a banded face, a bevel lit from above, an engraved caption: the metal look for a game's whole interface. Every widget the ui pack draws —
buttons in every colour, round icon buttons, windows and title bars, sliders, toggles, progress bars, checkboxes,
radios, text fields and lists — wears it, from one main colour, with Orbitron captions. No art: it is style data for the
ui panel shader, crisp at every size, and one button style fits every button height.

## When to use it

Sci-fi, racing, military and industrial games: brushed-steel buttons with a banded face, a bevel lit from above, a glint that passes slowly and an engraved caption, on dark steel windows. A colour anodises the metal. Compose several skin packs to switch between them; a game carries only the ones it composes. 2D, screen
space.

## Requires

`ui-skins`, composed before it (and with it `ui` and `typography`). The Orbitron font is a baked display face on the
Phaser AE CDN, fetched the first time the skin is chosen.

## API

No API of its own: it registers the theme `'metal'` and the material `metal`.

```ts
// manifest: … typography, ui, ui-skins, ui-skin-metal
game.ui.theme = 'metal';
game.ui.button({ text: 'PLAY', style: 'good', icon: 'play', onClick: start });   // sized to its caption and icon
game.ui.button({ h: 72, icon: 'settings', style: 'icon' });                     // the round icon button
game.skins.use({ material: 'metal', color: 'pink', name: 'pink-metal' });     // another colour, live
```

- **`UI_SKIN_METAL`** — the material as data (`UiSkinMaterialDef`), for `buildUiSkin` and `validateUiSkin` in tools.
- **`uiSkinMetal(options)`** — the pack; the manifest's options for it are below.
- The styles it defines are every `ui-skins` skin's: `default good warn bad flat icon`, one button per colour
  (`green red blue yellow orange purple pink teal grey brown` and the `colors` you add), and the roles `dark title panel
  label heading track fill knob box tick dot field focus row rowSelected scrollTrack scrollThumb`.

## Options

| option | default | what |
|---|---|---|
| `name` | `'metal'` | the theme's name |
| `color` | `'grey'` | the main colour: `default`, `icon`, title bars, slider fills; a colour name or a hex |
| `surface` | `'#5a6472'` | the hue of the panels, slider grooves, checkbox and radio boxes and scrollbar tracks, which stay dark whatever it is; the windows stay dark steel |
| `accent` | the main colour | title bars, slider fills, knobs, dots and selected rows: a second colour beside the buttons' |
| `trim` | none | this material draws no rim, bezel or frame of its own colour, so it ignores the trim |
| `radius` | `8` | button corners, px at the design height, or `'pill'` |
| `depth` | `5` | the lip, px at the design height; 0 makes the buttons flat |
| `roles` | green, orange, red, grey | colours for `good`, `warn`, `bad`, `flat` |
| `colors` | none | extra named colours, each a button style |
| `designHeight` | `64` | the button height the styles are drawn for; buttons and headings of any height scale to match |

```json
{ "id": "ui-skin-metal", "options": { "color": "pink", "radius": "pill", "colors": { "mint": "#3df0b0" } } }
```

## Limits

- Its look is fixed by the material; the options recolour and reshape it. For another look, compose another skin, or
  write a material (`UiSkinMaterialDef`) of your own and register it with `registerUiSkin` (see `ui-skins`).
- The window body is always dark steel, and so is the speech box made from it. `surface` colours the panels, grooves,
  boxes and scrollbar tracks; `color` anodises the buttons; `accent` colours the title bars, slider fills, knobs, dots
  and selected rows.
- Orbitron covers Latin, Greek and Cyrillic.
- The caption stroke and extrusion draw the text again behind itself: fine on buttons and headings, wasteful on a
  label rewritten every frame.
