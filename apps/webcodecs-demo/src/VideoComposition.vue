<script setup lang="ts">
import type { RenderedFrame } from "@pocketvideo/core";
import { Canvas, Text, View, useVideoFrame } from "@pocketvideo/vue";
import { computed } from "vue";
import { EXPORT_FRAMES, EXPORT_HEIGHT, EXPORT_WIDTH, type ExportScene } from "./composition.ts";
import PipelineStep from "./components/PipelineStep.vue";

const frame = useVideoFrame<RenderedFrame<ExportScene>>();
const scene = computed(() => frame.value.data.tracks[0]?.output);
const reveal = computed(() => 1 - (1 - Math.min(1, (scene.value?.progress ?? 0) * 7)) ** 3);
const pipeline = [
  ["01", "Composition", "evaluate"],
  ["02", "Vue SFC", "render"],
  ["03", "H.264", "encode"],
  ["04", "MP4", "mux"],
] as const;
</script>

<template>
  <Canvas ref="canvas" :width="EXPORT_WIDTH" :height="EXPORT_HEIGHT">
    <View
      :style="{
        position: 'absolute',
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
        backgroundColor: '#070b16',
        overflow: 'hidden',
      }"
    >
      <View
        :style="{
          position: 'absolute',
          left: 520 + Math.sin(scene?.orbit ?? 0) * 35,
          top: -250,
          width: 610,
          height: 610,
          borderRadius: 305,
          backgroundColor: 'rgba(91,111,255,0.18)',
          opacity: 0.9,
        }"
      />
      <View
        :style="{
          position: 'absolute',
          left: 36,
          top: 34,
          width: EXPORT_WIDTH - 72,
          height: EXPORT_HEIGHT - 68,
          borderRadius: 26,
          backgroundColor: 'rgba(8,12,26,0.82)',
          borderColor: 'rgba(167,180,255,0.17)',
          borderWidth: 1,
          zIndex: 5,
        }"
      />
      <Text
        :style="{
          position: 'absolute',
          left: 70,
          top: 68,
          color: '#f4f6ff',
          fontSize: 16,
          fontWeight: 650,
          zIndex: 10,
        }"
        >PocketVideo</Text
      >
      <Text
        :style="{
          position: 'absolute',
          left: 194,
          top: 70,
          color: '#78829d',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 10,
        }"
        >VUE SFC / NATIVE EXPORT</Text
      >
      <View
        :style="{
          position: 'absolute',
          left: 808,
          top: 72,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#35e1bc',
          zIndex: 10,
        }"
      />
      <Text
        :style="{
          position: 'absolute',
          left: 826,
          top: 70,
          color: '#a6afc8',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 10,
        }"
        >FRAME {{ String(scene?.frame ?? 0).padStart(3, "0") }}</Text
      >

      <View
        :style="{
          position: 'absolute',
          left: 70,
          top: 132,
          width: 150,
          height: 30,
          borderRadius: 15,
          backgroundColor: 'rgba(98,255,221,0.11)',
          zIndex: 10,
        }"
      />
      <Text
        :style="{
          position: 'absolute',
          left: 89,
          top: 143,
          color: '#76efd4',
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 11,
        }"
        >VUE SFC / HOST</Text
      >
      <Text
        :style="{
          position: 'absolute',
          left: 70,
          top: 190,
          color: '#f5f7ff',
          fontSize: 52,
          fontWeight: 700,
          opacity: reveal,
          translateY: (1 - reveal) * 18,
          zIndex: 12,
        }"
        >Components become</Text
      >
      <Text
        :style="{
          position: 'absolute',
          left: 70,
          top: 246,
          color: '#95a5ff',
          fontSize: 52,
          fontWeight: 700,
          opacity: reveal,
          translateY: (1 - reveal) * 18,
          zIndex: 12,
        }"
        >video, natively.</Text
      >
      <Text
        :style="{
          position: 'absolute',
          left: 72,
          top: 317,
          color: '#8c96b0',
          fontSize: 15,
          zIndex: 12,
        }"
        >Vue SFC → View tree → Canvas → VideoEncoder → MP4</Text
      >

      <View
        :style="{
          position: 'absolute',
          left: 632,
          top: 130,
          width: 254,
          height: 270,
          borderRadius: 20,
          backgroundColor: 'rgba(12,18,39,0.86)',
          borderColor: 'rgba(141,158,219,0.18)',
          borderWidth: 1,
          zIndex: 20,
        }"
      />
      <Text
        :style="{
          position: 'absolute',
          left: 654,
          top: 153,
          color: '#818dab',
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 30,
        }"
        >RENDER PIPELINE</Text
      >
      <View
        :style="{ position: 'absolute', left: 663, top: 187, width: 210, height: 180, zIndex: 30 }"
      >
        <PipelineStep
          v-for="(step, index) in pipeline"
          :key="step[0]"
          :index="index"
          :number="step[0]"
          :label="step[1]"
          :action="step[2]"
          :active="(scene?.progress ?? 0) * pipeline.length >= index"
        />
      </View>
      <Text
        :style="{
          position: 'absolute',
          left: 654,
          top: 367,
          color: '#66708c',
          fontSize: 9,
          fontWeight: 500,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 32,
        }"
        >THROUGHPUT</Text
      >
      <Text
        :style="{
          position: 'absolute',
          left: 805,
          top: 365,
          color: '#dfe5f6',
          fontSize: 12,
          fontWeight: 650,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 32,
        }"
        >{{ Math.round(24 + (scene?.pulse ?? 0) * 7) }} FPS</Text
      >

      <View
        :style="{
          position: 'absolute',
          left: 70,
          top: 448,
          width: 816,
          height: 4,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.10)',
          zIndex: 40,
        }"
      >
        <View
          :style="{
            position: 'absolute',
            width: 816 * (scene?.progress ?? 0),
            height: 4,
            borderRadius: 2,
            backgroundColor: '#37e3bd',
          }"
        />
      </View>
      <View
        :style="{
          position: 'absolute',
          left: 65 + 816 * (scene?.progress ?? 0),
          top: 445,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#eef2ff',
          zIndex: 41,
        }"
      />
      <Text
        :style="{
          position: 'absolute',
          left: 70,
          top: 472,
          color: '#68738f',
          fontSize: 9,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 42,
        }"
        >00:00</Text
      >
      <Text
        :style="{
          position: 'absolute',
          left: 686,
          top: 472,
          width: 200,
          textAlign: 'right',
          color: '#68738f',
          fontSize: 9,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          zIndex: 42,
        }"
        >00:05 · {{ String(scene?.frame ?? 0).padStart(3, "0") }}/{{ EXPORT_FRAMES - 1 }}</Text
      >
    </View>
  </Canvas>
</template>
