<script setup lang="ts">
import { provide } from "vue";
import { parentNodeKey, useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    width: number;
    height: number;
    fill?: string;
    fillTo?: string;
    zIndex?: number;
  }>(),
  {
    fill: "#08070f",
    fillTo: "#11172b",
    zIndex: -100,
  },
);

const node = useVideoNode("stage", () => ({
  style: {
    width: props.width,
    height: props.height,
    fill: props.fill,
    fillTo: props.fillTo,
    zIndex: props.zIndex,
  },
}));
provide(parentNodeKey, node);
</script>

<template><slot /></template>
