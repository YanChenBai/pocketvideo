<script setup lang="ts">
import { useVideoNode } from "../context.ts";
import type { VideoFit } from "../types.ts";

const props = withDefaults(
  defineProps<{
    source: string | CanvasImageSource;
    x: number;
    y: number;
    width: number;
    height: number;
    fit?: VideoFit;
    opacity?: number;
    smoothing?: boolean;
    radius?: number;
    filter?: string;
    blendMode?: GlobalCompositeOperation;
    translateX?: number;
    translateY?: number;
    scale?: number;
    rotate?: number;
    position?: "relative" | "absolute";
    zIndex?: number;
  }>(),
  {
    fit: "cover",
    opacity: 1,
    smoothing: true,
    radius: 0,
    filter: "none",
    blendMode: "source-over",
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotate: 0,
    position: "relative",
    zIndex: 0,
  },
);

useVideoNode("image", () => ({ style: { ...props, clip: props.radius > 0 } }));
</script>

<template></template>
