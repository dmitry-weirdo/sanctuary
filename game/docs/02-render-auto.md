# Automatic GPU renderer

Selects a working GPU backend for the device at startup. WebGPU is preferred,
WebGL2 is the fallback, and a friendly message explains when neither is usable.

Selection respects every composed pack's `backends` declaration. `skymax` and `watermax` require WebGPU: the bakery rejects explicit/forced WebGL2, and automatic startup reports unavailability if WebGPU cannot start. It never silently substitutes a simpler sky or water. Inspect the generated `renderer-capabilities.md` and `game.renderer.failures` for restrictions and failure reasons.

## When to use it

Always, unless a test needs one backend alone. It is the renderer `core-2d`, `core-3d` and `core-vector` compose, and the
one to name in a manifest that does not use a core bundle. One game bundle carries both backends and every selected feature
pack; startup picks the one the device runs. Name `render-webgpu` or `render-webgl2` instead only to test that backend alone.

<!-- shared: which-renderer -->
### Which renderer?

| For | Compose | What it is |
|---|---|---|
| Every game | `render-auto` (the core bundles bring it) | tests the device at startup and runs WebGPU where it works and WebGL2 where it does not, from one bundle; a device with neither gets an explanation |
| A test of the WebGPU path alone, or a game that must refuse to start without WebGPU | `render-webgpu` | the WebGPU backend by itself. A game with `skymax` or `watermax` needs no pin: `render-auto` already starts only on WebGPU and says why |
| A test of the WebGL2 path alone, or a WebGL2-only build | `render-webgl2` | the WebGL2 backend by itself: no screen recording, one shadow map, at most eight local lights, no `skymax` or `watermax`. `game.renderer.prefer('webgl2')` under `render-auto` tests the same path |
| A headless simulation: a test, a replay | no renderer | the kernel runs the same sorted tables and nothing draws them |
<!-- /shared: which-renderer -->

## Requires

No other backend. Compose exactly one renderer. A headless game skips device
probing and keeps simulation available.

## API

`game.renderer` exposes `status`, `backend`, `ready`, `error` and `failures`.
Call `game.renderer.prefer('webgl2')` before `game.start()` to force WebGL2 for a
test; use `'webgpu'` to test WebGPU alone, or `'auto'` for the default order.
The existing `game.gpu` and `game.gl` diagnostic APIs report the selected backend.

Await `game.start()`: device testing and setup finish before `boot.deviceReady`
and before the ticker starts. If startup fails, it rejects and displays an
accessible, readable explanation with browser/device troubleshooting steps.

## Pixel art

For pixel art, set `"pixelArt": true` in the manifest's `screen`: sprites scaled up keep crisp texels instead of
blurring, on WebGPU and WebGL2 alike, and still move smoothly between pixels. Leave it off for painted art.

```json
"screen": { "width": 720, "height": 1280, "fit": "letterbox", "pixelArt": true }
```

## Options

`backend`: `'auto'` (default), `'webgpu'`, or `'webgl2'`. Explicit selection tests
only that API; automatic selection tries WebGPU, then WebGL2. Each device test
has a timeout. Failure reasons remain available for diagnostics.

## Limits

Selection tests adapter/device creation, context configuration, texture limits
and real GPU submission or framebuffer readback. Big pictures in textures of their
own are checked against the selected device's limit when they upload. It is not a performance ranking
or certification of every game shader. Feature packs retain their own GPU checks.
WebGL2 quality/capacity limits still apply. Backend selection occurs at startup;
a running WebGPU renderer retains its existing device-loss recovery behavior.
