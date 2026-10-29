# Navigation Grid and Flow Field

Navigation in two tiers, because the right answer depends on how many things are asking. A grid searches a route for one agent going somewhere specific; a flow field answers the same question once for a thousand agents heading to the same place. Both work for a 3D world (a grid over a height function in world X/Z) and a 2D one (a grid over a tile map in world X/Y), and both plan for a point or for a body of a given radius, so a wide guard is never sent through a gap it cannot fit or across the corner of a wall. They are pure and headless, so they run in a worker or a test exactly as they do in a frame.

## When to use it

A **grid** when a handful of agents each go somewhere different: it runs A* between two world points and string-pulls the result so a route reads as a straight line where it can rather than as a staircase of cells. A **flow field** when many things head to *one* place: it floods the grid outward from the goal once, leaving a direction in every cell, so a thousand followers each cost a single lookup rather than a search.

Pick the grid by the game's space. **`NavGrid`** (from `game.nav.grid`) samples a height function over world X/Z, marks cliffs and water unwalkable and prefers flat routes: a 3D game on terrain, or any game in X/Z. **`NavGrid2d`** (from `game.nav.grid2d`) is a tile map over world X/Y with y down: a top-down 2D game (a stealth game, a dungeon, a tower defense) gets `{x, y}` points straight back, with no height function or axis mapping.

Give a **radius** whenever the walkers have a size. A guard 20 units wide should not plan through a 16-unit gap, and should not be routed so close to a door jamb that its body catches on it; a radius on the grid, or on one call, keeps the whole route at least that far from every wall, and still fits the body through any gap that is wide enough for it.

A **weighted flow grid** (`FlowGrid`, from `game.nav.flowGrid`) for tower defence and crowds on a flat grid: cells that cost more to cross (mud, roads), several goals in one field, `canBuild` ("would this wall cut the last route from a spawn?") and a smooth `steer` between cell centres. Its walkers are points; for walkers with a size use a grid's flow field.

Both grids drop straight into `steering`: a 3D grid into a `navigate` behavior (give it the agent's `radius` too), a 2D one into a 2D agent's, a field into a `flow` one. For a horde on a 2D grid without steering, read `field.dirAt(x, y)` each frame; for a single 2D walker, follow `grid.path`'s points, and turn for the next one early only when `grid.clear(position, next, {radius})` says the body can reach it straight.

<!-- shared: which-path -->
### Which pathfinder?

| For | Compose | What it is |
|---|---|---|
| A few agents each going somewhere different, in 2D or over 3D terrain | `nav`, `grid.path` | A* over a grid (`grid2d` for a tile map in X/Y, `grid` for a height function in X/Z), string-pulled, planning for a body's radius |
| Many walkers of a given size heading for one place: a horde, a crowd at a door | `nav`, `game.nav.flow` | one flood from the goal leaves a direction in every cell, and floods only the cells the body fits |
| Tower defence and crowd flow on a flat grid: weighted cells, several goals, "would this wall cut the last route?" | `nav`, `game.nav.flowGrid` | a weighted Dijkstra field (`FlowGrid`) with `canBuild` and smooth `steer`; its walkers are points |
| 3D routes a height grid cannot hold: bridges, arches, ramps, a floor above a floor | `nav-mesh` | a Detour navmesh baked from the level's geometry, with the same `path(start, goal)` as `nav`'s grid |
| Moving a body along any of these, with avoidance, flocking and arrival | `steering` | agents on a 2D world's plane or a 3D world's ground: `navigate` plans over a `nav` grid (2D or 3D) or a `nav-mesh`, `flow` follows any flow field |
| Authored routes rather than searched ones: rails, a circuit, a branching track | `track` | a graph of nodes and edges in path notation, whose walkers choose at junctions |
| Movement locked to a grid: a maze chase, a digger | `grid-move`, `grid-walker` | lanes for a handle steered by the keys in pixels (`grid-move`), or the pure walker in tiles that rules packs move their actors with, with turn buffering, arcade cornering and portals (`grid-walker`) |
<!-- /shared: which-path -->

## Requires

Nothing. Pure and headless.

## API

| call | what it does |
|---|---|
| `game.nav.grid(opts)` | build a `NavGrid` over a height function in world X/Z |
| `game.nav.grid2d(opts)` | build a `NavGrid2d` over a tile map in world X/Y |
| `game.nav.flow(grid, goal, {radius}?)` | integrate a flow field toward one goal (a `FlowField`, or a `FlowField2d` for a 2D grid) |
| `game.nav.flowGrid(opts)` | a weighted `FlowGrid` over `cols × rows` cells (below) |
| `game.nav.pathAsync(grid, start, goal, {signal, radius, partial}?)` | `grid.path` on a worker (below) |
| `game.nav.last` / `game.nav.last2d` | the last grid built by `grid` / `grid2d` |
| `grid.path(start, goal, {radius, partial}?)` | A*, string-pulled, as world points: `{x, y, z}` on a `NavGrid`, `{x, y}` on a `NavGrid2d`; `[]` when there is no route, or with `partial: true` the route to the reachable cell nearest the goal |
| `grid.clear(from, to, {radius}?)` | whether a body can slide straight between two world points without touching a wall (exact) |
| `grid.flowField(goal, {radius}?)` | the same as `game.nav.flow` |
| `grid.astar(sx, sz, gx, gz, radius?)` | A* alone: cell indices start→goal, or `null` (`sx, sy, gx, gy` on a `NavGrid2d`) |
| `grid.stringPull(cells, radius?)` / `grid.lineOfSight(a, b, radius?)` | the straightening step, and the test it uses, on cell indices |
| `grid.waypoint(i, radius?)` | where a route for that body passes through cell `i` (below), or `null` |
| `grid.clearance` | per cell, the distance from its center to the nearest unwalkable cell or the grid's edge, in world units |
| `grid.fits(i, radius?)` | whether a body that size can stand anywhere in cell `i` |
| `grid.setWalkable(i, walkable)` | open or close one cell: a door, a dropped crate |
| `grid.walk` / `grid.invalidate()` | per-cell walkability (1 or 0); call `invalidate()` after editing `walk` in place |
| `grid.worldToCell`, `cellCenter`, `idx`, `inBounds`, `walkableCell`, `nearestWalkable` | cell lookups (`ix, iz` on a `NavGrid`, `col, row` on a `NavGrid2d`) |
| `field.dirAt(x, z)` / `field.reachable(x, z)` | the steering direction there, and whether the goal can be reached (`x, y` on a `FlowField2d`) |
| `grid.snapshot()` / `NavGrid.fromSnapshot(s)` / `NavGrid2d.fromSnapshot(s)` | a structured-cloneable copy, for a worker |

`PathPlanner` (`path(start, goal, {radius}?)` in `NavVec3`s, and optionally `clear(from, to, {radius}?)`) and `PathPlanner2d` (the same in `NavVec2`s) are the contracts a planner offers; a `NavGrid` is the first and a `NavGrid2d` the second. `NavGridCore` is what the two grids share.

A top-down 2D game from a tile map, with guards 12 units across on 16-unit tiles:

```ts
const map = ['##########', '#....#...#', '#....#...#', '#........#', '##########'];
const grid = game.nav.grid2d({
    cols: map[0].length, rows: map.length, cell: 16,
    walkable: [...map.join('')].map(c => c !== '#'),
    radius: 6,                                     // every guard is a 12-unit disc
});
const route = grid.path(guard, thief);             // [{x, y}, …] clear of every wall by 6
const sprint = grid.path(guard, exit, { radius: 4 }); // one call can plan for a smaller body
grid.setWalkable(grid.idx(5, 3), false);           // a door shuts; the next path goes round
```

A map whose walls are not whole tiles (a round pillar, a diagonal wall) is sampled at a finer cell through `blocked(x, y)`:

```ts
const fine = game.nav.grid2d({ cols: 80, rows: 40, cell: 4, radius: 6, blocked: (x, y) => level.solidAt(x, y) });
```

A 3D world with a crowd of 1.2-unit-radius walkers, and a horde field for the same bodies:

```ts
const grid = game.nav.grid({ heightAt: terrain.heightAt, size: 240, res: 120, maxStep: 3, blocked, radius: 1.2 });
game.steering.spawn({ pos, maxSpeed: 8, behaviors: [{ kind: 'navigate', grid, target: goal, radius: 1.2 }] });
const field = game.nav.flow(grid, goal);           // the grid's radius applies here too
```

### Weighted flow grids

`game.nav.flowGrid({ cols, rows, goals?, spawns?, diagonal = true, cutCorners = false })` (or `new FlowGrid(...)`) is a
grid of `{ col, row }` cells, 0-based and row-major, whose one Dijkstra sweep points every cell at the nearest of its
goals. Edits mark it dirty and the next query rebuilds it.

| call | what it does |
|---|---|
| `setBlocked(col, row, on)`, `build`, `unbuild`, `clearBlocked()`, `isBlocked(col, row)` | walls: a tower placed or sold (out of bounds reads as blocked) |
| `setWeight(col, row, w)` | a cell's entry cost: `1` normal, more for mud, less for a road (floored at `0.0001`) |
| `setGoals(cells)` / `setSpawns(cells)` | the goals everything flows to; the spawns only `canBuild` reads |
| `canBuild(col, row)` | whether a wall there still leaves every spawn a route to a goal (false on a goal, a spawn or a wall) |
| `steer(x, y, cellSize = 1, originX = 0, originY = 0)` | the smooth unit direction at a world point, blended from the four nearest cell centres |
| `flowDir(col, row)` / `flowVec(col, row)` | a cell's 8-way direction (`0` east, clockwise, `-1` none) and as a unit vector |
| `distance(col, row)` / `reachable(col, row)` | the weighted cost to the nearest goal (`Infinity` when none), and whether there is one |
| `path(from, maxSteps?)` | the cells to a goal along the arrows, for drawing a preview |
| `cellAt(x, y, cellSize = 1, originX = 0, originY = 0)` | the cell holding a world point, or `null` |
| `update()` | rebuild now, to pay the cost at a known time |

```ts
const TILE = 16;
const grid = game.nav.flowGrid({ cols: 40, rows: 24, goals: [{ col: 39, row: 12 }], spawns: [{ col: 0, row: 4 }, { col: 0, row: 20 }] });
if (grid.canBuild(c, r)) grid.build(c, r);          // refuse a tower that would seal a spawn in
grid.setWeight(10, 7, 4);                           // mud costs four times as much to enter
game.step('horde', dt => { for (const e of enemies) { const s = grid.steer(e.x, e.y, TILE); e.x += s.x * e.speed * dt; e.y += s.y * e.speed * dt; } });
```

In 3D pass the ground coordinates (`grid.steer(mesh.x, mesh.z, cell, originX, originZ)`), as the `flowfield3d` demo
does; `steering`'s `flow` behaviour takes it as a function. The whole field is rebuilt on a change, every goal is
equal, and a cell is open or blocked (no body radius); `canBuild` floods the grid each call.

## Options

The pack takes no manifest options. Each grid takes its own.

**`NavGrid`** (`game.nav.grid`): `heightAt(x, z)` is the ground; `size` (world units across, the grid is square) and `center` (default the origin) place it; `res` (default 64) is cells per side. A cell is unwalkable when it sits below `minY` or `blocked(x, z)` returns true for it, which is how a game marks water, lava or a building's footprint without changing the terrain. A step between neighbors higher than `maxStep` (default 1.2 cells) is a cliff; `slopePenalty` (default 3, 0 to ignore slope) makes climbing cost more.

**`NavGrid2d`** (`game.nav.grid2d`): `cols` and `rows` (whole numbers) are the cells across and down; `cell` (default 1) is a cell's size in world units, usually the tile size; `origin` (default `{x: 0, y: 0}`) is the world position of the grid's top-left corner, so cell `(col, row)` covers `origin.x + col * cell` onward. `walkable` is one entry per cell, row by row, truthy for floor; `blocked(x, y)` is asked at each cell's center and returns true for a wall. Give either or both (a cell is walkable when both agree); with neither, the floor is open. Bad sizes and a `walkable` of the wrong length throw.

**`radius`**, on either grid (default 0, a point), is the walker's radius in world units, and the default for every query on that grid. `path`, `flowField` and `game.nav.flow` take `{radius}`, and `astar`, `stringPull`, `lineOfSight`, `fits` and `nearestWalkable` a trailing `radius`, to plan for another size on the same grid; one grid serves guards, a thief and an ogre. What a radius does:

- **Where the body stands.** A route passes each cell at its center, or, for a body too wide to stand at the center, at the roomiest of the cell's edge midpoints and corners that is `radius` clear of every unwalkable cell and the grid's edge (`grid.waypoint`). Walls are whole cells, so the middle of any gap between them is a center, an edge or a corner: a body fits any gap at least `2 × radius` wide, exactly, at any cell size. A 2-tile door at tile resolution takes a body a tile wide, along the line between its two cells.
- **A\*** steps only between cells the body can stand in, along moves the body can make between those points. A gap narrower than the body is refused, and a route that needed one comes back `[]`.
- **String pulling** keeps a straight leg only when the body, swept along it, touches no unwalkable cell and stays on the grid. The test is exact, not sampled, and `grid.clear` asks it of any two points.
- The **start and goal** snap to the nearest cell the body fits in that it can walk to from where it is, never through a wall, so a target in a closet too small for the body is planned to the closet's mouth. A walker standing on the edge between cells (where its last route ended) starts its next route exactly there.
- A **flow field** floods only cells the body fits in, so a big horde never queues at a door it cannot pass. Cells along the walls, too tight for the body, still point back out into the field, so a body pressed against a wall is never left without a direction.

A negative or non-finite radius throws.

## Limits

The 3D grid is 2.5D: one height per cell, so bridges and overhangs cannot be represented — that is what `nav-mesh` is for. A flow field serves exactly one goal; a second goal is a second field. Neither knows about moving obstacles: `setWalkable` a cell and plan again, rebuild the grid, or let `steering`'s `avoid` handle what moves.

The radius is exact against the grid's own walls; how well those match the game's walls is the cell size's business. A wall that is not whole cells (a round pillar, a diagonal) is a staircase of cells, so sample it at a cell small enough. The radius counts unwalkable cells and the grid's edge as walls; a cliff between two walkable cells of a `NavGrid` is impassable but is not widened by the radius.

The radius makes the route clear; it does not make the walker follow it. A follower that turns for the next waypoint before reaching the current one cuts the corner by that much, and a steered body swings wide of a sharp turn by its momentum. Turn early only when `clear` says so (steering's `navigate` does, given a `radius`), or give the walker its own collision.

Without a radius both grids plan for a point exactly too: a route may pass a wall as closely as it likes but never touches one, and a flow field never points diagonally past a blocked corner.

The clearance map is built on the first query with a radius and cached until a cell changes: under 20 ms on an open 512 × 512 grid. A big body's planning costs more than a point's where routes squeeze through gaps, since each step there is swept exactly. Snapping walks outward from the point through walkable cells; when nothing the body fits in can be walked to, there is no route.

## Off-thread paths

`await game.nav.pathAsync(grid, start, goal, {signal, radius})` runs `grid.path` on a worker snapshot of a `NavGrid` or a `NavGrid2d`, with the grid's radius unless the call gives one. Start the game before awaiting it: results settle at a frame boundary. The original grid stays usable while copied buffers transfer to the worker. AbortSignal or scene disposal cancels the job. The bakery emits only this composed pack's `nav/path` worker; serve the generated `workers/nav-path.js` next to the game bundle.
