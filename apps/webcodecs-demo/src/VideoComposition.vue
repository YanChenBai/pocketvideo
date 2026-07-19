<script setup lang="ts">
import type { RenderedFrame } from "@pocketvideo/core";
import {
  VideoAurora,
  VideoCircle,
  VideoGrid,
  VideoProgress,
  VideoRect,
  VideoSequence,
  VideoStage,
  VideoStack,
  VideoText,
  useVideoFrame,
} from "@pocketvideo/vue-vapor";
import { computed } from "vue";
import { EXPORT_FRAMES, EXPORT_HEIGHT, EXPORT_WIDTH, type ExportScene } from "./composition.ts";
import PipelineStep from "./components/PipelineStep.vue";

const frame = useVideoFrame<RenderedFrame<ExportScene>>();
const scene = computed(() => frame.value.data.tracks[0]?.output);
const reveal = computed(() => 1 - (1 - Math.min(1, (scene.value?.progress ?? 0) * 7)) ** 3);
const pipeline = [
  ["01", "Composition", "evaluate"],
  ["02", "Vue Vapor SFC", "render"],
  ["03", "H.264", "encode"],
  ["04", "MP4", "mux"],
] as const;
</script>

<template>
  <VideoStage :width="EXPORT_WIDTH" :height="EXPORT_HEIGHT" fill="#070b16" fill-to="#10152a">
    <VideoSequence :from="0" :duration="EXPORT_FRAMES">
      <VideoAurora
        :width="EXPORT_WIDTH"
        :height="EXPORT_HEIGHT"
        :phase="scene?.orbit ?? 0"
        fill="rgba(91,111,255,0.48)"
        fill-to="rgba(53,225,188,0.18)"
        :opacity="0.9"
      />
      <VideoGrid
        :width="EXPORT_WIDTH"
        :height="EXPORT_HEIGHT"
        :columns="40"
        :rows="23"
        :translate-x="((scene?.progress ?? 0) * 24) % 24"
        line-color="rgba(131,146,193,0.045)"
      />

      <VideoRect
        :x="36"
        :y="34"
        :width="EXPORT_WIDTH - 72"
        :height="EXPORT_HEIGHT - 68"
        :radius="26"
        fill="rgba(8,12,26,0.72)"
        border-color="rgba(167,180,255,0.17)"
        :border-width="1"
        :z-index="5"
      />
      <VideoText
        :x="70"
        :y="68"
        text="PocketVideo"
        color="#f4f6ff"
        :font-size="16"
        :font-weight="650"
        :z-index="10"
      />
      <VideoText
        :x="194"
        :y="70"
        text="VUE VAPOR / NATIVE EXPORT"
        color="#78829d"
        :font-size="11"
        :font-weight="500"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        :z-index="10"
      />
      <VideoCircle
        :x="808"
        :y="72"
        :size="8"
        fill="#35e1bc"
        shadow-color="#35e1bc"
        :shadow-blur="12"
        :z-index="10"
      />
      <VideoText
        :x="826"
        :y="70"
        :text="`FRAME ${String(scene?.frame ?? 0).padStart(3, '0')}`"
        color="#a6afc8"
        :font-size="11"
        :font-weight="500"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        :z-index="10"
      />

      <VideoRect
        :x="70"
        :y="132"
        :width="174"
        :height="30"
        :radius="15"
        fill="rgba(98,255,221,0.11)"
        :z-index="10"
      />
      <VideoText
        :x="89"
        :y="143"
        text="VUE SFC / VAPOR"
        color="#76efd4"
        :font-size="10"
        :font-weight="600"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        :z-index="11"
      />
      <VideoText
        :x="70"
        :y="190"
        text="Components become"
        color="#f5f7ff"
        :font-size="52"
        :font-weight="700"
        :opacity="reveal"
        :translate-y="(1 - reveal) * 18"
        :z-index="12"
      />
      <VideoText
        :x="70"
        :y="246"
        text="video, natively."
        color="#95a5ff"
        :font-size="52"
        :font-weight="700"
        :opacity="reveal"
        :translate-y="(1 - reveal) * 18"
        :z-index="12"
      />
      <VideoText
        :x="72"
        :y="317"
        text="Vue SFC → Scene Graph → Canvas → VideoEncoder → MP4"
        color="#8c96b0"
        :font-size="15"
        :z-index="12"
      />

      <VideoRect
        :x="632"
        :y="130"
        :width="254"
        :height="270"
        :radius="20"
        fill="rgba(12,18,39,0.86)"
        border-color="rgba(141,158,219,0.18)"
        :border-width="1"
        :z-index="20"
      />
      <VideoText
        :x="654"
        :y="153"
        text="RENDER PIPELINE"
        color="#818dab"
        :font-size="10"
        :font-weight="600"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        :z-index="30"
      />
      <VideoStack
        :x="663"
        :y="187"
        :width="210"
        :height="180"
        direction="column"
        :gap="0"
        :z-index="30"
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
      </VideoStack>
      <VideoText
        :x="654"
        :y="367"
        text="THROUGHPUT"
        color="#66708c"
        :font-size="9"
        :font-weight="500"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        :z-index="32"
      />
      <VideoText
        :x="805"
        :y="365"
        :text="`${Math.round(24 + (scene?.pulse ?? 0) * 7)} FPS`"
        color="#dfe5f6"
        :font-size="12"
        :font-weight="650"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        :z-index="32"
      />

      <VideoProgress
        :x="70"
        :y="448"
        :width="816"
        :height="4"
        :progress="scene?.progress ?? 0"
        fill="#37e3bd"
        fill-to="#ad6cff"
        :z-index="40"
      />
      <VideoCircle
        :x="65 + 816 * (scene?.progress ?? 0)"
        :y="445"
        :size="10"
        fill="#eef2ff"
        shadow-color="#8094ff"
        :shadow-blur="14"
        :z-index="41"
      />
      <VideoText
        :x="70"
        :y="472"
        text="00:00"
        color="#68738f"
        :font-size="9"
        :font-weight="500"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        :z-index="42"
      />
      <VideoText
        :x="686"
        :y="472"
        :width="200"
        :text="`00:05 · ${String(scene?.frame ?? 0).padStart(3, '0')}/${EXPORT_FRAMES - 1}`"
        text-align="right"
        color="#68738f"
        :font-size="9"
        :font-weight="500"
        font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
        :z-index="42"
      />
    </VideoSequence>
  </VideoStage>
</template>
