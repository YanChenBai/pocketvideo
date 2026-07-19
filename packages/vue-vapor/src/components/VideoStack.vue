<script setup lang="ts">
import { provide } from "vue";
import { parentNodeKey, useVideoNode } from "../context.ts";
import type { VideoAlign } from "../types.ts";

const props = withDefaults(
  defineProps<{
    x?: number;
    y?: number;
    width: number;
    height: number;
    direction?: "row" | "column";
    gap?: number;
    padding?: number;
    align?: VideoAlign;
    justify?: VideoAlign | "space-between";
    opacity?: number;
    zIndex?: number;
  }>(),
  {
    x: 0,
    y: 0,
    direction: "column",
    gap: 0,
    padding: 0,
    align: "start",
    justify: "start",
    opacity: 1,
    zIndex: 0,
  },
);

const node = useVideoNode("group", () => ({
  style: {
    ...props,
    layout: props.direction,
  },
}));
provide(parentNodeKey, node);
</script>

<template><slot /></template>
