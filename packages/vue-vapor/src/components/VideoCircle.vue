<script setup lang="ts">
import { useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    x: number;
    y: number;
    size: number;
    fill?: string;
    fillTo?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
    shadowColor?: string;
    shadowBlur?: number;
    zIndex?: number;
  }>(),
  {
    fill: "#ffffff",
    opacity: 1,
    borderWidth: 0,
    shadowBlur: 0,
    zIndex: 0,
  },
);

useVideoNode("circle", () => ({
  style: {
    ...props,
    width: props.size,
    height: props.size,
  },
}));
</script>

<template></template>
