<script lang="ts">
import { defineComponent, h } from "vue";
import { commonProps, type ImageProps } from "./types.ts";

export default defineComponent<ImageProps>((props) => () => h("image", props), {
  name: "Image",
  inheritAttrs: false,
  props: [...commonProps, "src"],
});
</script>
