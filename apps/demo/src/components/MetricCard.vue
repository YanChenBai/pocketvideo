<script setup lang="ts">
import { Text, View } from "@pocketvideo/vue";

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
  <View
    :style="{
      position: 'absolute',
      left: x,
      top: y,
      width: 352,
      height: 210,
      opacity,
      borderRadius: 24,
      backgroundColor: 'rgba(20,17,33,0.86)',
      borderColor: 'rgba(255,255,255,0.10)',
      borderWidth: 1,
      zIndex: 20,
    }"
  >
    <View
      :style="{
        position: 'absolute',
        left: 24,
        top: 24,
        width: 44,
        height: 8,
        borderRadius: 4,
        backgroundColor: accent,
      }"
    />
    <Text
      :style="{
        position: 'absolute',
        left: 24,
        top: 64,
        color: '#8f899f',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }"
      >{{ label }}</Text
    >
    <Text
      :style="{
        position: 'absolute',
        left: 24,
        top: 100,
        color: '#f4f1fa',
        fontSize: 30,
        fontWeight: 650,
      }"
      >{{ value }}</Text
    >
    <Text :style="{ position: 'absolute', left: 24, top: 153, color: '#9993a8', fontSize: 16 }">{{
      detail
    }}</Text>
  </View>
</template>
