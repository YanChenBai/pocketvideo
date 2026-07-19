<script setup lang="ts">
import { useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    fillTo?: string;
    opacity?: number;
    stroke?: string;
    strokeWidth?: number;
    shadowColor?: string;
    shadowBlur?: number;
    zIndex?: number;
  }>(),
  {
    fill: "#ffffff",
    opacity: 1,
    strokeWidth: 0,
    shadowBlur: 0,
    zIndex: 0,
  },
);

useVideoNode("ellipse", () => ({ style: { ...props } }));
</script>

<template></template>
