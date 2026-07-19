<script setup lang="ts">
import { useVideoNode } from "../context.ts";

const props = withDefaults(
  defineProps<{
    text: string | number;
    x: number;
    y: number;
    width?: number;
    color?: string;
    opacity?: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | string;
    textAlign?: CanvasTextAlign;
    lineHeight?: number;
    translateX?: number;
    translateY?: number;
    position?: "relative" | "absolute";
    zIndex?: number;
  }>(),
  {
    width: 0,
    color: "#ffffff",
    opacity: 1,
    fontSize: 16,
    fontWeight: 400,
    textAlign: "left",
    translateX: 0,
    translateY: 0,
    position: "relative",
    zIndex: 0,
  },
);

useVideoNode("text", () => ({
  text: String(props.text),
  style: { ...props },
}));
</script>

<template></template>
