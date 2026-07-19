<script setup lang="ts">
import { useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    x?: number;
    y?: number;
    width: number;
    height: number;
    phase: number;
    fill?: string;
    fillTo?: string;
    opacity?: number;
    zIndex?: number;
  }>(),
  {
    x: 0,
    y: 0,
    fill: "rgba(139,92,246,0.55)",
    fillTo: "rgba(34,211,238,0.18)",
    opacity: 1,
    zIndex: -80,
  },
);

useVideoNode("aurora", () => ({ style: { ...props } }));
</script>

<template></template>
