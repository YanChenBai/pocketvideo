<script setup lang="ts">
import { useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    x: number;
    y: number;
    width: number;
    height: number;
    progress: number;
    fill?: string;
    fillTo?: string;
    trackColor?: string;
    radius?: number;
    opacity?: number;
    zIndex?: number;
  }>(),
  {
    fill: "#8b5cf6",
    fillTo: "#22d3ee",
    trackColor: "rgba(255,255,255,0.14)",
    opacity: 1,
    zIndex: 0,
  },
);

useVideoNode("progress", () => ({ style: { ...props } }));
</script>

<template></template>
