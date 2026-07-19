<script setup lang="ts">
import { provide } from "vue";
import { parentNodeKey, useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    filter: string;
    opacity?: number;
    blendMode?: GlobalCompositeOperation;
    zIndex?: number;
  }>(),
  {
    x: 0,
    y: 0,
    opacity: 1,
    blendMode: "source-over",
    zIndex: 0,
  },
);

const node = useVideoNode("group", () => ({ style: { ...props } }));
provide(parentNodeKey, node);
</script>

<template><slot /></template>
