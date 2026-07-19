<script setup lang="ts">
import { provide } from "vue";
import { parentNodeKey, useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    fillTo?: string;
    radius?: number;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
    translateX?: number;
    translateY?: number;
    scale?: number;
    rotate?: number;
    position?: "relative" | "absolute";
    clip?: boolean;
    filter?: string;
    blendMode?: GlobalCompositeOperation;
    shadowColor?: string;
    shadowBlur?: number;
    zIndex?: number;
  }>(),
  {
    fill: "transparent",
    radius: 0,
    opacity: 1,
    borderWidth: 0,
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotate: 0,
    position: "relative",
    clip: false,
    filter: "none",
    blendMode: "source-over",
    shadowBlur: 0,
    zIndex: 0,
  },
);

const node = useVideoNode("rect", () => ({ style: { ...props } }));
provide(parentNodeKey, node);
</script>

<template><slot /></template>
