<script setup lang="ts">
import type { RenderedFrame } from "@pocketvideo/core";
import type { CanvasRef } from "@pocketvideo/vue";
import { Canvas, Text, View, useFPS, useVideoFrame } from "@pocketvideo/vue";
import { computed, useTemplateRef } from "vue";
import { VIDEO_HEIGHT, VIDEO_WIDTH, type CardLayer, type DemoLayer } from "./composition.ts";
import MetricCard from "./components/MetricCard.vue";

const frame = useVideoFrame<RenderedFrame<DemoLayer>>();
const fps = useFPS();
const canvas = useTemplateRef<CanvasRef>("canvas");
defineExpose({ canvas });
const rendered = computed(() => frame.value.data);
const layer = <T extends DemoLayer["type"]>(type: T) =>
  computed(
    () =>
      rendered.value.tracks.find((track) => track.output.type === type)?.output as
        | Extract<DemoLayer, { type: T }>
        | undefined,
  );

const aurora = layer("aurora");
const orb = layer("orb");
const intro = layer("intro");
const timeline = layer("timeline");
const cards = computed(() => {
  const active = rendered.value.tracks
    .map((track) => track.output)
    .filter((output): output is CardLayer => output.type === "card");
  return [0, 1, 2].map(
    (index) =>
      active.find((card) => card.index === index) ?? {
        type: "card" as const,
        index,
        label: "",
        value: "",
        detail: "",
        accent: "#8b5cf6",
        opacity: 0,
        translateY: 32,
      },
  );
});
</script>

<template>
  <Canvas ref="canvas" :width="VIDEO_WIDTH" :height="VIDEO_HEIGHT">
    <View
      :style="{
        position: 'absolute',
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        backgroundColor: '#08070f',
        overflow: 'hidden',
      }"
    >
      <View
        :style="{
          position: 'absolute',
          left: 650 + Math.sin(aurora?.time ?? 0) * 70,
          top: -240,
          width: 720,
          height: 720,
          borderRadius: 360,
          backgroundColor: 'rgba(139,92,246,0.20)',
          opacity: 0.92,
        }"
      />
      <View
        :style="{
          position: 'absolute',
          left: (orb?.x ?? 980) - (orb?.radius ?? 160),
          top: (orb?.y ?? 156) - (orb?.radius ?? 160),
          width: (orb?.radius ?? 160) * 2,
          height: (orb?.radius ?? 160) * 2,
          borderRadius: orb?.radius ?? 160,
          backgroundColor: 'rgba(34,211,238,0.12)',
          opacity: orb?.opacity ?? 0.4,
          zIndex: 2,
        }"
      />

      <Text
        :style="{
          position: 'absolute',
          left: 72,
          top: 86,
          color: '#b79cff',
          fontSize: 15,
          fontWeight: 600,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          opacity: intro?.opacity ?? 0,
          translateY: intro?.translateY ?? 0,
          zIndex: 10,
        }"
        >{{ intro?.eyebrow ?? "" }}</Text
      >
      <Text
        :style="{
          position: 'absolute',
          left: 68,
          top: 128,
          color: '#f8fafc',
          fontSize: 62,
          fontWeight: 700,
          opacity: intro?.opacity ?? 0,
          translateY: intro?.translateY ?? 0,
          zIndex: 10,
        }"
        >{{ intro?.title ?? "" }}</Text
      >
      <Text
        :style="{
          position: 'absolute',
          left: 72,
          top: 211,
          width: 760,
          color: '#aaa4bb',
          fontSize: 21,
          opacity: intro?.opacity ?? 0,
          translateY: intro?.translateY ?? 0,
          zIndex: 10,
        }"
        >{{ intro?.description ?? "" }}</Text
      >

      <MetricCard
        v-for="card in cards"
        :key="card.index"
        :x="72 + card.index * 382"
        :y="306 + card.translateY"
        :label="card.label"
        :value="card.value"
        :detail="card.detail"
        :accent="card.accent"
        :opacity="card.opacity"
      />

      <View
        :style="{
          position: 'absolute',
          left: 72,
          top: 630,
          width: VIDEO_WIDTH - 144,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.12)',
          zIndex: 100,
        }"
      >
        <View
          :style="{
            position: 'absolute',
            width: (VIDEO_WIDTH - 144) * (timeline?.progress ?? 0),
            height: 4,
            borderRadius: 2,
            backgroundColor: '#8b5cf6',
          }"
        />
      </View>
      <View
        :style="{
          position: 'absolute',
          left: 65 + (VIDEO_WIDTH - 144) * (timeline?.progress ?? 0),
          top: 625,
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: '#f8fafc',
          zIndex: 101,
        }"
      />
      <Text
        :style="{
          position: 'absolute',
          left: 72,
          top: 654,
          color: '#817a91',
          fontSize: 13,
          fontWeight: 500,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 100,
        }"
        >FRAME {{ String(timeline?.frame ?? 0).padStart(3, "0") }}</Text
      >
      <Text
        :style="{
          position: 'absolute',
          left: (canvas?.width ?? VIDEO_WIDTH) - 292,
          top: 654,
          width: 220,
          textAlign: 'right',
          color: '#817a91',
          fontSize: 13,
          fontWeight: 500,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 100,
        }"
        >10.0 SEC / {{ fps }} FPS</Text
      >
    </View>
  </Canvas>
</template>
