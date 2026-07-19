<script setup lang="ts">
import { useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    text: string;
    x: number;
    y: number;
    width: number;
    height?: number;
    color?: string;
    opacity?: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | string;
    textAlign?: CanvasTextAlign;
    lineHeight?: number;
    maxLines?: number;
    ellipsis?: string;
    translateX?: number;
    translateY?: number;
    position?: "relative" | "absolute";
    zIndex?: number;
  }>(),
  {
    color: "#ffffff",
    opacity: 1,
    fontSize: 16,
    fontWeight: 400,
    textAlign: "left",
    maxLines: 4,
    ellipsis: "…",
    translateX: 0,
    translateY: 0,
    position: "relative",
    zIndex: 0,
  },
);

useVideoNode("text", () => ({
  text: props.text,
  style: { ...props, wrap: true },
}));
</script>

<template></template>
