# Synth sound and music

Audio suspends when the page is hidden by default and resumes according to the current simulation pause state. Set `suspendWhenHidden: false` to permit background audio when the manifest's simulation policy also continues. This does not change the player's mute preference.

Synthesised sound effects, chiptune loops and streamed music on `game.sound`: a WebAudio
synth as a pack. Define a sound by name once, from a `SoundSpec` (waveform, sweep, notes,
envelope, filter, effects), a layered array of specs or a URL; that name is the contract
between the audio agent and the coder, and you play it by name everywhere. The kernel owns
the unlock moment, the chance source and the pause, so the pack has no timing of its own.

```ts
game.sound.defineAll({
    shoot:  { type: 'square', freq: 880, freqEnd: 220, sweep: 'exponential', duration: 0.12, duty: 0.25 },
    pickup: { notes: [660, 880, 1320], duration: 0.18, type: 'triangle' },
    boom:   { type: 'noise', duration: 0.4, filter: { type: 'lowpass', freq: 1800, freqEnd: 200 }, curve: 'exponential', volume: 0.8 },
    fanfare:{ notes: 'C5 E5 G5 C6:2', step: 0.1, type: 'square' },
    // A tune: voices in parallel, each in notation, one tempo. `x` is a hit — the voice's own sound.
    theme: [
        { type: 'square', duty: 0.25, tempo: 140, notes: 'C4 E4 G4 C5 - G4 E4 C4', volume: 0.5 },
        { type: 'sine', freq: 150, freqEnd: 40, sweep: 'exponential', curve: 'exponential', tempo: 140, notes: 'x - - - x - - -', duration: 0.2 },
        { type: 'noise', filter: { type: 'highpass', freq: 6000 }, tempo: 140, notes: 'x~ x~ x x~ x~ x~ x x~', volume: 0.4 },
    ],
});
game.sound.play('shoot');
const stopTheme = game.sound.loop('theme');                      // chiptune as background music
game.sound.music('music/dusk.mp3', { loop: true, fadeIn: 2 });  game.sound.stopMusic({ fadeOut: 1 });
game.sound.music('music-boss', { crossfade: 1.5 });               // the dusk track fades out as this fades in
game.sound.volume('sfx', 0.6);                                   // buses: master · music · sfx
```

## When to use it

Compose it in any game that makes a noise, 2D or 3D. Synthesised specs need no asset
files and suit chip-tune and arcade games; loaded files carry recorded effects and
music. Name every sound and load every file up front, in the manifest or before
`game.start()`, then call `play` from `fsm` `enter` hooks, collision callbacks and
`feel` moments. Without this pack `game.sound` does not exist; there is no silent fallback.

## Requires

Nothing. It listens to the kernel's `assets.prepare` to decode loaded audio inside its
load job, `input.firstGesture` to unlock the `AudioContext`, `frame.start` to follow `clock.paused`, and `app.shutdown` to suspend (resumed on the first unpaused frame after restart), and `app.dispose` to close
the context; it claims the `mute` and `unmute` commands and draws jitter and noise from
`k.rng`.

## API

### `game.sound`

- `define(name, sound)` — register a `Sound` under a name; a later call with the same
  name replaces it. A URL sound starts loading at once, through the loader.
- `defineAll(sounds)` — `define` every entry of a record; its URL sounds load as one job.
  Defined before `game.start()`, they are preloaded and decoded, ready for their first `play`.
- `play(name, opts?)` — play a defined sound; returns a function that stops it early. An
  unknown name throws in dev (with the list of names it has) and is ignored in production.
  `{ volume }` scales it. `{ at: { x, y, z } }` plays it at a place in the world (see
  "Sound in a 3D world" below); the returned voice's `move(x, y, z)` follows its source.
- `listener(x, y, z, yaw, pitch?)` — where the player's ears are, for positional sounds.
  Call it once a frame from the camera.
- `playSpec(spec)` — play a one-off `SoundSpec` or array of specs without a name,
  for prototyping; prefer `define` and `play`.
- `loop(name, opts?)` — play a defined synthesised sound back to back until the returned stop
  function is called: a tune in notation becomes the background music, joined
  sample-exactly. Not for URL sounds — those go through `music`.
- `length(name)` — seconds a defined sound lasts (its longest layer).
- `sample(key, opts?)` — play an audio file the loader holds, by its key. Decoded in its
  load job, so it plays at once. `{ volume, rate, loop, pan }`; returns a stop function.
  Throws in dev on a key the loader has not got, and says so when the file failed to load.
- `music(track, opts?)` — stream a track on the music bus, replacing the current one.
  `track` is a loaded key (`{ kind: 'audio', key, url, stream: true }`), or the URL of
  a file the loader holds under any key: both play the file already fetched. Any other
  URL streams from the network, in the background. Throws in dev on a name that is
  neither a loaded key nor a URL. Music asked for before the player's first tap or key
  starts on that tap: a title screen can call `music` as it opens. `{ crossfade: s }`
  fades the current track out while this one fades in.
- `stopMusic(opts?)` — stop it; `{ fadeOut }` in seconds fades first.
- `musicTime` — seconds into the current track, as heard, read-only: what to land a
  logo on the music's downbeat by, or to pulse a light with the beat. It wraps to 0
  each time a looping track goes round, stands still while the game is paused or hidden
  and while the track buffers, counts from the start of a fade-in (a fade is only
  volume) and follows the new track through a cross-fade. The output latency the
  browser reports is taken off, so it is the moment you hear, not the moment decoded.
  0 with no music, after `stopMusic`, and until the track starts: music asked for
  before the first tap waits for it, and so does its time. Headless, with no WebAudio
  to play it, the track runs on the game clock instead: seconds of game time since
  `music`, pausing with the game, so a beat-timed title behaves the same in a test.
- `musicDuration` — the current track's length in seconds once the browser has read
  it, read-only; 0 with no music, while it loads, for a live stream, and headless.
- `volume(bus, v)` — set a bus gain, 0..1; `bus` is `'master'`, `'music'` or `'sfx'`.
- `muted` — `true` after the `mute` command, read-only.
- `names` — every defined name, read-only.

```ts
game.sound.define('jump', { type: 'square', freq: 300, freqEnd: 600, duration: 0.1, jitter: 0.05 });
game.sound.play('jump');

// a 120 bpm title track: land the logo on the first bar's downbeat, then pulse on every beat
const BEAT = 0.5, DOWNBEAT = 4 * BEAT;
let landed = false;
game.sound.music('theme', { fadeIn: 1 });
game.step('title', () => {
  const t = game.sound.musicTime;
  if (!landed && t >= DOWNBEAT) { landed = true; slamLogo(); }
  glow.alpha = 0.6 + 0.4 * Math.max(0, 1 - (t % BEAT) / 0.15);
});
```

### For other packs

The pack registers three services in the kernel registry, so a pack can use the mix without `game.sound`:
`('audio-input', 'audio')` routes a media element's sound into a bus (`route(el, 'music' | 'sfx')`, returning a route
whose `gain` is the element's own volume, or null with no WebAudio): `video` sends its audible clips through it, so
the master and bus volumes and `mute` cover them. `('audio-tap', 'audio')` gives a recorder a live track of the mix,
and `('audio-analysis', 'audio')` reads its waveform for visuals.

### Recorded sound: preload it, play it by key

Load every recorded file with the rest of the game's files, before `game.start()`.
That is the preload: each effect is fetched AND decoded under the loading screen, so
its first play sounds at once, and music waits as a file to start on cue.

```ts
const job = game.assets.load([
    { kind: 'audio', key: 'hop', url: 'sfx/hop.mp3' },                       // decoded now: sample('hop') plays at once
    { kind: 'audio', key: 'theme', url: 'music/theme.mp3', stream: true },    // music: kept as the file, streamed when played
]);
game.sound.defineAll({ splash: 'sfx/splash.mp3' });                         // a URL sound by name loads now, in the preload too
await job;
await game.start();
game.scenes.go('title');

game.sound.sample('hop', { volume: 0.8, rate: 1.1 });
game.sound.play('splash');
game.sound.music('theme', { fadeIn: 1 });                                  // the file already fetched: no second download
```

### Commands

- `game.commands.mute()` / `game.commands.unmute()` — silence or restore every bus.

### Types

- `Bus` — `'master' | 'music' | 'sfx'`.
- `Sound` — a `SoundSpec`, a `SoundSpec[]` played together as one compound sound (or,
  when each carries notation, as the voices of a tune), or a URL string to an mp3 / ogg / wav.
- `SoundSpec` — the synth parameters, below.
- `Stop` — `() => void`, what `play`, `loop` and `sample` hand back.
- `MusicOptions` — `{ loop = true, volume = 1, fadeIn = 0, crossfade = 0 }`; `fadeIn` defaults to `crossfade`.
- `AudioOptions` — the pack's manifest options. `SoundApi` — the object on `game.sound`.
- Helpers, exported for tools: `noteFreq`, `parseJingle`, `jingleStep`, `specLength`,
  `soundLength`, `soundTail`.

Other packs reach the sound through the registry: `k.registry.get('sound', 'sound')` is this API (the `title-screen`
pack starts its music and plays its Start sound that way).

## Options

Pack options (`{ "id": "audio", "options": { … } }`):

| option | default | meaning |
|---|---|---|
| `suspendWhenHidden` | `true` | Suspend audio while the page is hidden; `false` lets music play on in the background when the simulation also continues. |
| `masterVolume` | `0.25` | Master bus gain, 0..1. |
| `sounds` | `{}` | A record of named sounds defined at attach, the same as `defineAll`. |

`SoundSpec` fields, all optional:

| field | default | meaning |
|---|---|---|
| `type` | `'square'` | `'sine'`, `'square'`, `'sawtooth'`, `'triangle'`, or `'noise'`. |
| `noise` | `'white'` | Noise colour: `'white'` hiss, `'pink'` rain, `'brown'` rumble. |
| `freq` | `440` | Start frequency in Hz; ignored for noise. |
| `freqEnd` | — | Sweep target in Hz: a zap or slide. |
| `sweep` | `'linear'` | `'exponential'` sounds pitch-linear to the ear. |
| `notes` | — | `number[]` of Hz steps spread over `duration`, or jingle notation (below). |
| `step` | `0.12` | Seconds per jingle step; a jingle ignores `duration`. |
| `tempo` | — | BPM for a jingle: a step is a 16th note. `step` wins if both are set. |
| `gate` | `0.92` | How much of each step a note sounds: 0.5 staccato, 1 legato. |
| `slide` | `false` | Glide between consecutive notes instead of stepping. |
| `duration` | `0.15` | Seconds. |
| `volume` | `1` | 0..1 relative to the bus. |
| `attack` | `0.005` | Attack ramp in seconds. |
| `decay` | `0` | Seconds to fall from the peak to `sustain`. |
| `sustain` | `1` | Level held after the decay, 0..1 of `volume`. With `decay`, a real ADSR. |
| `release` | `0.06` | Release ramp in seconds. |
| `curve` | `'linear'` | `'exponential'` release is percussive. |
| `jitter` | `0` | Random per-play pitch variation, 0..1 (0.1 = ±10 %). |
| `vibrato` | — | `{ freq, depth }` pitch LFO. |
| `tremolo` | — | `{ freq, depth }` loudness LFO: engines, alarms. |
| `duty` | — | Pulse width 0..0.5 for `'square'`; 0.25 and 0.125 are classic chip timbres. |
| `filter` | — | `{ type, freq, freqEnd?, sweep?, decay?, q? }`; a swept lowpass over noise is the explosion; a short `decay` is the pluck of a bass. |
| `distortion` | `0` | Drive 0..1. |
| `crush` | `0` | Bit-crush 0..1: 12 bits down to 2. |
| `echo` | — | `{ time = 0.25, feedback = 0.35, mix = 0.3 }`: space, caves. |
| `pan` | `0` | −1 left to 1 right. |
| `delay` | `0` | Start offset in seconds, for layering specs in one compound sound. |

### Sound in a 3D world

A sound played `at` a place is panned by where it is relative to the listener and fades
with distance, in world units with y up, using the engine's yaw (0 faces +z) and pitch
(positive looks down). Move the ears with the camera and play each sound where it starts:

```ts
game.frame('ears', () => { const c = game.world3d.camera; game.sound.listener(c.x, c.y, c.z, c.yaw, c.pitch); });
game.sound.play('growl', { at: { x: enemy.x, y: 1, z: enemy.z }, near: 2, far: 40 });
const hum = game.sound.loop('generator', { at: { x: 4, y: 1, z: 9 } });   // hum.move(x, y, z) as it goes
```

| Option | Default | Meaning |
|---|---|---|
| `at` | | `{ x, y?, z }` in world units; `y` defaults to the listener's height. Without it the sound is not positional. |
| `near` | `2` | Distance at full volume. |
| `far` | `60` | A one-shot sound farther than this is not played at all (a loop always plays). |
| `rolloff` | `1` | How fast it fades past `near` (inverse distance), 0 to 10. |
| `volume` | `1` | Gain on top of the sound's own volume. |

### Jingle notation

A whitespace-separated string of steps. A step lasts `step` seconds, or a 16th note at
`tempo`; the total length comes from the notation.

| token | means |
|---|---|
| `C5`, `F#4`, `Bb3` | A note: letter, optional `#` or `b`, octave 0–9. |
| `C4+E4+G4` | A chord — voices share headroom. |
| `x` | A hit: this voice's own sound (its `freq` sweep or noise) in time — a drum, a zap. |
| `-` or `.` | A rest. |
| `:N` | Stretch the token to N steps (`C5:3`, `-:2`, `x:0.5`). |
| `!` / `~` | Accent (louder) or soften (a ghost note): `C5!`, `x~`, `x~:0.5`. |

A tune is an array of voices, each with its own notation and the same `tempo`; `loop` it
for background music. Anything the parser does not recognise counts as a rest, so a typo
costs a note, not the rhythm.

## Limits

Sound starts on the first key, click or touch: the browser insists, and a `play`
before that is dropped silently, so do not put the title jingle on boot. Files load and
decode before that gesture all the same. An audio item loaded without `stream` is
decoded into memory, which suits effects and wastes megabytes on a long track; a
`stream` file played with `sample` is decoded then, in the background, and sounds when
ready. Work started during play is silent, never a loading screen: a sound defined then
loads in the background and a `play` before it lands is dropped, and a URL the loader
does not hold streams and starts when enough has buffered. Where
WebAudio is absent (a headless run) every method is a no-op, and `musicTime` counts
game time instead. `musicTime` is as precise as the browser's own clock for the track
(a few milliseconds in Chrome, coarser where a browser rounds it); the latency taken off
is what the browser reports, so a Bluetooth headset that under-reports its delay still
lags. `play` of an unknown
name is only an error in dev; in production it is silent, so a missing sound in a
shipped game is invisible. Music is one track at a time, with an optional cross-fade
from the last; a track asked for before the first gesture waits for it, and sound
effects before it are dropped. `volume` has no fade. The pause
follow is observed on `frame.start`, so the context suspends one frame after the
clock does. Positional sound is panned left and right and fades with distance; it has no
occlusion, no Doppler and no reverb by room, and `equalpower` panning gives no sense of
above or behind. A `loop` runs on a timer and re-schedules a
quarter second ahead, so a tab left in the background may leave a gap when it wakes.
