import { game } from './engine.js';

/**
 * Taps and swipes, for a game a phone plays. Keys need nothing here: read `game.input.keyDown('ArrowLeft')` or
 * `game.input.keyPressed('Space')` in a step (docs/make-a-2d-game.md, Input).
 *
 * Gestures arrive between steps: `listen()` keeps the latest of each until a step reads it with `tapped()` or
 * `swiped()`. Call `listen()` in a scene's enter() and what it returns in that scene's exit(). Delete this file if
 * the game has no use for it.
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

let swipe: Direction | null = null;
let tap: { x: number; y: number } | null = null;

/** Hear taps and swipes on the play area until the returned function is called. */
export function listen(): () => void
{
    const gestures = game.input.gestures('world', {
        onSwipe: e => { swipe = e.direction; },
        onTap: e => { tap = game.camera.toWorld(e.x, e.y); },
    });
    return () => { gestures.cancel(); swipe = null; tap = null; };
}

/** Where the player tapped or clicked since this was last read, in world units, or null. */
export function tapped(): { x: number; y: number } | null
{
    const at = tap;
    tap = null;
    return at;
}

/** The way the player swiped since this was last read, or null. */
export function swiped(): Direction | null
{
    const way = swipe;
    swipe = null;
    return way;
}
