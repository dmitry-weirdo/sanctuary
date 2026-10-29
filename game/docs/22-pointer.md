# Per-object pointer handlers

`over`, `out`, `down`, `up`, `tap` and `drag` on the objects that want them — with the capture rule that makes a drag survive the pointer leaving the object.

## When to use it

Buttons, drag-and-drop, clickable sprites, map pins — anything where an *object* should respond to a pointer rather than the game doing its own hit-testing.

Skip it for a game driven entirely by keys. For a full widget set — panels, sliders, text fields — use `ui`.

## Requires

Nothing. Headless-safe: with no pointers it does nothing.

## Why it exists

The kernel already gives you the raw pointer list, and the roster already gives you picking. What every game then writes for itself is the bookkeeping **between** them: which object a finger is over, which one it went down on, whether the release counts as a tap, and what happens when the finger leaves the object it captured.

It is the same fifty lines every time, and it is the same fifty lines that get it subtly wrong.

## The two rules, both about capture

**A press captures.** Everything that follows — the drag, the release, the tap test — goes to the object the press landed on, even once the pointer has slid off it. Without that, dragging a slider stops the moment the pointer leaves the knob, which is the single most common bug in a hand-rolled version.

**A tap is a release *on* what was captured**, without having wandered further than `tapSlop`. Sliding away and letting go is a cancelled press, not a tap somewhere else.

`over` and `out` are the exception: they only ever concern what the pointer is actually on, so a hover highlight is right even mid-drag.

## Using it

```ts
game.spawn({
    x: 100, y: 100, width: 64, height: 24, frame: Art.BUTTON,
    pointer: {
        onOver: (e) => { e.target.tint = '#ffd166'; },
        onOut:  (e) => { e.target.tint = '#ffffff'; },
        onTap:  () => start(),
    },
});
```

Handlers are a **data bag on the object**, so they compose like `body` or `fsm`, and `over` and `held` are live on it for a hover or a pressed look. Screen pixels are converted to world units, so a handler never has to know which the game is in.

## API

`game.pointer`:

| | |
|---|---|
| `over(id?)` | the object under a pointer right now |
| `captured(id?)` | the object a press captured |
| `release(id?)` | drop a capture by hand — a scene change mid-drag |
| `count` | how many objects carry handlers |

On an object's `pointer` bag: the six handlers, plus `tapSlop`, `dragThreshold`, `enabled`, and the live `over` and `held`.

## Options

None at compose time. Everything is per object. `dragThreshold` is a live distance in world units (default `0`). A captured press must move that far from its start before `onDrag` begins; after that it continues even when moving back toward the start. Capture and release still occur below the threshold.

### Making something interactive later

The spawn spec's `pointer` key is the usual way in. `game.pointer.add(h, spec)` covers the
rest: an object a **pack** spawned — a canvas text, a widget — and a plain object switched
on partway through. `game.pointer.remove(h)` takes the handlers away again.

The same pair is in the registry under `('pointer', 'pointer')`, which is how another pack
makes the objects it spawns interactive without importing this one — and how leaving this
pack out makes those objects quietly static rather than broken.

## Limits

Picking is the roster's, which is **top-most by depth** over an object's rect, among the objects with handlers: a
label, an icon or a decoration drawn over a button does not take its presses, and a press anywhere reaches a
full-screen object underneath unless something with handlers is above it. To make a panel stop presses reaching what
is under it, give it handlers, even empty ones (`pointer: {}`). A world may refine picking per shape; this pack does
not add its own shape test.

One capture per pointer. A multi-touch game gets one per finger, keyed by `id`, but two fingers on one object are two independent captures rather than a gesture — `sketch` and `ui` handle gestures.

An object killed mid-drag drops its capture silently. That is deliberate: a `onUp` for an object that no longer exists is worse than none.
