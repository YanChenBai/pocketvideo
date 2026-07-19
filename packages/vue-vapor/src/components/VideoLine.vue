<script setup lang="ts">
import { useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    lineCap?: CanvasLineCap;
    shadowColor?: string;
    shadowBlur?: number;
    zIndex?: number;
  }>(),
  {
    stroke: "#ffffff",
    strokeWidth: 1,
    opacity: 1,
    lineCap: "butt",
    shadowBlur: 0,
    zIndex: 0,
  },
);

useVideoNode("line", () => ({
  style: {
    x: props.x1,
    y: props.y1,
    width: props.x2 - props.x1,
    height: props.y2 - props.y1,
    stroke: props.stroke,
    strokeWidth: props.strokeWidth,
    opacity: props.opacity,
    lineCap: props.lineCap,
    shadowColor: props.shadowColor,
    shadowBlur: props.shadowBlur,
    zIndex: props.zIndex,
  },
}));
</script>

<template></template>
