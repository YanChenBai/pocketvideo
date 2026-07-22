<script lang="ts">
import { defineComponent, h } from "vue";
import { commonProps, type ViewProps } from "./types.ts";

export default defineComponent<ViewProps>(
  (props, { slots }) =>
    () =>
      h("view", props, slots.default?.()),
  {
    name: "View",
    inheritAttrs: false,
    props: [...commonProps, "focusable", "onPress"],
  },
);
</script>
