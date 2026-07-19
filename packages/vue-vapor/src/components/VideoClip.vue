<script setup lang="ts">
import { provide } from "vue";
import { parentNodeKey, useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    x?: number;
    y?: number;
    width: number;
    height: number;
    radius?: number;
    opacity?: number;
    zIndex?: number;
  }>(),
  {
    x: 0,
    y: 0,
    radius: 0,
    opacity: 1,
    zIndex: 0,
  },
);

const node = useVideoNode("group", () => ({ style: { ...props, clip: true } }));
provide(parentNodeKey, node);
</script>

<template><slot /></template>
