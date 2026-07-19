<script setup lang="ts">
import { VideoRect, VideoText } from "@pocketvideo/vue-vapor";

defineProps<{
  x: number;
  y: number;
  label: string;
  value: string;
  detail: string;
  accent: string;
  opacity: number;
}>();
</script>

<template>
  <VideoRect
    :x="x"
    :y="y"
    :width="352"
    :height="210"
    :opacity="opacity"
    :radius="24"
    fill="rgba(20,17,33,0.86)"
    border-color="rgba(255,255,255,0.10)"
    :border-width="1"
    shadow-color="rgba(0,0,0,0.34)"
    :shadow-blur="22"
    :z-index="20"
  >
    <VideoRect :x="24" :y="24" :width="44" :height="8" :radius="4" :fill="accent" />
    <VideoText
      :x="24"
      :y="64"
      :text="label"
      color="#8f899f"
      :font-size="13"
      :font-weight="600"
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
    />
    <VideoText :x="24" :y="100" :text="value" color="#f4f1fa" :font-size="30" :font-weight="650" />
    <VideoText :x="24" :y="153" :text="detail" color="#9993a8" :font-size="16" />
  </VideoRect>
</template>
