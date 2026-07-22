<script setup lang="ts">
import { Text, View } from "@pocketvideo/vue";

defineProps<{
  index: number;
  number: string;
  label: string;
  action: string;
  active: boolean;
}>();
</script>

<template>
  <View
    :style="{ position: 'absolute', left: 0, top: index * 45, width: 210, height: 45, zIndex: 30 }"
  >
    <View
      :style="{
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: active ? 'rgba(76,226,194,0.22)' : 'rgba(112,124,159,0.10)',
      }"
    />
    <Text
      :style="{
        position: 'absolute',
        left: 5,
        top: 5,
        color: active ? '#69e8cc' : '#67718e',
        fontSize: 8,
        fontWeight: 600,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        zIndex: 1,
      }"
      >{{ number }}</Text
    >
    <Text
      :style="{
        position: 'absolute',
        left: 31,
        top: -1,
        color: active ? '#e1e6f5' : '#79839e',
        fontSize: 13,
        fontWeight: 550,
        zIndex: 1,
      }"
      >{{ label }}</Text
    >
    <Text
      :style="{
        position: 'absolute',
        left: 31,
        top: 15,
        color: '#59637e',
        fontSize: 9,
        fontWeight: 500,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        zIndex: 1,
      }"
      >{{ action.toUpperCase() }}</Text
    >
    <View
      v-if="index < 3"
      :style="{
        position: 'absolute',
        left: 9,
        top: 20,
        width: 2,
        height: 25,
        backgroundColor: active ? 'rgba(78,226,195,0.32)' : 'rgba(115,128,165,0.13)',
      }"
    />
  </View>
</template>
