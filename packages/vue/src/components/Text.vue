<script lang="ts">
import { defineComponent, h } from "vue";
import { commonProps, type TextProps } from "./types.ts";

export default defineComponent<TextProps>(
  (props, { slots }) =>
    () =>
      h("text", props, slots.default?.()),
  {
    name: "Text",
    inheritAttrs: false,
    props: commonProps,
  },
);
</script>
