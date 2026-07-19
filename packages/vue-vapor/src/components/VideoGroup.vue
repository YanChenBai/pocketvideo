<script setup lang="ts">
import { provide } from "vue";
import { parentNodeKey, useVideoNode } from "../context.ts";
import type { VideoAlign, VideoLayout } from "../types.ts";

const props = withDefaults(
  defineProps<{
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    opacity?: number;
    translateX?: number;
    translateY?: number;
    scale?: number;
    rotate?: number;
    position?: "relative" | "absolute";
    layout?: VideoLayout;
    gap?: number;
    padding?: number;
    align?: VideoAlign;
    justify?: VideoAlign | "space-between";
    clip?: boolean;
    radius?: number;
    filter?: string;
    blendMode?: GlobalCompositeOperation;
    zIndex?: number;
  }>(),
  {
    x: 0,
    y: 0,
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotate: 0,
    position: "relative",
    layout: "none",
    gap: 0,
    padding: 0,
    align: "start",
    justify: "start",
    clip: false,
    radius: 0,
    filter: "none",
    blendMode: "source-over",
    zIndex: 0,
  },
);

const node = useVideoNode("group", () => ({ style: { ...props } }));
provide(parentNodeKey, node);
</script>

<template><slot /></template>
