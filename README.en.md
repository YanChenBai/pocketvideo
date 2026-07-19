# PocketVideo

English | [简体中文](./README.md)

A deterministic, renderer-agnostic video rendering framework inspired by
PocketJS, built with TypeScript, Vite+, and Bun.

> PocketVideo is in early development. Only the timeline core is implemented;
> pixel rendering, media decoding, and video encoding are not available yet.

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

## Repository structure

```text
packages/
  core/       deterministic timeline and track protocol
  video/      video and image tracks (planned)
  audio/      audio tracks and mixing (planned)
  exporter/   rendering and encoding orchestration (planned)
apps/
  demo/       Canvas live preview and timeline inspector
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
- [ ] PocketJS/Rust rendering backend
- [ ] Vue Vapor and Solid component adapters
- [ ] GSAP and Motion adapters
- [ ] FFmpeg exporter
- [x] Basic Canvas live preview
- [ ] Full development tools

## License

[MIT](./LICENSE) © PocketVideo contributors
