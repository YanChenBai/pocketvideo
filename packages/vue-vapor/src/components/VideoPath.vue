<script setup lang="ts">
import { useVideoNode } from "../context.ts";
import type { VideoPoint } from "../types.ts";

const props = withDefaults(
  defineProps<{
    x?: number;
    y?: number;
    path?: string;
    points?: readonly VideoPoint[];
    closePath?: boolean;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    lineCap?: CanvasLineCap;
    lineJoin?: CanvasLineJoin;
    zIndex?: number;
  }>(),
  {
    x: 0,
    y: 0,
    closePath: false,
    fill: "transparent",
    stroke: "#ffffff",
    strokeWidth: 1,
    opacity: 1,
    lineCap: "butt",
    lineJoin: "miter",
    zIndex: 0,
  },
);

useVideoNode("path", () => ({ style: { ...props } }));
</script>

<template></template>
