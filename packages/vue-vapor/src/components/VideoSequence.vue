<script setup lang="ts">
import { computed } from "vue";
import { useVideoFrame } from "../context.ts";

const props = defineProps<{
  from: number;
  duration: number;
}>();

const frame = useVideoFrame<unknown>();
const localFrame = computed(() => frame.value.frame - props.from);
const active = computed(() => localFrame.value >= 0 && localFrame.value < props.duration);
const progress = computed(() =>
  props.duration <= 1 ? 1 : Math.min(1, Math.max(0, localFrame.value / (props.duration - 1))),
);
</script>

<template>
  <slot v-if="active" :frame="localFrame" :progress="progress" />
</template>
