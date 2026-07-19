<script setup lang="ts">
import { VideoCircle, VideoGroup, VideoLine, VideoText } from "@pocketvideo/vue-vapor";

defineProps<{
  index: number;
  number: string;
  label: string;
  action: string;
  active: boolean;
}>();
</script>

<template>
  <VideoGroup :x="0" :y="0" :width="210" :height="45" :z-index="30">
    <VideoCircle
      :x="0"
      :y="0"
      :size="20"
      :fill="active ? 'rgba(76,226,194,0.22)' : 'rgba(112,124,159,0.10)'"
    />
    <VideoText
      :x="5"
      :y="5"
      :text="number"
      :color="active ? '#69e8cc' : '#67718e'"
      :font-size="8"
      :font-weight="600"
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      :z-index="1"
    />
    <VideoText
      :x="31"
      :y="-1"
      :text="label"
      :color="active ? '#e1e6f5' : '#79839e'"
      :font-size="13"
      :font-weight="550"
      :z-index="1"
    />
    <VideoText
      :x="31"
      :y="15"
      :text="action.toUpperCase()"
      color="#59637e"
      :font-size="9"
      :font-weight="500"
      font-family="ui-monospace, SFMono-Regular, Menlo, monospace"
      :z-index="1"
    />
    <VideoLine
      v-if="index < 3"
      :x1="10"
      :y1="20"
      :x2="10"
      :y2="45"
      :stroke="active ? 'rgba(78,226,195,0.32)' : 'rgba(115,128,165,0.13)'"
    />
  </VideoGroup>
</template>
