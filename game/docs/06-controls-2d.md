# 2D controls

The input contract for a 2D game. Game code reads intents and axes; this pack
derives them from the keyboard, gamepads and touch controls. Intents are named
by the game, a press is latched for one step so a short tap still counts, and
up to four players each have their own keys and pad. A settings screen
rebinds them while the game runs.

## When to use it

A 2D game played with keys, a pad or both: a twin-stick shooter, a platformer,
a top-down adventure, a two-player brawler. Use it instead of reading
`game.input.keyDown` when the game should take a pad as well as keys, more
than one player, or a rebinding screen. A pointer-only or touch-only game can
read `game.input` directly. Pairs with `rig-follow` for the camera and with
`controls-touch`, whose buttons press codes such as `'Touch:fire'` that an
intent binds alongside its keys.

## Requires

A 2D world (`world-topdown` or `world-side`), for the pointer's world position.

## API

### `game.controls`

Player 0's controls, plus `player(n)`, `players` and `pointer`. Each player's
controls have:

- `axis('move')` — `{ x, y }`, length ≤ 1. The move keys (digital) or else the move stick (analogue); the game cannot
  tell.
- `axis('aim')` — the aim stick while it is pushed; otherwise a unit vector from the aim origin to the pointer, or
  `{0, 0}` with no pointer or a pointer within `aimDeadzone` of the origin.
- `pressed(intent)` — held this step. `justPressed(intent)` — true for exactly one fixed step, even for a key tapped
  down and up between two steps. `justReleased(intent)` — true for the step after it was let go. An intent the player
  has no binding for throws, naming the bound ones.
- `aimFrom(origin)` — measure `aim` from this object (the player); null measures from the camera's centre.
  Scene-scoped.
- `bind(intent, { keys, pad })` — rebind an intent or add one; null removes it. `bindMove(keys)` — new move keys, or
  null to leave moving to the pad. `usePad(pad)` — a slot index, `'any'` or `'none'`. `bindings()` — a copy of the
  current bindings, for a settings screen or a save.

And on `game.controls` only:

- `player(n)` — player n's controls; throws for a player not configured. `players` — how many.
- `pointer` — `{ x, y, down, pressed, released }` in WORLD units, or null. `pressed` and `released` are latched for
  one step: read `pressed` for a tap. Comparing `down` from one step to the next misses a click shorter than a frame.

```ts
const m = game.controls.axis('move');               // {x, y}, length ≤ 1
player.x += m.x * speed * dt; player.y += m.y * speed * dt;
if (game.controls.justPressed('fire')) shoot();     // true for one step
game.controls.aimFrom(player);                      // aim from the player, not the screen centre
const aim = game.controls.axis('aim');              // right stick, or towards the mouse
const p = game.controls.pointer;                    // {x, y, down, pressed, released} in WORLD units, or null
if (p?.pressed) tapAt(p.x, p.y);                    // a tap, however short
```

Two players, each with a jump and their own pad:

```json
{ "id": "controls-2d", "options": { "players": [
  { "move": { "up": ["KeyW"], "down": ["KeyS"], "left": ["KeyA"], "right": ["KeyD"] }, "intents": { "jump": { "keys": ["KeyG"], "pad": ["a"] } } },
  { "move": { "up": ["ArrowUp"], "down": ["ArrowDown"], "left": ["ArrowLeft"], "right": ["ArrowRight"] }, "intents": { "jump": { "keys": ["Slash"], "pad": ["a"] } } }
] } }
```

```ts
for (let i = 0; i < game.controls.players; i++) {
    const c = game.controls.player(i);
    if (c.justPressed('jump')) jump(heroes[i]);
}
game.controls.player(1).bind('jump', { keys: ['Enter'], pad: ['a'] });   // from a rebinding screen
```

### `DEFAULT_BINDINGS`

One player's defaults: WASD and the arrows move; `fire` is Space, J or pad A;
`action` is E, K or pad B; `pause` is Escape or Start; the first connected
pad, its left stick moving and its right stick aiming.

### `resolveBindings(options)`

The bindings a set of options produces, one per player: what a settings
screen shows before the game starts.

## Options

- `bindings` — overrides for one player, merged over `DEFAULT_BINDINGS`: `move` replaces the directions it names,
  `intents` replaces the intents it names (null removes one), `pad` and `stick` replace. Ignored with `players`.
- `players` — one to four players, each bound in full (`move`, `intents`, `pad`, `stick`). Nothing is merged, so two
  players never share the defaults. A player without `pad` gets the pad in its own slot.
- `aimDeadzone` — world units; a pointer closer than this to the aim origin gives aim `{0, 0}`. Default 12.

Pad buttons are `a b x y lb rb lt rt back start ls rs up down left right`; the kernel rescales away a 0.15 stick dead
zone.

## Limits

- At most four players. Each reads the keyboard and its own pad; there is one pointer, which every player's aim falls
  back to while its aim stick is still.
- A pad button is sampled once per step: a press shorter than a step is missed (keys are latched and are not).
- The move stick is read only while no move key is down.
- `pointer` is null until the pointer has entered the canvas.
