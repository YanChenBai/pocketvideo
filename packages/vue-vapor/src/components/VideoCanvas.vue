<script setup lang="ts">
import { useVideoNode } from "../context.ts";
import type { VideoDrawCallback } from "../types.ts";

const props = withDefaults(
  defineProps<{
    draw: VideoDrawCallback;
    x?: number;
    y?: number;
    width: number;
    height: number;
    opacity?: number;
    filter?: string;
    blendMode?: GlobalCompositeOperation;
    zIndex?: number;
  }>(),
  {
    x: 0,
    y: 0,
    opacity: 1,
    filter: "none",
    blendMode: "source-over",
    zIndex: 0,
  },
);

useVideoNode("custom", () => ({ style: { ...props } }));
</script>

<template></template>
