# PocketVideo architecture

PocketVideo treats Canvas as a platform surface, not as a synonym for the Canvas 2D API.
Authoring code receives an ordinary Canvas-shaped object and decides whether to use Canvas2D,
OGL, WebGL, WebGPU, or another context supported by the host.

## Public rendering model

Vue compositions declare a single root `Canvas` component and access it with Vue's normal
template-ref API:

```vue
<script setup lang="ts">
import type { CanvasRef } from "@pocketvideo/vue";
import { Canvas, useFPS, useFrame } from "@pocketvideo/vue";
import { useTemplateRef, watchEffect } from "vue";

const canvas = useTemplateRef<CanvasRef>("canvas");
const frame = useFrame();
const fps = useFPS();

watchEffect(() => {
  if (!canvas.value) return;
  const context = canvas.value.getContext("2d");
  // Drawing code may instead initialize OGL or request another context.
  void context;
  void (frame.value / fps);
});
</script>

<template>
  <Canvas ref="canvas" :width="1920" :height="1080" />
</template>
```

`useFPS`, `useFrame`, `useTime`, and `useVideoConfig` read the current composition scope. They
must never read process-global mutable state, because previews and exports may evaluate different
compositions concurrently.

## Platform boundary

The root `@pocketvideo/canvas` entry contains structural contracts only. It has no DOM, Canvas2D,
WebGL, WebGPU, Vue, or Node dependency. Platform implementations live behind explicit subpaths;
for example, Node can create an ordinary Canvas through `@pocketvideo/canvas/skia`. Its optional
native dependency is never imported by the root or browser entry.

```text
Composition / Vue
        ↓
ordinary Canvas-like object
        ↓
host-selected drawing API
        ↓
preview, WebCodecs, or platform RGBA reader → FFmpeg
```

Frame exporters own the platform-specific readback adapter. WebCodecs may consume a web Canvas
without CPU readback; a raw FFmpeg pipe uses a `CanvasFrameReader` to obtain RGBA bytes. This
adapter is deliberately not visible to composition authors.

## Primitive and direct-canvas paths

`View`, `Text`, and `Image` are painted by the built-in Canvas2D backend. There is no parallel
`Video*` component hierarchy. More complex visuals are ordinary Vue components composed from
those primitives.

An empty `Canvas` may instead be owned directly by authoring code. In that case `CanvasSurface`
does not request a `2d` context, so OGL, WebGL, WebGPU, or another host-supported context remains
available without a second intermediate canvas.
