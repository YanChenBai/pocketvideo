<script setup lang="ts">
import { useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    x?: number;
    y?: number;
    width: number;
    height: number;
    columns?: number;
    rows?: number;
    lineColor?: string;
    lineWidth?: number;
    opacity?: number;
    translateX?: number;
    zIndex?: number;
  }>(),
  {
    x: 0,
    y: 0,
    columns: 12,
    rows: 8,
    lineColor: "rgba(255,255,255,0.06)",
    lineWidth: 1,
    opacity: 1,
    translateX: 0,
    zIndex: -50,
  },
);

useVideoNode("grid", () => ({ style: { ...props } }));
</script>

<template></template>
