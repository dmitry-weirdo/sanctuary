# Native dialogue boxes

Speech boxes for visual novels, otome and dating games, RPG conversations, tutorials and cutscene subtitles, drawn
inside the engine: a panel with a speaker nameplate, text that reveals letter by letter or fades in, pagination of
long turns, and tap or Space/Enter to continue. Twenty-four looks are built in, from parchment and carved wood to
neon sci-fi, a green terminal, a JRPG window, a comic bubble and a phone chat, and a game on a UI skin gets a box that
matches it. Text is shaped by Typography, so right-to-left scripts, CJK, Devanagari, emoji and rich runs (colour,
underline, wave, shake, glow) work. It presents and paces dialogue; it is not a story language.

## When to use it

- A character speaks, a narrator explains, a tutorial talks the player through: open a session with the lines and let
  the player tap through them, or drive it from the game (`interactive: false`) as an RPG does with its own input.
- The look should match the game: name a preset (see the catalogue below), wear the active UI theme's dialogue
  section (every `ui-skins` skin has one), or bring your own illustrated nine-slice frame.
- 2D only, in screen space over the game (`world-screen`'s `overlay` layer); a 3D game composes `world-screen` too.

It has no branches, choices, variables or save format: keep the story in your own data (or `rpg`'s), open a session
per conversation, `append` turns as the story decides them, and show choices with `ui` buttons after the
session completes. For text that is not a conversation (labels, captions, a score), use `typography` directly.

## Requires

`typography` (shaping and glyphs), `ui` (panel materials and the input modal), `nine-slice` (illustrated frames) and
`world-screen` (the overlay layer), plus a renderer; WebGPU and WebGL2 both work. Compose them before `dialogue`. Load
the fonts your lines need before opening a session, or let it use the UI theme's font. No HTML overlay is created.

## API

### Open a conversation

```ts
await game.ui.ready();
const font = await game.typography.load('/assets/fonts/typography/inter.glb');
const talk = game.dialogue.open({
    font, preset: 'pixel-window', speed: 32,
    lines: [
        { speaker: 'Mira', text: 'You came back.' },
        { speaker: 'Ren', text: [{ text: 'I promised. ' }, { text: 'Always.', style: { color: '#ffd166' }, effect: 'wave' }] },
        { text: 'The lanterns flicker.' },                      // narration: no nameplate
    ],
    onLine: (i, line) => showPortrait(line.speaker),            // each turn, once
    onComplete: () => game.scenes.go('map'),                    // after the last page is dismissed
});
```

`game.dialogue.open(spec)` creates a scene-owned session and returns a `DialogueSession`. `DialogueSpec`:

| field | meaning |
|---|---|
| `lines` | `DialogueLine[]`, required and non-empty: `{ speaker?, text, language?, direction?, speed?, align?, reveal?, fadeDuration?, lineInterval? }`; `text` is a string or `DialogueRun[]` |
| `font` | a loaded face or stack for body, name and prompts; default the UI theme's dialogue font, else its label font, else the bundled sans |
| `preset` | one of the 24 presets (catalogue below); default described under "The default look" |
| `theme` | overrides of the preset's `DialogueTheme` tokens: `ink`, `accent`, `nameInk`, `size`, `motif`, `panel` (a `ui` style) |
| `skin` | an illustrated frame from `loadSkin`, replacing the drawn ornaments and nameplate |
| `ornament` | `(kit) => void`, called once as the box opens: the game's own decoration (see "Your own ornaments") |
| `motifOrnaments` | default true; false leaves out the drawn motif's corners, rules, rails and tail, keeping its panel and nameplate |
| `speed` | revealed shaped clusters per second, default 32; 0 is instant |
| `reveal` | `'fade'` (default: overlapping per-cluster fades), `'typewriter'` (hard on/off) or `'line-fade'` (whole lines) |
| `fadeDuration` | seconds per fade, default 0.18 |
| `lineInterval` | seconds between line starts in `line-fade`, default 0.7 |
| `align` | `'start'` (default), `'center'`, `'end'` or `'justify'`; start and end follow the reading direction |
| `reducedMotion` | turn off fades, wave, shake and glow without changing the reveal pace |
| `autoDelay` | seconds to wait after a page is revealed before advancing by itself; omit for manual |
| `interactive` | default true: tap, Space and Enter advance and the box takes routed input as a modal. false leaves input to the game, which calls `advance()` |
| `rect` | the box in logical screen units, `{ x, y, width, height }` (at least 220 × 140); default the preset's layout |
| `labels` | the prompts `{ reveal, next, finish }`, for localisation; default "Tap to reveal" / "Tap to continue" / "Tap to finish" |
| `onComplete` | called once after the last page is dismissed |
| `onLine` | `(line, turn)`: a turn starts showing, once per turn, the first included |
| `onPage` | `(line, page, pages)`: a page starts revealing, the first included |

A `DialogueRun` is `{ text, font?, style?, effect? }`: `style` is a Typography `TextStyle` (colour, size, underline,
overline, strikethrough), `font` a real bold or italic face, `effect` `'wave'`, `'shake'` or `'glow'`. Runs join into
one paragraph; their offsets are worked out for you.

### The session

```ts
pad.onConfirm(() => talk.advance());                   // with interactive: false
if (talk.revealed && talk.line === talk.turns - 1) showChoices();
talk.append([{ speaker: 'Ren', text: chosen.reply }]); // the conversation goes on
talk.setSpeed(0);                                      // finish this page now
```

- `advance()` reveals the rest of the current page (fades included), and on the next call moves to the next page or
  turn, or completes. It does nothing while the scene is suspended or the clock paused.
- `append(lines)` adds turns after the last and returns the new count; it throws once the session is closed, so
  append before the last page is dismissed (in `onPage` or `onLine`, for example).
- `setSpeed(clustersPerSecond)` changes the pace; 0 finishes the page. `setReducedMotion(on)` toggles motion.
- `dispose()` closes without calling `onComplete`; scene exit does the same.
- `line`, `page`, `pages`, `turns`, `revealed`, `closed` and `missingGlyphs` read where it is. `object` is the root
  roster object.

With `interactive` on, a tap (not a drag) or a Space/Enter press advances; held-key repeats do not. The box claims
routed input while it is the top modal, so other UI and routed gameplay input wait. Raw key polling bypasses routed
claims, so gameplay that polls keys must check `talk.closed` itself.

### Presets and loading

| preset | look and mood | kind |
|---|---|---|
| `petal-lace` | pink lace and pearls on cream: otome, romance | illustrated |
| `satin-ribbon` | lilac satin bows: otome, sweet romance | illustrated |
| `midnight-rose` | dark plum with roses: gothic romance, vampire | illustrated |
| `gilded-salon` | gold filigree on deep teal: period drama, royal court | illustrated |
| `parchment-chronicle` | aged parchment scroll: fantasy RPG, history | illustrated |
| `arcane-glass` | glowing cyan glass: magic, high fantasy | illustrated |
| `carved-tavern` | carved dark wood: tavern fantasy, adventure | illustrated |
| `neon-relay` | neon frame on black: cyberpunk, sci-fi | illustrated |
| `orbital-command` | grey console bezel: space, military sci-fi | illustrated |
| `holographic-pearl` | pastel iridescent pearl: dreamy, idol, soft sci-fi | illustrated |
| `strawberry-picnic` | gingham and strawberries: cosy, cute, slice of life | illustrated |
| `cloud-plush` | soft clouds: cosy, children's | illustrated |
| `coffeehouse` | warm café menu board: slice of life, cosy | illustrated |
| `soft-schooldays` | pale blue notebook: school life VN | drawn |
| `editorial-noir` | black with a gold bar: detective, noir | drawn |
| `minimal-cinema` | translucent black bar: cinematic subtitles; the default | drawn |
| `faceted-prism` | faceted violet gem: stylish, magical girl | drawn |
| `hologram` | cyan scanline hologram: sci-fi HUD | drawn |
| `terminal` | green phosphor screen: hacker, computer terminal | drawn |
| `pixel-window` | blue window with white border: retro JRPG | drawn |
| `portrait-ledger` | green and gold with a portrait panel and monogram: RPG | drawn |
| `comic-bubble` | white speech bubble with a tail: comic, cartoon | drawn |
| `phone-messages` | a phone screen with a chat bubble (tall): texting | drawn |
| `novel-page` | a book page (tall): text-heavy novel | drawn |

Drawn presets are native panels and ornaments and need nothing loaded. Illustrated presets are original artwork
fetched at startup from `https://cdn.phaser.games/dialogue/frames/`: list the ones a game uses in the manifest's
`presets` option, and only those are fetched. Seven ids (`petal-lace`, `satin-ribbon`, `midnight-rose`,
`gilded-salon`, `parchment-chronicle`, `arcane-glass`, `carved-tavern`) also have a drawn composition, which is used
only as the illustrated frame's base tokens: the id always means the frame. To get the drawn look, name a drawn preset
and set `theme: { motif: 'lace' }` (or `ribbon`, `rose`, `gold`, `paper`, `arcane`, `wood`).

```json
{ "id": "dialogue", "options": { "presets": ["coffeehouse", "neon-relay"] } }
```

- `game.dialogue.ready(presets?)` prepares illustrated presets (the manifest's list when omitted) and the active UI
  theme's frame; `game.start()` awaits the manifest's list. Call `await game.dialogue.ready(['cloud-plush'])` before
  opening a preset chosen later. Prepared frames are cached per game; a failed load rejects and a later call retries.
- Opening an illustrated preset that is not prepared throws an error saying how to load it; it never falls back.
- `game.dialogue.presets` lists the 24 ids; the exported `dialoguePresets` holds their tokens and `dialogueFrames` the
  13 frames' URLs, source-pixel measurements and colours.
- The full collection of frames needs a 4096 atlas; one or two fit the default 2048.

### The default look

`open({ lines })` with no `preset` always opens. It takes, in order:

1. the active UI theme's `dialogue` section, when it has one (every `ui-skins` skin does);
2. `petal-lace`, when the game has prepared it and gives no custom `skin`;
3. otherwise `minimal-cinema`, which is drawn and needs nothing loaded.

### Following the UI theme

A game whose interface wears one theme (`game.ui.loadTheme`, or a `ui-skins` skin) gets a matching speech box by
opening one without a `preset`: the theme's dialogue panel, inks, accent, motif, size and font, and its illustrated
`frame` when it has one (call `await game.dialogue.ready()` after setting the theme to prepare it). An explicit
`preset` always wins; `theme` still overrides tokens on top. The `ui-skins` skins give the skin's own window as the
panel, its text ink, its accent on the nameplate and the plain `cinema` motif, whose nameplate rounds with a rounded
window.

```ts
game.ui.theme = await game.ui.loadTheme('assets/ui/crypt.json');
await game.dialogue.ready();
game.dialogue.open({ lines: [{ speaker: 'Vex', text: 'The candles are out.' }] });
```

### Custom illustrated frames

```ts
import { dialogueFrames } from '@phaser-ae/dialogue';
const skin = await game.dialogue.loadSkin({
    ...dialogueFrames['gilded-salon'].source,
    url: 'https://your-cdn.example/dialogue/my-frame.webp',
});
game.dialogue.open({ font, skin, lines });
```

`loadSkin(source)` loads and caches a frame (same-origin or CORS-enabled PNG/WebP with alpha). `DialogueSkinSource`,
in source pixels: `url`, `width`, `height`, `slices` (protected left, top, right, bottom), `mode` (`'nine'`, default,
or `'horizontal'`), `borderScale` (a fixed ornament scale; omit to fit the aperture), `textInset` (horizontal text
padding in logical units, default 34), `aperture` (the reading surface) and `speaker` (the nameplate's text bounds).
The frame replaces the drawn border and nameplate; the speaker's name is fitted to the plate (down to 11 units)
rather than cut off. `theme.panel.fill`, `fillTo`, `ink` and `nameInk` override the reading surface and inks. A box
too small for a fixed `borderScale` throws rather than shrinking the ornaments, and a mismatched image or invalid
measurements reject the load. Headless, frames register their geometry without downloading pixels.

### Your own ornaments

```ts
game.dialogue.open({
    font, preset: 'pixel-window', motifOrnaments: false, lines,
    ornament: ({ rect, theme, panel, sprite }) => {
        panel(rect.x + rect.width / 2 - 30, rect.y - 22, 60, 44, { fill: theme.accent, radius: 22 });   // a crest
        for (const x of [rect.x + 14, rect.x + rect.width - 14])                                         // two rivets
            sprite({ x, y: rect.y + 14, width: 12, height: 12, rot: Math.PI / 4, tint: theme.accent });
    },
});
```

`ornament` runs once as the box opens, after the motif's own ornaments (or in their place, with
`motifOrnaments: false`), and on an illustrated frame too, beside the art's own. Its kit holds the box's `rect`, the
resolved `theme`, the `skin` (or null) and two ways to draw: `panel(x, y, width, height, style, depth?)`, the SDF panel
the motifs are made of (any `ui` style: fill, gradient, radius, border, bevel), and `sprite({ x, y, width, height,
frame?, tint?, rot?, alpha?, depth? })`, an atlas frame by key or index (default the white square), turned by `rot`
radians. `depth` places either among the box's layers: the box's panel is at 1, ornaments at 2 (the default), an
illustrated frame at 3 and the text above; a sprite at 0.5 tucks under the panel's edge, as the comic tail's outline
does. Everything made through the kit closes with the box.

### Text, reveal and languages

```ts
game.dialogue.open({
    font: [arabic, latin], align: 'center', reveal: 'line-fade', fadeDuration: 0.8, lineInterval: 1.1,
    lines: [{ speaker: 'ليلى', text: 'مرحباً بك.', language: 'ar', direction: 'rtl' }],
});
```

Turns longer than the box paginate by shaped lines. Reveal steps through whole shaped clusters in logical reading
order, so RTL and combining scripts reveal correctly and an emoji sequence (skin tones, flags, joined professions)
appears as one unit. All timing uses the simulation clock, so pausing the game or suspending the scene freezes the
reveal. Load a fallback stack for every script in your lines and check `missingGlyphs`.

## Options

- `presets`: the illustrated presets to fetch and prepare during `game.start()`, from the catalogue above; default
  none. Drawn presets need no entry. An unknown id throws when the pack is created.

## Limits

- Presentation and pacing only: no branching story language, choices, variables, backlog, save format or voice
  playback. Use `onLine`, `onPage`, `append` and your own data for those.
- Portrait compositions (`portrait-ledger`, and the drawn `wood` motif) show the speaker's initial as a monogram, not a
  picture; draw a portrait sprite yourself from `onLine` (as `rpg` does), beside a `rect` that leaves room.
- The 18 drawn motifs are fixed compositions: a new look is a `theme` over one of them, an illustrated frame, or your
  own ornaments drawn once as the box opens (they do not animate unless you move the handles `sprite` returns).
- Phone Messages is one bubble per turn, not a chat history. Vertical Japanese, ruby and colour emoji are not
  supplied: emoji draw as monochrome outlines from a loaded emoji font.
- Glow is an eight-sample halo, not a blur, and each glowing cluster keeps eight extra copies: keep it to short
  phrases. Decorations (underlines) appear when the page is fully revealed.
- A text line taller than the box throws rather than being cut. Layout uses the logical screen and does not reflow an
  open session when the screen policy changes.
- Screen readers need a host companion; the pack does not claim DOM accessibility. Illustrated frames' atlas space
  lasts for the game.
