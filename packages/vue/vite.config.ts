import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [vue()],
  pack: {
    entry: {
      index: "src/index.ts",
      canvas: "src/canvas.ts",
      components: "src/components/index.ts",
      input: "src/input.ts",
      styles: "src/styles.ts",
    },
    dts: {
      tsgo: true,
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
