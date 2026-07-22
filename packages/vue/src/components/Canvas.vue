<script lang="ts">
import type { CanvasRef } from "@pocketvideo/canvas";
import { defineComponent, watchEffect } from "vue";
import { requireSurface } from "../surface-context.ts";

export default defineComponent({
  name: "Canvas",
  props: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  setup(props, { expose, slots }) {
    const surface = requireSurface();
    watchEffect(() => {
      surface.canvas.value.width = props.width;
      surface.canvas.value.height = props.height;
    });
    const exposed: CanvasRef = {
      get native() {
        return surface.canvas.value;
      },
      get width() {
        return surface.canvas.value.width;
      },
      set width(value) {
        surface.canvas.value.width = value;
      },
      get height() {
        return surface.canvas.value.height;
      },
      set height(value) {
        surface.canvas.value.height = value;
      },
      getContext(contextId: string, options?: unknown) {
        return surface.canvas.value.getContext(contextId, options);
      },
    };
    expose(exposed);
    return () => slots.default?.();
  },
});
</script>
