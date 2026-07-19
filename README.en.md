# PocketVideo

English | [简体中文](./README.md)

A deterministic, renderer-agnostic video rendering framework inspired by
PocketJS, built with TypeScript, Vite+, and Bun.

> PocketVideo is in early development. Its deterministic timeline, browser
> preview, Node/Skia pixel renderer, and basic FFmpeg video encoder now run end
> to end. Media decoding and audio mixing are still planned.

## Goals

- Describe video scenes with Vue Vapor, Solid, or other declarative components.
- Render any frame deterministically without relying on a browser clock.
- Keep the rendering core, audio tracks, video tracks, and encoders independent.
- Support GSAP and Motion-style animations under a PocketVideo-owned playhead.
- Leave room for parallel rendering, frame partitioning, and native GPU backends.

## Current capabilities

- Exact rational frame rates and timestamps, including `30000/1001`.
- Compositions and half-open track ranges.
- Track-local `inPoint`, `playbackRate`, and time mapping.
- Stable visual layer ordering.
- A clockless `AnimationDriver` contract for GSAP, Motion, and native adapters.
- Renderer-agnostic, type-safe `TrackOutput` values.
- A Node Canvas2D renderer powered by `skia-canvas` (not `@napi-rs/canvas`).
- PNG frames, packed Raw RGBA frames, and direct H.264 MP4 encoding through FFmpeg.
- Native browser Canvas-to-H.264 MP4 export with WebCodecs and Mediabunny.

## Repository structure

```text
packages/
  core/       deterministic timeline and track protocol
  renderer-skia/ Node/Skia Canvas2D with PNG and RGBA output
  exporter-ffmpeg/ Raw RGBA to FFmpeg encoding pipeline
  exporter-webcodecs/ browser Canvas to WebCodecs/Mediabunny
  video/      video and image tracks (planned)
  audio/      audio tracks and mixing (planned)
apps/
  demo/       Canvas live preview and timeline inspector
  webcodecs-demo/ standalone native browser MP4 export demo
tools/
  render-skia/ export the same demo composition to PNG or MP4
```

## Example

```ts
import { defineComposition, frameRate, type Track, type TrackOutput } from "@pocketvideo/core";

interface TextLayer extends TrackOutput {
  type: "text";
  text: string;
}

const title: Track<TextLayer> = {
  id: "title",
  startFrame: 30,
  durationInFrames: 60,
  layer: 10,
  evaluate: ({ localFrame, properties }) => ({
    type: "text",
    text: `Local frame ${localFrame}, opacity ${properties.get("opacity") ?? 1}`,
  }),
};

const composition = defineComposition(
  {
    id: "main",
    width: 1920,
    height: 1080,
    frameRate: frameRate(30),
    durationInFrames: 300,
  },
  [title],
);

const frame = await composition.renderFrame(45);
```

## Interactive demo

The repository includes a browser demo powered by the existing core. It routes
Composition outputs into independent layouts: an OGL/WebGL Aurora shader and a
Canvas2D overlay for text, cards, and the timeline. Both layouts share the same
deterministic playhead, with playback, frame stepping, timeline scrubbing, and
an active-track inspector.

```bash
bun install
bun run dev
```

Open the local URL printed in the terminal. Use Space to play or pause, and the
left and right arrow keys to step through frames.

## Browser / WebCodecs export

The web path uses WebCodecs + Mediabunny exclusively and does not include
ffmpeg.wasm. Composition evaluates each frame, CanvasSource captures the current
canvas, the browser's native `VideoEncoder` encodes H.264, and Mediabunny muxes MP4:

```text
Composition frame → Canvas 2D → WebCodecs VideoEncoder
                  → Mediabunny MP4 muxer → MP4 Blob → Preview / Download
```

The standalone demo exports five seconds at 960 × 540 and 30 FPS, then exposes
the resulting MP4 for in-page preview and download. Frames never leave the device:

```bash
bun run dev:webcodecs
```

WebCodecs requires HTTPS or localhost, and H.264 encoding support depends on the
browser and device. The demo probes the exact encoder configuration before enabling
export. `BufferTarget` keeps the complete result in memory and is intended for short
clips; long-form export should use a streaming Mediabunny target later.

> License note: PocketVideo source is MIT. Mediabunny is a separate MPL-2.0 dependency.

## Node / Skia export

The Node renderer does not launch a browser. `render-skia` evaluates the same
Composition used by the web demo, draws a server-side Aurora layout with Skia,
and reuses the Canvas2D overlay. Browser preview, PNG, and MP4 therefore share
one deterministic timeline.

```bash
# Frame 120 as PNG
bun run render:image -- --frame 120

# Full 10-second / 300-frame MP4
bun run render:video

# Encode a shorter range for a quick check
bun run render:video -- --from 60 --frames 90 --output artifacts/clip.mp4
```

The video pipeline is:

```text
Composition frame → Skia Canvas2D → packed RGBA Buffer
                  → FFmpeg stdin (rawvideo/rgba) → H.264/yuv420p MP4
```

FFmpeg resolution checks an explicit `--ffmpeg` path,
`POCKETVIDEO_FFMPEG_PATH`, custom `FfmpegBinaryProvider` instances, and the
system `PATH`, in that order. The repository does not bundle a large
platform-specific binary, but the provider contract lets a host supply one.
Skia video export uses its CPU backend by default to avoid a GPU-to-CPU readback
for every RGBA frame.

Animation adapters implement:

```ts
interface AnimationDriver {
  evaluate(time: Time, sink: AnimationPropertySink): void;
  dispose?(): void;
}
```

An adapter must not own a real-time clock. A GSAP adapter, for example, should
create a paused timeline, seek it from `time`, and write the evaluated values to
the provided `sink`.

## Development

PocketVideo currently uses Bun 1.3.14 and Vite+ 0.2.5.

```bash
bun install
bun run ready
```

`ready` runs formatting, linting, type checking, unit tests, and the package
build.

## Roadmap

- [x] Exact time and frame-rate model
- [x] Composition and generic track protocol
- [x] Animation driver contract
- [ ] Video and image tracks
- [ ] Audio tracks and mixing
- [x] Node/Skia Canvas2D rendering backend
- [ ] Vue Vapor and Solid component adapters
- [ ] GSAP and Motion adapters
- [x] Basic Raw RGBA/FFmpeg exporter
- [x] Basic browser WebCodecs/Mediabunny exporter
- [x] Basic Canvas live preview
- [ ] Full development tools

## License

[MIT](./LICENSE) © PocketVideo contributors
