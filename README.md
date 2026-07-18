# PocketVideo

A Vite+ monorepo for a PocketJS-inspired video rendering framework. The first
package, `@pocketvideo/core`, owns composition time and evaluates every frame
without a browser clock. Renderers, video/audio tracks and encoders can be added
as separate packages on top of its track protocol.

```text
packages/
  core/       deterministic timeline and track protocol
  video/      future video/image tracks
  audio/      future audio tracks and mixing
  exporter/   future rendering and encoding coordinator
```

## Current scope

- Exact rational frame rates and timestamps, including `30000/1001`.
- Composition and half-open track ranges.
- Track-local `inPoint` and `playbackRate` mapping.
- Stable layer ordering.
- A clockless animation-driver boundary for GSAP/Motion-compatible adapters.
- Renderer-agnostic typed outputs.

It does not render pixels or decode media yet.

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

An animation adapter implements `AnimationDriver.evaluate(localTime, sink)` and
must remain paused. For example, a future GSAP adapter will seek a paused GSAP
timeline to `localTime.toNumber()` and copy the resulting values into `sink`.

## Development

Requires Bun 1.3.14 and Vite+ 0.2.5.

```bash
bun install
bun run ready
```
