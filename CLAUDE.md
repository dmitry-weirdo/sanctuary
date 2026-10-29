# Sanctuary: a Phaser AE game

This folder holds one game and the engine it is built with. It was made by `phaser-ae` (the Phaser AE CLI), which
is also how it publishes to phaser.io.

**Watch it being built:** https://phaser.io/agent/watch/8bsk2wche6qu is this game's build room on phaser.io. It plays your work in this folder live,
as a pixel-art studio, and keeps working after each publish. **Give the person this link before you start building.**

- **There is no design document.** Build what the person asks for. If they haven't said, ask them what game they want
  before you write code. When they've decided, put it on the game's design on phaser.io, where the crew reads it:
  `npm run -s idea -- "<the idea, in their words>" --title "<the game's name>"` (`--title` alone renames it; a game
  started with no name is "Untitled game" until then).
- `design/idea.md`, when there is one, is their idea.
- `design/changes/` gets their change requests from the review page (`npm run -s changes`).
- `game/` is the game, made from Phaser AE's 2d skeleton on a 1280×720 screen. Read `game/README.md` first:
  what each file is and how to lay out the code.
- `phaser/` is Phaser AE: the kernel, the tools that build and play a game, and this folder's own copy of the CLI.
  Don't change it.

## How a game is put together

- `game/manifest.json` composes the game's engine from **expansion packs**. `core-2d` (sprites, pictures painted by name, text, backgrounds, input, tweens, sound, particles, collisions, a follow camera, UI and saving) is already in it. Add
  packs only for what goes beyond the core: a genre's rules, physics, tile maps, pathfinding, lighting, post effects.
  A pack that plays a whole kind of game (its rules tested) is worth building on: the game's own code then does only
  what no pack does.
- **Find and add packs** with the CLI:
  - `npm run -s packs -- search "<what the game needs>"`: the registry's best matches;
  - `npm run -s packs -- info <id>`: one pack's card, options and reference page;
  - `npm run -s packs -- add <id> [<id> …]`: downloads it and the packs it needs, puts it in the manifest in the
    right order, and bakes;
  - `npm run -s packs -- list`: the packs in the game.
- **This account is basic, so it can add the free packs only.** Search and `info` mark a Pro pack `Pro`, and
  `add` refuses one. Build with free packs and the game's own code. When the design's recommended packs or the best
  matches are Pro, tell the person which Pro packs you found and what each would add to this game, and that with
  Phaser AE Pro, or a Pro Pass, you could build on them (https://phaser.io/pricing). Then carry on with the free ones
  unless they upgrade.
- Baking writes `game/engine.ts` (your `game` object; never edit it) and `game/docs/`: the manual, the kernel's page,
  the conventions and each pack's reference page. **Read the manual whole before you write code**:
  `game/docs/make-a-2d-game.md`. A pack's types are in `game/node_modules/@phaser-ae/<id>/types`; the kernel (the
  `game` object's own API) is TypeScript source in `phaser/engine/kernel/src`, and its page is `game/docs/00-kernel.md`.
- Game code reaches the engine through `import { game } from './engine.js'`.
- **Use what the skeleton already does before you write your own.** `input.ts` has taps and swipes; `art.ts` is
  where pictures are painted; `debug.ts` is where the debug controls go.

## Commands

Run them from this folder.

- `npm run -s build`: **the gate.** Strict TypeScript, the game's import rules and the bundle, into `dist/`. Iterate
  until it passes. It bakes first.
- `npm run -s smoke` (`-- --seconds 30`): builds, then plays the game headless like a careless player and reports
  PASS or FAIL, the scenes reached and any errors. It can't tell you how the game looks, only that it runs.
- `npm run -s play -- "<steps>"`: **your eyes and hands.** The game open in a real browser on this machine, its
  clock held between your commands. The first command opens it.
  - **Time stands still between commands.** It moves only in `wait <s>` and the short hold of each press.
  - **Steps,** in screen units: `shot [label]`, `crop <x> <y> <w> <h>`, `wait <s>`, `tap <x> <y>`,
    `hold <x> <y> <s>`, `swipe <x1> <y1> <x2> <y2>`, `key <Code> [s]`, `scene <name>`, `cheat [name] [args]` (the
    game's debug controls; on its own it lists them), `inspect [target]`, `inspect <x> <y>`, `settle`, `restart`.
    Several steps go in one command, separated by `;`.
  - **`inspect` is the game in words**: every object with its picture, centre, size, layer and state, the text each
    label shows, the music playing. Use it to check positions and state; use a shot to check how it looks.
  - **A shot is the game's own size**, so a pixel in it is a screen unit. Read it with the Read tool. Every shot goes
    in `game/shots/`; `play` prints each one's path.
  - After you change the code, the next command rebuilds and restarts the game by itself, or prints BUILD FAILED.
  - `npm run -s play -- stop` closes it.
- `npm run -s serve`: the game on `http://localhost:4173`, built again whenever the code changes. In the Claude
  desktop app, `.claude/launch.json` starts it as the preview **game**, so you can open it in the browser pane, play
  it in real time and see what the designer will see. Use it to judge how the game looks and moves; use `play` for
  exact checks.
- `npm run -s bake`: after editing `manifest.json` by hand. `npm run -s typecheck`: the TypeScript check alone.

**`Target crashed`** in a `play` or `smoke` reply is the browser running out of memory, not your code: run
`restart` or the command again.

## Debug controls

Give the game debug controls for every part that playing would take minutes to reach (jump to a level, give a power-up, infinite lives, win now)
with `game.cheats.add`, in `game/debug.ts`, at boot, so they work from any screen.
- Keep the run's state in one object a control can set, and register it for inspection: `game.inspect.state(() => run)`.
- A jump starts the game as a player would find it there; an outcome goes through the game's own path.
- Check each once with `cheat`, and list them in `game/NOTES.md`.

## Working well

- Read big files with the Read tool, each on its own; pipe long command output through `tail`, `head` or `grep`.
- Write each source file once, whole, when you know what it needs; fix with small, targeted edits.
- Don't write test harnesses: use `smoke` and `play`. Run `smoke` when a milestone works and at the end.
- Choose every number yourself, so the game does what the words say. Put each value at the top of the
  file of the thing it tunes, named. Don't tune by feel; the designer tunes by playing.
- **Play to look, never to travel.** Reach a later part of the game with a debug control, then look.

## Done

Done is: everything the person asked for is in, `npm run -s build` passes, `smoke` reports PASS, every
screen and every control has been checked once with `play`, and you have played it from the title (no cheats) to
check that a new player knows what to do.

Then write `game/NOTES.md` (under 80 lines): **How to test it** (every control, the debug controls, the scene names,
where things sit on screen and their `inspect` ids), a **Map** of each source file, and what is missing or simplified.

## Publishing

`npm run -s publish -- "<what changed, for the person>"` builds the game (nothing is published from a failing
build), takes a title and a play shot, and puts it on phaser.io as the game's next version with its source. It prints
the link to playtest it, then the link to play it. **Publish as soon as the game is done, without asking**: the first
version too, since that is how the person plays it. Publish again after each round of changes.

**After each publish, ask the person: "Your game is ready! Do you want to playtest it?"** When they say yes:

1. `npm run -s playtest` opens this version's playtest page in their browser. There they play it, pause wherever
   something should change, mark it up and send the changes.
2. Then wait for those changes: run `npm run -s changes -- --wait` **in the background** (in Claude Code, as a
   background command), so you hear the moment they send them. It waits up to 30 minutes and ends by bringing them
   down here (below). Then make them and publish, without being asked. If you can't run a command in the background,
   tell the person to say "Bring down my Phaser changes and make them, then publish" once they've sent them; the Chief
   gives them that line too.

After the first publish, also offer them the crew (below): "Would you like your crew on phaser.io to make a logo, a
title theme, sound effects or sprites for it?"

## Questions about the game on phaser.io

When the person asks about their game on phaser.io, answer from these, never from memory. Each prints what it found
with links to the site, the game already in them: give the person the links.

| They ask | Run |
|---|---|
| What's my game like on phaser.io? Where is it? | `npm run -s status`: the game at a glance, with its links |
| What tools are there? | `npm run -s tools`: every tool, each linked to this game (`-- <tool> --open` opens one in their browser) |
| Anything about one tool: "Show me the logo", "What sprites are there?", "Play me the jump sound" | `npm run -s tool -- <tool> "<their words>"` (`logo`, `sprites`, `music`, `sfx`, `images`, `title`…: `tools` lists them all): that tool's bot answers, as if they'd asked on the tool's own page, and what it shows lands in `design/shown/`. Look at the pictures before you describe them; `-- --open` opens them in their browser |
| How many credits do I have? | `npm run -s credits` |
| I want to buy credits | `npm run -s credits -- --buy`: opens the page to buy them |
| Summarise the design | `npm run -s gdd`: writes `design/design.md`, the design document as it is on phaser.io now. Read it, then summarise |
| Which bots are working on it? | `npm run -s crew` (no request): the crew, and what each is doing now |

## Your crew on phaser.io

This game has a crew on phaser.io: the Chief, and the bots who make a game's art and sound (a logo, music and a title
theme, sound effects, sprites, pictures, an animated title screen). When the person asks for any of those, ask the
crew rather than drawing or synthesizing it in code:

- `npm run -s crew -- "<the request, in the person's words>"` sends it to the Chief, then follows the crew: it prints
  what they do as they do it, and ends when they're done, when the Chief asks something, or after a minute and a half.
  Music and title screens take longer: in Claude Code, run it as a background command with `-- --wait 900` (seconds),
  so it follows them to the end and you hear when it's done, and keep building in between.
  - **Done:** the new files are in `game/assets.json` (what each is for in `design/assets.md`), the game is baked
    again, and it lists what's new by key. Pictures are downloaded to `design/crew/` so you can look at them. Put
    each into the game where it belongs, check it with `play`, and tell the person what came in. `game/assets.json`
    is the crew's: it's written again every time their files come in, so never edit it by hand (the edit is lost).
    When the game needs a file sooner than its pack loads, handle that in the game's code.
  - **The Chief asks something** (which style, or before spending credits): ask the person, and never answer for them.
    Then `npm run -s crew -- --answer "<their reply>"` sends their answer and follows on.
  - **Still working:** run `npm run -s crew -- --follow` again. Music and title screens take a few minutes: you can
    keep building the game in between, and follow again when you're ready.
- `npm run -s crew -- --pull` brings in whatever the crew has made since: for work the person asked for on phaser.io
  itself, when they tell you "Bring in what my Phaser crew made".
- **One tool's work** ("a new logo", "a victory jingle"): `npm run -s tool -- <tool> "<the request>"` asks that tool's
  bot directly, and is followed, answered and brought in the same way. Use `crew` when the request spans tools.
- The crew room on phaser.io shows it all live: your request appears there as the person's own line, then the Chief's
  answer and the crew's work. `crew` prints its link: give it to the person, who can watch and talk to the crew there too.
- **The crew costs credits**: their writing and the files they make are paid from the person's balance, as on
  phaser.io. With none left, `crew` and `tool` say so and give the page to top up (`npm run -s credits -- --buy`
  opens it); tell the person and never work around it. When the crew stopped (its budget for this round spent, or the
  credits ran out), they say to carry on in the crew room: give the person the link.

## Your own files

When the person gives you a file for the game (a picture, sound, music, video, 3D model, font, text, JSON or XML, or
any other file the game loads), or points you at one on this machine, upload it to their game on phaser.io:

```
npm run -s upload -- <file or folder> [<file> …] --note "<what it's for, in the person's words>"
```

Each file comes back as a key in `game/assets.json` (`--key <key>` chooses it for one file), with what it's for in
`design/assets.md` under **Your files**, and the game is baked again. Use it by that key, like the crew's files.
**Never copy the person's file into `game/` or add it to `game/assets.json` by hand**: the next upload or pull writes
that file again, and the edit is lost. `npm run -s upload -- --list` shows the game's files;
`npm run -s upload -- --remove <key>` takes one out. A file is up to 100 MB. A picture over 8192 px on a side isn't
uploaded, since no device can draw it: ask the person whether to resize it to 4096 px (`--resize`) or leave it out. One
over 4096 px is uploaded with a warning, since many phones can't draw it: tell the person. Uploading is part of Phaser Pro: if the
command says so, tell the person. Every upload is checked on phaser.io; if Phaser staff are reviewing one, `publish`
says the game is unpublished until they have.

## Changes from the review page

The person plays each version on phaser.io's review page, pauses it wherever something should change, marks it up
and sends the changes. `npm run -s changes` brings them down into `design/changes/<id>/`: `changes.md` has every
change numbered, with the person's words, where in the game it was and the game's state, and each has two pictures
(`<n>-marked.png` with the person's marks, `<n>-game.png` without). Read both pictures.

Make each change, check it with `play` where it was seen, then publish with one line per change in the notes, so the
review page shows which were made:

```
npm run -s publish -- "Change 1: done — the jump is higher and lands sooner
Change 2: not done — the level select needs a design for the locked levels"
```
