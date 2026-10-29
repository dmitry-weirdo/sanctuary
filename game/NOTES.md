# Sanctuary — how to test

Isometric Diablo-like crypt with drag-and-drop inventory.

## Controls
- **Click ground** — walk
- **Click demon** — approach + melee. Every kill leaves loot on that spot
- **Click loot** — walk to it and put it in the bag. Walking past does not pick it up
- **C / I / Char** — character + inventory (drag icons)
- **Drop to ground** — drag a bag or worn item onto the Drop pad. It stays on the ground beside you until you click it
- **E** — talk · **Portal** — next floor · **P / Esc** — pause

## Inventory (drag & drop)
Slots: **Body Armor, Helm, Belt, Amulet, Ring 1, Ring 2, Weapon**
- Drag bag icons onto matching slots (rings → either ring)
- Drag equipped icons back onto the bag grid
- Drag within the bag to reorder
- Drag onto **Drop to ground** (lower left) to put it back on the crypt floor
- Invalid drops snap back

## Your engine
`setProviders({ stats, combat, items, appearance, dialogue })` in `bridge/providers.ts`
- Combat hits: `systems/stubCombat.ts`
- Equip slots / gear math: `systems/stubStats.ts`
- Sprite layers: `stubAppearance.ts` + `art.ts` keys

## Art (image files in `game/art/`)
`iso-floor`, `iso-wall`, `hero-body.png` (key `hero-painted`, backdrop removed), `ui-slot`, `ui-sheet`, `portrait-akara`, plus helm and armor pngs. Loaded from `assets.json`. Vignette is `game.post` in play.

## Later, with Pro
Colour grade, bloom, and grain (`post-grade`, `post-bloom`, `post-grain`) and a phaser.io crew request for a matched tileset. This account is free, so those stay optional.

## Debug
`screen` · `floor n` · `god` · `level` · `loot` · `win` · `killall`
