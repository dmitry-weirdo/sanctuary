# Saved data

A small key-value store on `game.save` for the things a game must remember between
sessions: a high score, an options screen, unlocked levels, a checkpoint. Values are
JSON under a per-game namespace. It writes to localStorage when the browser offers
one and to a memory map when it does not (headless, private mode, a full quota), so a
game never throws because the browser would not keep a score.

```ts
const best = game.save.read('best', 0);
game.save.write('best', Math.max(best, score));
game.save.write('settings', { music: 0.5, sfx: 1 });
game.save.keys(); game.save.remove('best'); game.save.clear(); game.save.persistent;
```

## When to use it

Compose it when a game has a score table, a settings screen, unlocks or progress a
player expects to survive a reload. It is headless and serves 2D and 3D alike; it
pairs with `typography` for the score display and with the kernel's scene flow for a
continue screen. Do not use it for per-frame state or large blobs: every write is a
`JSON.stringify` into a store browsers cap at a few megabytes. Do not use it for
replays either; the kernel's own record is the replay.

## Requires

Nothing. It has no columns, no steps and no hooks.

## API

### `game.save`

- `read(key, fallback)` — the parsed value, or `fallback` when the key is absent or
  its stored text is not valid JSON. The return type is the fallback's type.
- `write(key, value)` — store `JSON.stringify(value)`. If localStorage refuses (a
  full quota), the value goes to the memory store instead and nothing throws.
- `remove(key)` — delete from both stores.
- `keys()` — every key in this namespace, without the prefix.
- `clear()` — `remove` every key in this namespace; other namespaces are untouched.
- `persistent` — `true` while this session still uses localStorage; `false` means
  memory only, lost on reload.

```ts
const settings = game.save.read('settings', { music: 0.5, sfx: 1 });
settings.music = 0;
game.save.write('settings', settings);
if (!game.save.persistent) game.typography.label({ x: 8, y: 8, text: 'SCORES NOT SAVED' });
```

### Types

- `SaveOptions` — `{ namespace? }`, below.
- `SaveApi` — the object on `game.save`.

## Options

| option | default | meaning |
|---|---|---|
| `namespace` | `'phaser-ae'` | Key prefix. Give each game its own, or two games on one origin share scores. |

```json
{ "id": "save", "options": { "namespace": "my-game" } }
```

## Limits

Values must survive `JSON.stringify`: no functions, `Map`, `Set`, `undefined`
members or cyclic objects. Cycles, BigInt and values whose serialization is undefined throw a `TypeError` before changing data. A storage operation that fails switches the session to memory and updates `persistent` to false. Existing readable data is mirrored, and subsequent reads, writes, deletion and enumeration agree on that memory store. Memory-store values vanish on reload. Two tabs on one origin share the same
localStorage and do not see each other's writes until they read again. There is no
encryption or signing: a player can edit their own scores.
