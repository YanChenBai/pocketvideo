<script setup lang="ts">
import type { RenderedFrame } from "@pocketvideo/core";
import {
  VideoAurora,
  VideoCircle,
  VideoGrid,
  VideoLayer,
  VideoParagraph,
  VideoProgress,
  VideoStage,
  VideoText,
  useVideoFrame,
} from "@pocketvideo/vue-vapor";
import { computed } from "vue";
import { VIDEO_HEIGHT, VIDEO_WIDTH, type CardLayer, type DemoLayer } from "./composition.ts";
import MetricCard from "./components/MetricCard.vue";

const frame = useVideoFrame<RenderedFrame<DemoLayer>>();
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
  <VideoStage :width="VIDEO_WIDTH" :height="VIDEO_HEIGHT" fill="#08070f" fill-to="#11172b">
    <VideoLayer :width="VIDEO_WIDTH" :height="VIDEO_HEIGHT" :z-index="0">
      <VideoAurora
        :width="VIDEO_WIDTH"
        :height="VIDEO_HEIGHT"
        :phase="aurora?.time ?? 0"
        fill="rgba(139,92,246,0.62)"
        fill-to="rgba(34,211,238,0.22)"
        :opacity="0.92"
      />
      <VideoGrid
        :width="VIDEO_WIDTH"
        :height="VIDEO_HEIGHT"
        :columns="20"
        :rows="12"
        line-color="rgba(167,139,250,0.08)"
        :opacity="0.72"
      />
      <VideoCircle
        :x="(orb?.x ?? 980) - (orb?.radius ?? 160)"
        :y="(orb?.y ?? 156) - (orb?.radius ?? 160)"
        :size="(orb?.radius ?? 160) * 2"
        fill="rgba(139,92,246,0.32)"
        fill-to="rgba(34,211,238,0.04)"
        :opacity="orb?.opacity ?? 0.4"
        shadow-color="rgba(139,92,246,0.7)"
        :shadow-blur="42"
        :z-index="2"
      />
    </VideoLayer>

    <VideoText
      :x="72"
      :y="86"
      :text="intro?.eyebrow ?? ''"
      :opacity="intro?.opacity ?? 0"
      :translate-y="intro?.translateY ?? 0"
      color="#b79cff"
      :font-size="15"
      :font-weight="600"
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      :z-index="10"
    />
    <VideoText
      :x="68"
      :y="128"
      :text="intro?.title ?? ''"
      :opacity="intro?.opacity ?? 0"
      :translate-y="intro?.translateY ?? 0"
      color="#f8fafc"
      :font-size="62"
      :font-weight="700"
      :z-index="10"
    />
    <VideoParagraph
      :x="72"
      :y="211"
      :width="760"
      :text="intro?.description ?? ''"
      :opacity="intro?.opacity ?? 0"
      :translate-y="intro?.translateY ?? 0"
      color="#aaa4bb"
      :font-size="21"
      :max-lines="2"
      :z-index="10"
    />

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

    <VideoProgress
      :x="72"
      :y="630"
      :width="VIDEO_WIDTH - 144"
      :height="4"
      :progress="timeline?.progress ?? 0"
      fill="#8b5cf6"
      fill-to="#22d3ee"
      :z-index="100"
    />
    <VideoCircle
      :x="72 + (VIDEO_WIDTH - 144) * (timeline?.progress ?? 0) - 7"
      :y="625"
      :size="14"
      fill="#f8fafc"
      shadow-color="rgba(139,92,246,0.8)"
      :shadow-blur="14"
      :z-index="101"
    />
    <VideoText
      :x="72"
      :y="654"
      :text="`FRAME ${String(timeline?.frame ?? 0).padStart(3, '0')}`"
      color="#817a91"
      :font-size="13"
      :font-weight="500"
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      :z-index="100"
    />
    <VideoText
      :x="VIDEO_WIDTH - 292"
      :y="654"
      :width="220"
      text="10.0 SEC / 30 FPS"
      text-align="right"
      color="#817a91"
      :font-size="13"
      :font-weight="500"
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      :z-index="100"
    />
  </VideoStage>
</template>
