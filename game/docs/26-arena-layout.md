# Arena rooms

Seeded rooms for top-down action games: a walled grid with obstacles in it, every open cell reachable from the start,
an exit, and a route between them. And the movement such rooms want: a flow field towards a goal with a steer that
rounds corners for a body of real size, circle-against-walls tests and moves that slide along walls, and spawn points
away from the start.

## When to use it

For the rooms of a twin-stick shooter, an Archero-style room run, a survivors arena, a stealth level: anywhere bodies
move about a grid of walls.

| You want | Use |
|---|---|
| Rooms of walls and obstacles, and moving round them | this pack |
| Just a flow field over a grid of your own | `nav` (`FlowGrid`, or a `NavGrid2d`'s flow field for bodies of a size) |
| Line of sight round walls | `visibility-2d` |
| A playfield's shape and edges (wrap, bounce) | `arena` |
| Tile maps of your own design | `tiles-2d` |

## Requires

Nothing to compose; it imports `nav`'s `FlowGrid`.

## API

- `generateArena(options?)` — a room, by seed. Throws, with every fault, on options it refuses.
- `validateArena(options?)` — one line per fault; empty when a room can be generated.
- `arenaField(layout, goal)` — a `FlowGrid` towards a point: every open cell knows the way round the walls.
- `arenaSteer(field, point, cell?)` — a unit direction to go from a point: towards the next cell's centre, so a round
  body clears corners rather than cutting them.
- `circleFree(layout, point, radius?)` — true when a circle touches no wall.
- `moveInArena(layout, point, dx, dy, radius?, corner?)` — moves the point in place, sliding along walls. Moving
  straight at the corner of a wall it overlaps by no more than `corner` of its radius (0.5), it slips round the corner
  rather than stopping, as players expect; 0 turns that off.
- `lineClear(layout, x0, y0, x1, y1)` — true when the segment crosses no wall cell: whether a shot gets there, and
  whether a shot moving this step hits a wall. It walks the cells the segment crosses, so it never cuts a corner.
- `arenaSpawns(layout, count, seed, minDistance?)` — open cell centres at least `minDistance` (180) from the start,
  in a seeded order.
- `isBlocked(layout, col, row)` — true for a wall cell (or one outside the room).
- `arenaStyles` — `pillars`, `courtyards`, `barricades`, `ruins`, `galleries`.

A layout is `{ seed, style, cols, rows, cell, walls, blocked, start, exit, open, route }`: `walls` the wall
rectangles, `blocked` their cell indices (`row * cols + col`), `open` every open cell's centre, `route` a shortest
path of cell centres from the start to the exit.

```ts
const room = generateArena({ seed: 12, style: 'ruins', start: 'bottom', exit: 'top' });
const toHero = arenaField(room, hero);
for (const e of enemies) {
    const v = arenaSteer(toHero, e, room.cell);
    moveInArena(room, e, v.x * e.speed * dt, v.y * e.speed * dt, e.radius);
}
```

`game.arenaLayout` has `generate`, `validate`, `field`, `steer`, `free`, `move`, `spawns` and `styles`.

## Options

None for the pack; `generateArena` takes:

| Option | Default | |
|---|---|---|
| `seed` | 1 | |
| `cols`, `rows` | `[12, 15]`, `[16, 19]` | the size, walls included: a number or `[min, max]` |
| `cell` | 40 | a cell's size in world units |
| `style` | picked by seed | the obstacle style |
| `obstacles` | `[9, 14]` | how many obstacles are tried |
| `start` | `'bottom'` | `'top'`, `'bottom'`, `'centre'` or `{ col, row }` |
| `exit` | `'top'` (its column by seed) | the same |
| `clearance` | `{ start: 2.75, exit: 2.25 }` | cells kept clear round each |

## Limits

- An obstacle that would cut any open cell off from the start is left out, so a room may hold fewer than asked.
- Rooms are grids: walls are whole cells. Bodies are circles.
- The flow field is rebuilt by `arenaField`; for a goal that moves every step, rebuild it a few times a second, not
  every step.
